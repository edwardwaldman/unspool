// Minimal MP3 duration reader: walks MPEG audio frames and sums their sample counts.

const BITRATES: Record<string, number[]> = {
  // [version-layer]: kbps by index
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES: Record<number, number[]> = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  2.5: [11025, 12000, 8000],
};

export function mp3Duration(buf: Uint8Array): number | null {
  let i = 0;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    i = 10 + size;
  }
  let seconds = 0;
  let frames = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) {
      i++;
      continue;
    }
    const versionBits = (buf[i + 1] >> 3) & 0x03;
    const layerBits = (buf[i + 1] >> 1) & 0x03;
    if (versionBits === 1 || layerBits !== 1) {
      i++;
      continue; // only MPEG Layer III
    }
    const version = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 2.5;
    const bitrate = BITRATES[version === 1 ? "1-3" : "2-3"][(buf[i + 2] >> 4) & 0x0f];
    const sampleRate = SAMPLE_RATES[version]?.[(buf[i + 2] >> 2) & 0x03];
    if (!bitrate || !sampleRate) {
      i++;
      continue;
    }
    const padding = (buf[i + 2] >> 1) & 0x01;
    const samples = version === 1 ? 1152 : 576;
    const frameLen = Math.floor(((samples / 8) * bitrate * 1000) / sampleRate) + padding;
    if (frameLen < 4) {
      i++;
      continue;
    }
    seconds += samples / sampleRate;
    frames++;
    i += frameLen;
  }
  return frames > 0 ? seconds : null;
}
