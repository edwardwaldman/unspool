// One illustration per beat. Providers sit behind a tiny interface so fal.ai (default) and Replicate
// are interchangeable; with neither configured the renderer falls back to generated gradient title cards.

export type ImageSize = { width: number; height: number };

export type GeneratedImage = {
  data: Buffer;
  contentType: string;
  /** Provider-hosted URL (temporary); lets a standalone render worker fetch the image itself. */
  url?: string;
};

export interface ImageProvider {
  readonly name: string;
  generate(prompt: string, size: ImageSize, signal?: AbortSignal): Promise<GeneratedImage>;
}

/** Appended to every prompt so a reel's images share one look. */
export const IMAGE_STYLE =
  "flat editorial illustration, bold shapes, dark green and chartreuse palette, high contrast, vertical composition, no text, no letters, no words, no logos";

export function styledPrompt(scene: string) {
  return `${scene.trim().replace(/[.\s]+$/, "")}. ${IMAGE_STYLE}`;
}

async function download(url: string, signal?: AbortSignal): Promise<GeneratedImage> {
  if (url.startsWith("data:")) {
    const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(url);
    if (!m) throw new Error("bad data URI from image provider");
    const data = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
    return { data, contentType: m[1] };
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`image download failed (${res.status})`);
  return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? "image/jpeg", url };
}

/** fal.ai FLUX.1 [schnell], synchronous endpoint. */
class FalFlux implements ImageProvider {
  readonly name = "fal";
  constructor(
    private key: string,
    private endpoint = process.env.FAL_IMAGE_ENDPOINT ?? "https://fal.run/fal-ai/flux/schnell",
  ) {}
  async generate(prompt: string, size: ImageSize, signal?: AbortSignal) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { Authorization: `Key ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_size: { width: size.width, height: size.height },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "jpeg",
      }),
      signal,
    });
    if (!res.ok) throw new Error(`fal image failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { images?: { url: string }[] };
    const url = body.images?.[0]?.url;
    if (!url) throw new Error("fal returned no image");
    return download(url, signal);
  }
}

/** Replicate black-forest-labs/flux-schnell (sync via `Prefer: wait`). */
class ReplicateFlux implements ImageProvider {
  readonly name = "replicate";
  constructor(private token: string) {}
  async generate(prompt: string, _size: ImageSize, signal?: AbortSignal) {
    const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: "9:16", num_outputs: 1, num_inference_steps: 4, output_format: "jpg", output_quality: 85 },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`replicate image failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { status?: string; output?: string[] | string; error?: string };
    const url = Array.isArray(body.output) ? body.output[0] : body.output;
    if (!url) throw new Error(`replicate returned no image (${body.status ?? "unknown"}${body.error ? `: ${body.error}` : ""})`);
    return download(url, signal);
  }
}

/** IMAGE_PROVIDER=fal|replicate|none; by default fal when FAL_KEY is set, else Replicate when its token is. */
export function imageProvider(): ImageProvider | null {
  const choice = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (choice === "none") return null;
  const fal = process.env.FAL_KEY;
  const rep = process.env.REPLICATE_API_TOKEN;
  if (choice === "replicate") return rep ? new ReplicateFlux(rep) : null;
  if (choice === "fal") return fal ? new FalFlux(fal) : null;
  if (fal) return new FalFlux(fal);
  if (rep) return new ReplicateFlux(rep);
  return null;
}
