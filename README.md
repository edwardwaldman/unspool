# Unspool

**Drop a doc. Unspool it.** — [unspool.cc](https://unspool.cc)

Drag in any document (class notes, a textbook chapter, a work PDF, a contract) and Unspool turns it into
10 short, swipeable, Instagram-style reels with hooks, voiceover, animated visuals and a quick quiz.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Motion**, **Supabase** (Auth, Postgres, Storage),
**Vercel** (hosting, background functions, cron), **Stripe** (Checkout, Portal, webhooks), **Claude** (plan + scripts + OCR),
**OpenAI TTS or ElevenLabs** (voiceover).

Try the viewer with no backend at all: `npm run dev` → <http://localhost:3000/s/demo>.

## How it works

```
upload (browser → Supabase Storage via signed URL)
  └─ POST /api/documents/:id/start
       └─ job: process   (own function invocation)
            extract text (unpdf / mammoth / pptx XML; Claude vision OCR for scans & photos)
            plan 10 reels with Claude  → reels rows (titles + hooks = free preview)
            └─ job: reel 1 (script with Claude → TTS per segment → Storage)
                 └─ jobs: reels 2–10 in parallel (reuse the warm prompt cache)
browser polls GET /api/documents/:id every 2s and plays reels as they become ready
```

* The document text + system prompt are a shared, cached prompt prefix: the plan call writes the cache and the
  10 script calls read it, so a full document costs ~2.25× its tokens instead of ~11×.
* Scripts are strict JSON (`src/lib/schema.ts`) via structured outputs, validated with zod, retried once.
* Voiceover is one clip per segment (beats, quiz question, quiz answer, outro). ElevenLabs gives exact word
  timestamps; OpenAI TTS timing is estimated from word length + punctuation and rescaled to the real clip length.
  With no TTS key, reels play silently with captions (or with the device's built-in voice).
* Reels render live in the browser from JSON + audio — no server-side video.
* Stuck jobs self-heal when a client polls (`healIfStuck`).

Key files: `src/lib/pipeline.ts`, `src/lib/claude.ts`, `src/lib/tts.ts`, `src/components/reel/*` (player),
`src/components/reel/use-playback.ts` (timing engine), `supabase/migrations/*` (schema + RLS + buckets).

## Setup

1. **Supabase** — create a project, then apply `supabase/migrations/20261015000000_init.sql`
   (SQL editor, or `supabase db push`). It creates the tables, RLS policies, and the private `documents` and `audio` buckets.
   * Auth → URL configuration: Site URL `https://unspool.cc`; add redirect URL `https://unspool.cc/auth/callback`
     (and `http://localhost:3000/auth/callback` for dev).
   * Auth → Providers: enable **Email** (magic link) and **Google** (Google Cloud OAuth client; callback
     `https://<project>.supabase.co/auth/v1/callback`).
2. **Stripe** — add `STRIPE_SECRET_KEY`. Create a webhook endpoint at `https://unspool.cc/api/stripe/webhook` for
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created|updated|deleted`
   and set `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal. Prices are inline by default (`$2.49` per doc, `$7.99/mo`);
   override with `PRICE_*_CENTS` or `STRIPE_PRICE_SUBSCRIPTION`.
3. **AI** — `ANTHROPIC_API_KEY`, plus `OPENAI_API_KEY` (or `ELEVENLABS_API_KEY`) for voiceover.
4. **Vercel** — import the repo, add the env vars from `.env.example`, set `CRON_SECRET` (daily cleanup of anonymous
   uploads older than 7 days) and `JOB_SECRET`. If Deployment Protection is on for previews, enable
   "Protection Bypass for Automation" so internal job calls work (`VERCEL_AUTOMATION_BYPASS_SECRET` is picked up automatically).
5. **Domain** — add `unspool.cc` in Vercel → Domains, then at Namecheap set an `A` record `@ → 76.76.21.21` and a
   `CNAME` `www → cname.vercel-dns.com` (or switch nameservers to Vercel).

```bash
cp .env.example .env.local   # fill in
npm install
npm run dev
```

## Product rules (from the spec)

* Free: reel 1 of every document + all 10 titles/hooks. Unlock per document or subscribe for unlimited.
* `FREE_UPLOADS_PER_DAY` (default 3) per IP / device / account; subscribers get `SUBSCRIBER_UPLOADS_PER_DAY`.
* `GENERATE_LOCKED_REELS_EAGERLY=false` defers reels 2–10 until unlock to cut AI cost.
* Files are private (service-role access behind per-request ownership checks, RLS on every table),
  deletable from the reel menu or library, and anonymous never-unlocked uploads auto-delete after 7 days.
