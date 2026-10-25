import { mp3Duration } from "./mp3";
import { estimateDuration, estimateWordFractions, splitWords } from "./timing";

export type TtsResult = {
  audio: Buffer;
  duration: number;
  words: number[];
  exact: boolean;
};

type Provider = "openai" | "elevenlabs" | "none";

export function ttsProvider(): Provider {
  const p = process.env.TTS_PROVIDER as Provider | undefined;
  if (p === "none") return "none";
  if (p === "elevenlabs" || (!p && process.env.ELEVENLABS_API_KEY)) return process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "none";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

const VOICE_STYLE =
  "Energetic, warm, confident short-form creator voice. Fast but clear, like a top TikTok explainer. Punch the key words, smile in the voice, no announcer cadence.";

async function openaiSpeech(text: string): Promise<TtsResult> {
  /** Consistent voice by default; set OPENAI_TTS_MODEL=gpt-4o-mini-tts for the styled (but less consistent) one. */
  const model = process.env.OPENAI_TTS_MODEL?.trim() || "tts-1-hd";
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice: process.env.OPENAI_TTS_VOICE ?? "nova",
      input: text,
      // Only the gpt-4o voices take style instructions, and they read them a little differently on every call,
      // which made one reel's segments sound like different takes. tts-1-hd has no style prompt: same voice every time.
      ...(model.startsWith("gpt-4o") ? { instructions: VOICE_STYLE } : {}),
      speed: Number(process.env.OPENAI_TTS_SPEED ?? 1.05),
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const audio = Buffer.from(await res.arrayBuffer());
  const duration = mp3Duration(audio) ?? estimateDuration(text);
  // OpenAI's speech API returns no timings; estimates drift (pauses, numbers, symbols), so captions lagged the
  // voice. Transcribe the clip with word timestamps and line them up with the script instead.
  const timed = await wordTimesFromAudio(audio, text, duration).catch((err) => {
    console.error("[tts] word timing failed, using estimates", (err as Error).message?.slice(0, 200));
    return null;
  });
  return { audio, duration, words: timed ?? estimateWordFractions(text), exact: Boolean(timed) };
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const SPOKEN: Record<string, string> = { "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten" };

/**
 * Word start times (fractions of the clip) for `text`, from a word-level transcription of the audio. Script
 * words are matched in order to transcript words (allowing for numbers read out and symbols the transcript
 * spells differently); unmatched words are spread between their matched neighbours. Null when too few match.
 */
async function wordTimesFromAudio(audio: Buffer, text: string, duration: number): Promise<number[] | null> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: "audio/mpeg" }), "clip.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("prompt", text.slice(0, 800));
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`transcription ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const body = (await res.json()) as { words?: { word: string; start: number }[] };
  const heard = (body.words ?? []).map((w) => ({ w: norm(w.word), start: w.start }));
  const script = splitWords(text);
  if (!heard.length || !script.length || !(duration > 0)) return null;

  const starts: (number | null)[] = new Array(script.length).fill(null);
  let j = 0;
  script.forEach((word, i) => {
    const want = norm(word);
    if (!want) return;
    const alt = SPOKEN[want];
    // Look a few words ahead: the transcript may split ("f of 2") or merge words the script writes differently.
    for (let k = j; k < Math.min(heard.length, j + 4); k++) {
      const h = heard[k].w;
      if (h === want || (alt && h === alt) || (want.length > 3 && (h.startsWith(want.slice(0, 4)) || want.startsWith(h) && h.length > 3))) {
        starts[i] = heard[k].start;
        j = k + 1;
        return;
      }
    }
  });
  const matched = starts.filter((s) => s !== null).length;
  if (matched < Math.max(2, script.length * 0.6)) return null;

  // Fill the gaps: spread unmatched words evenly between the matched times on either side.
  const est = estimateWordFractions(text).map((f) => f * duration);
  const out = starts.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== null) continue;
    let a = i - 1;
    while (a >= 0 && out[a] === null) a--;
    let b = i + 1;
    while (b < out.length && starts[b] === null) b++;
    const t0 = a >= 0 ? (out[a] as number) : 0;
    const t1 = b < out.length ? (starts[b] as number) : duration;
    const e0 = a >= 0 ? est[a] : 0, e1 = b < out.length ? est[b] : duration;
    out[i] = t0 + ((est[i] - e0) / Math.max(1e-6, e1 - e0)) * (t1 - t0);
  }
  // Monotonic and inside the clip.
  let last = 0;
  return out.map((s) => {
    last = Math.max(last, Math.min(duration, s as number));
    return Math.min(1, last / duration);
  });
}

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

async function elevenlabsSpeech(text: string): Promise<TtsResult> {
  const voice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { audio_base64: string; alignment?: Alignment; normalized_alignment?: Alignment };
  const audio = Buffer.from(body.audio_base64, "base64");
  const duration = mp3Duration(audio) ?? estimateDuration(text);
  const al = body.alignment;
  if (!al || !al.characters.length) {
    return { audio, duration, words: estimateWordFractions(text), exact: false };
  }
  // Word starts = start time of the first character after whitespace.
  const starts: number[] = [];
  let inWord = false;
  al.characters.forEach((ch, i) => {
    const space = /\s/.test(ch);
    if (!space && !inWord) starts.push(al.character_start_times_seconds[i]);
    inWord = !space;
  });
  const wordCount = splitWords(text).length;
  if (starts.length !== wordCount) return { audio, duration, words: estimateWordFractions(text), exact: false };
  return { audio, duration, words: starts.map((s) => Math.min(1, s / duration)), exact: true };
}

/** Synthesize one segment's voiceover. Returns null when no TTS provider is configured. */
/**
 * The voiceover for one segment. A provider that fails (out of credits, bad key, outage) falls through to
 * the other configured provider, then to null: the reel is still made, with captions timed from estimates,
 * instead of failing outright.
 */
export async function synthesize(text: string): Promise<TtsResult | null> {
  const provider = ttsProvider();
  if (provider === "none") return null;
  const order = provider === "elevenlabs" ? ["elevenlabs", "openai"] : ["openai", "elevenlabs"];
  for (const p of order) {
    if (p === "openai" && !process.env.OPENAI_API_KEY) continue;
    if (p === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) continue;
    try {
      return p === "elevenlabs" ? await elevenlabsSpeech(text) : await openaiSpeech(text);
    } catch (err) {
      console.error(`[tts] ${p} failed, trying the next voice`, (err as Error).message?.slice(0, 300));
    }
  }
  return null;
}
