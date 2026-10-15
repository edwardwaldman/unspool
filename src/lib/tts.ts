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
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE ?? "coral",
      input: text,
      instructions: VOICE_STYLE,
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const audio = Buffer.from(await res.arrayBuffer());
  return {
    audio,
    duration: mp3Duration(audio) ?? estimateDuration(text),
    words: estimateWordFractions(text),
    exact: false,
  };
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
export async function synthesize(text: string): Promise<TtsResult | null> {
  const provider = ttsProvider();
  if (provider === "none") return null;
  return provider === "elevenlabs" ? elevenlabsSpeech(text) : openaiSpeech(text);
}
