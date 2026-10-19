import type { Metadata } from "next";
import Link from "next/link";
import { LegalH3, LegalHeader, LegalSection, LegalTable, LegalToc, type TocItem } from "@/components/legal/legal-doc";
import { MarketingPage } from "@/components/shell/marketing-page";
import { LIMITS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Unspool collects, why, which providers process it, how long we keep it, and how to exercise your privacy rights, including Do Not Sell or Share.",
};

const EFFECTIVE = "October 18, 2026";
const PRIVACY = "privacy@unspool.cc";
const CONTACT = "hello@unspool.cc";
const ANON_DAYS = LIMITS.anonymousRetentionDays;

const SECTIONS = [
  { id: "short-version", title: "The short version" },
  { id: "who-we-are", title: "Who we are" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "how-we-use", title: "How we use it" },
  { id: "ai-processing", title: "How AI processing works" },
  { id: "legal-bases", title: "Legal bases (EEA and UK)" },
  { id: "sharing", title: "Who we share it with" },
  { id: "cookies", title: "Cookies and storage on your device" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "Security" },
  { id: "your-rights", title: "Your rights and choices" },
  { id: "us-privacy", title: "US state privacy rights (including California)" },
  { id: "do-not-sell", title: "Do Not Sell or Share My Personal Information" },
  { id: "children", title: "Children" },
  { id: "international", title: "International transfers" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
] as const satisfies readonly TocItem[];

type SectionId = (typeof SECTIONS)[number]["id"];

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const n = SECTIONS.findIndex((s) => s.id === id);
  return (
    <LegalSection item={SECTIONS[n]} n={n + 1}>
      {children}
    </LegalSection>
  );
}

const Mail = ({ to }: { to: string }) => <a href={`mailto:${to}`}>{to}</a>;

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <article className="prose-unspool max-w-[720px] pt-14">
        <LegalHeader
          title="Privacy Policy"
          effective={EFFECTIVE}
          intro={
            <p className="mt-6">
              This policy explains what personal information Unspool collects when you use unspool.cc (the &quot;Service&quot;), what we do
              with it, who helps us process it, how long we keep it, and the choices and rights you have. It should be read together with
              our <Link href="/terms">Terms of Service</Link>.
            </p>
          }
        />

        <LegalToc items={[...SECTIONS]} />

        <Section id="short-version">
          <ul>
            <li>Documents you upload are private to your account. They are never made public and never shown to other users.</li>
            <li>We send your document&apos;s content to AI providers only to generate your reels. We don&apos;t use your documents to train AI models, and we don&apos;t sell them.</li>
            <li>We don&apos;t sell or share your personal information for advertising, and we don&apos;t use advertising or analytics trackers.</li>
            <li>Card payments are handled by Stripe. We never see or store your card number.</li>
            <li>You can delete any document at any time, and delete your entire account from your profile. Deleting removes the file, its extracted text, its scripts, audio and videos.</li>
            <li>Anonymous uploads that were never attached to an account or unlocked are deleted automatically after {ANON_DAYS} days.</li>
          </ul>
        </Section>

        <Section id="who-we-are">
          <p>
            Unspool (&quot;Unspool&quot;, &quot;we&quot;, &quot;us&quot;) operates the Service at unspool.cc. For the purposes of data
            protection laws such as the EU and UK General Data Protection Regulation (GDPR), Unspool is the &quot;controller&quot; of the
            personal information described in this policy. You can reach us about anything in this policy at <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="what-we-collect">
          <LegalH3>Information you give us</LegalH3>
          <ul>
            <li>
              <strong>Account details.</strong> Your email address and a password (stored by our authentication provider, Supabase, in hashed
              form; we never see it in plain text). If you sign in with Google, Google shares your email address and basic profile details
              (such as your name and profile picture) with our authentication provider, and those are kept with your login.
            </li>
            <li>
              <strong>Sign-up choices.</strong> When you sign up with email we record when you agreed to the Terms and Privacy Policy, and
              whether you ticked the optional box to receive occasional product updates.
            </li>
            <li>
              <strong>Documents.</strong> The files you upload (such as PDFs, Word and PowerPoint files, text files and images), their file
              name, type and size, and the text we extract from them, including text read from scanned pages or photos. Documents can contain
              any kind of information, including personal information about you or others; you choose what to upload.
            </li>
            <li>
              <strong>Messages.</strong> If you email us, we keep the message and our reply so we can help you.
            </li>
          </ul>
          <LegalH3>Information we generate for you</LegalH3>
          <ul>
            <li>
              <strong>Reels.</strong> For each document: a title, a classification of the kind of document it is (for example study or work
              material, and whether it is a sensitive type such as a contract or medical document, so the scripts stick closely to its
              wording), the plan of reels, each reel&apos;s title, hook and script, voiceover audio files, and, where enabled, rendered video
              files that include AI-generated illustrations and captions.
            </li>
            <li>
              <strong>Processing records.</strong> Page and word counts, processing status, and error messages if something fails.
            </li>
          </ul>
          <LegalH3>Payment information</LegalH3>
          <ul>
            <li>
              Payments are made on Stripe&apos;s checkout pages. Stripe collects your card or other payment details, billing details and
              email, and handles them under its own privacy policy. We never receive or store your full card number.
            </li>
            <li>
              From Stripe we receive and store: your Stripe customer ID, whether you have a subscription, which plan (Plus, Pro or Ultra) it
              is, its status, when the current weekly period starts and ends, whether you have used your one free trial, and a record of each
              purchase (what it was for, the amount, the currency and a Stripe reference). You can see invoices and receipts in the Stripe
              billing portal from your profile. Stripe sends trial and payment receipts; we don&apos;t send extra billing emails.
            </li>
            <li>
              Usage records: to enforce plan limits we keep a ledger of reel credits reserved, returned and topped up, and of free reels
              unlocked (with the document they were for and when). Free-plan limits are counted per account, and upload limits also per
              hashed network address.
            </li>
          </ul>
          <LegalH3>Information collected automatically</LegalH3>
          <ul>
            <li>
              <strong>Hashed IP address and usage records.</strong> When you upload a document or retry one, we take your IP address,
              combine it with a secret value and run it through a one-way hash function. We store only the resulting scrambled code, with
              the document and in a short-lived usage log (which also records your account ID, the document and the time), and use it to
              enforce the daily upload and retry limits and prevent abuse. Our app does not store your raw IP address with your documents.
            </li>
            <li>
              <strong>Visit log.</strong> We log visits to Unspool: your IP address, your approximate country (worked out from the IP
              address), your device and browser type, the site that sent you here, and the pages you open and actions you take (for
              example starting an upload, opening the sign-up form or pressing an upgrade button), with timestamps and, if you are signed in,
              your account. We keep this log for 90 days and then delete it automatically. We use it for security, to prevent abuse (such
              as one person creating many free accounts) and to improve the product. It is not sold and not used for advertising.
            </li>
            <li>
              <strong>Server and request logs.</strong> Like any website, our hosting and infrastructure providers (Vercel and Supabase)
              automatically log technical information about requests, such as IP address, browser type, the page or API requested, the time
              and any errors. Our authentication provider also keeps a log of sign-in events, which can include the IP address used. We use these logs to keep the Service running, debug problems and protect it from abuse.
            </li>
            <li>
              <strong>Cookies and device storage.</strong> A small number of cookies and browser storage entries, described in section 8.
              We do not use advertising cookies, tracking pixels or third-party analytics.
            </li>
          </ul>
          <p>
            We don&apos;t buy personal information about you from data brokers, and we don&apos;t combine your information with data from
            other websites.
          </p>
        </Section>

        <Section id="how-we-use">
          <p>We use personal information only to run Unspool. Specifically, to:</p>
          <ul>
            <li>create and secure your account, sign you in, confirm your email address with a code, and reset your password;</li>
            <li>store your documents and turn them into reels: extract the text, plan the reels, write scripts, generate voiceovers, illustrations and videos;</li>
            <li>show you your library and feed, and remember which reels are available to you;</li>
            <li>process payments, unlock documents, manage subscriptions, and keep records we need for accounting and tax;</li>
            <li>enforce upload limits and our Terms, and detect and prevent fraud, abuse and security incidents;</li>
            <li>diagnose and fix errors and keep the Service reliable;</li>
            <li>send you service emails (such as sign-up codes and password resets) and respond to your messages;</li>
            <li>if you opted in, send you occasional product updates, which you can stop at any time; and</li>
            <li>comply with the law and respond to lawful requests.</li>
          </ul>
          <p>
            We do not use your documents or reels for advertising, we do not build advertising profiles, and we do not make decisions about
            you based solely on automated processing that have legal or similarly significant effects on you.
          </p>
        </Section>

        <Section id="ai-processing">
          <p>Generating reels means sending parts of your content to AI providers that work on our behalf. Here is exactly what goes where:</p>
          <ul>
            <li>
              <strong>Reading the document.</strong> We extract text from most files on our own servers. If a PDF looks scanned, or you upload
              a photo, we send the file itself to Anthropic&apos;s Claude models to read the text from the image.
            </li>
            <li>
              <strong>Planning and writing.</strong> We send the extracted text (up to our length limit) and the file name to Anthropic&apos;s
              Claude models, which plan the reels and write each script.
            </li>
            <li>
              <strong>Voiceover.</strong> We send each script&apos;s spoken lines, but not your original document, to our text-to-speech
              provider (OpenAI, or ElevenLabs if we have configured it) to produce the audio.
            </li>
            <li>
              <strong>Illustrations.</strong> The AI writes a short scene description for each moment of a reel, based on your document&apos;s
              content. We send those descriptions, but not the document itself, to our image-generation provider (fal.ai or Replicate) to create illustrations. These are combined with
              the voiceover and captions into a video, which we store in your account.
            </li>
            <li>
              <strong>Your device.</strong> If a reel has no generated voiceover, the player can read the script aloud using your device&apos;s
              built-in text-to-speech voice. Depending on your device and browser, that voice may be provided by your operating system or
              browser vendor.
            </li>
          </ul>
          <LegalH3>Training</LegalH3>
          <p>
            We do not train AI models, and we do not use your documents, extracted text or reels to train or improve any AI model. We use our
            providers&apos; paid API services, which process your data to return results to us. Under their published API and business terms,
            these providers generally do not use data sent through their APIs to train their models by default, and may keep it for a
            limited period for purposes such as abuse and safety monitoring or as required by law. Each provider&apos;s own terms and privacy
            policy explain the details.
          </p>
          <LegalH3>Accuracy</LegalH3>
          <p>
            Reels are generated automatically and can contain mistakes. If a reel misstates something about you, you can delete the document, or
            contact us. See the <Link href="/terms#ai-output">Terms</Link> for more on relying on AI output.
          </p>
        </Section>

        <Section id="legal-bases">
          <p>If you are in the European Economic Area, the United Kingdom or Switzerland, we rely on these legal bases:</p>
          <LegalTable
            head={["Purpose", "Legal basis"]}
            rows={[
              ["Providing your account, processing your documents into reels, storing your library", "Performing our contract with you (the Terms)"],
              ["Taking payments, unlocking documents, managing subscriptions", "Performing our contract with you"],
              ["Keeping purchase, accounting and tax records", "Complying with legal obligations"],
              ["Hashed IP for upload limits, the visit log, logs, fraud and abuse prevention, security, debugging, improving the product", "Our legitimate interests in running a secure, reliable and affordable service, balanced against your rights"],
              ["Service emails (sign-up codes, password resets, important notices)", "Performing our contract with you"],
              ["Optional product update emails", "Your consent, which you can withdraw at any time"],
              ["Storing preferences and sign-in state on your device", "Strictly necessary for the service you asked for; your preferences are stored at your request"],
              ["Responding to legal requests and enforcing our Terms", "Legal obligations and our legitimate interests"],
            ]}
          />
          <p>
            Documents you upload may contain special categories of data (such as health information) about you or others. We process such
            content only because you chose to upload it to be turned into reels for you, and only for that purpose. Please don&apos;t upload
            other people&apos;s sensitive information unless you have the right to.
          </p>
        </Section>

        <Section id="sharing">
          <p>
            We share personal information only with the service providers (&quot;sub-processors&quot;) that help us run Unspool, and only what
            each one needs for its job. They process it on our behalf and under contract terms that restrict how they may use it.
          </p>
          <LegalTable
            head={["Provider", "What it does", "What it receives"]}
            rows={[
              ["Supabase", "Database, user accounts and sign-in, private file storage", "Account details, documents, extracted text, scripts, audio and video files, purchase records, hashed IPs, request logs"],
              ["Vercel", "Hosts the website and runs our servers and scheduled jobs", "All data passing through the app while it is processed, request logs including IP addresses"],
              ["Anthropic (Claude)", "Reads scanned files and photos, plans reels and writes scripts", "Document text and file name; the file itself when text must be read from an image"],
              ["OpenAI, or ElevenLabs if configured", "Text-to-speech voiceovers", "The spoken lines of each script"],
              ["fal.ai or Replicate", "Generates illustrations for reel videos", "AI-written scene descriptions based on your document (not the document itself)"],
              ["Stripe", "Payments, subscriptions, billing portal, receipts", "Email, account reference, the item purchased, payment and billing details you enter"],
              ["Resend", "Delivers our account emails (sign-up codes, password resets) on behalf of our authentication provider", "Your email address and the email content"],
              ["Google (only if you choose it)", "Sign in with Google", "The sign-in request; Google shares your email and basic profile with us"],
            ]}
          />
          <p>
            Video rendering runs on our own hosting infrastructure, which receives the illustrations and short-lived links to the voiceover
            audio only to assemble the video.
          </p>
          <p>We may also disclose information:</p>
          <ul>
            <li>if the law requires it, or in response to a valid legal request such as a court order, after checking that it is lawful;</li>
            <li>where necessary to protect the rights, safety or property of our users, the public or Unspool, or to investigate fraud or abuse; and</li>
            <li>to a buyer or successor if Unspool is involved in a merger, acquisition or sale of assets, in which case this policy will continue to protect your information and we will tell you before it becomes subject to a different policy.</li>
          </ul>
          <p>We never sell your personal information, and we never share it with advertisers or data brokers.</p>
        </Section>

        <Section id="cookies">
          <p>
            We use only the cookies and browser storage needed for Unspool to work and to remember your own settings. We don&apos;t use
            advertising cookies, cross-site tracking or third-party analytics, so there is no cookie banner asking you to accept tracking.
          </p>
          <LegalTable
            head={["Name", "Type", "Purpose", "How long"]}
            rows={[
              ["sb-…-auth-token", "Cookie (Supabase)", "Keeps you signed in and refreshes your session securely", "Until you sign out, or the session expires"],
              ["unspool_vid", "Cookie, HTTP-only", "A random identifier for your browser, so the visit log can tell a returning visit from a new one", "1 year"],
              ["unspool_visit", "Session storage", "Groups the pages you open in one tab into one visit", "Until you close the tab"],
              ["unspool_anon", "Cookie, HTTP-only", "A random identifier for your browser, so a document started before you signed in can be attached to your account when you sign in", "1 year"],
              ["unspool:prefs", "Local storage", "Your player settings: mute, playback speed, and whether to use your device's voice", "Until you clear your browser storage"],
              ["unspool:saved", "Local storage", "Reels you have hearted (saved) on this device", "Until you clear your browser storage"],
              ["unspool / pending-upload", "IndexedDB", "If you pick a file and then sign in with Google, holds that file in your browser during the redirect so the upload can continue", "Removed when it is picked back up; ignored and discarded if older than 30 minutes"],
            ]}
          />
          <p>
            Local storage and IndexedDB stay on your device and are not sent to us. Stripe sets its own cookies on its checkout and billing
            pages to process payments and prevent fraud, and Google does the same if you sign in with Google; those are governed by their
            own policies. You can clear cookies and storage in your browser settings at any time, but if you block the sign-in cookie you
            won&apos;t be able to stay signed in.
          </p>
        </Section>

        <Section id="retention">
          <p>We keep personal information only for as long as we need it:</p>
          <LegalTable
            head={["Information", "How long we keep it"]}
            rows={[
              ["Account details", "Until you delete your account"],
              ["Documents, extracted text, scripts, audio and videos", "Until you delete the document or your account. Deleting a document removes the original file, extracted text, scripts, voiceover audio and videos"],
              ["Uploads never attached to an account", `Uploads made without an account that were never unlocked are deleted automatically by a daily clean-up once they are more than ${ANON_DAYS} days old`],
              ["Hashed IP stored with a document", "Deleted with the document"],
              ["Visit log (IP address, approximate country, device and browser, pages and actions)", "Deleted automatically by the daily clean-up after 90 days"],
              ["Usage log (account ID, hashed IP, document reference, time of each upload or retry)", "Deleted automatically by the daily clean-up after 3 days. The one exception: a record that your account has uploaded (account ID and time only, with the hashed IP and document reference removed after 3 days) is kept while your account exists so the one-free-document limit works, and is deleted when you delete your account"],
              ["Purchase records", "Kept for accounting and tax. When you delete your account, they are kept without the link to your account"],
              ["Stripe records", "Stripe keeps payment and customer records in line with its own legal and regulatory obligations"],
              ["Server and request logs", "Kept by our hosting providers for limited periods under their retention settings"],
              ["Emails with us", "As long as needed to deal with your request, and then for a reasonable period in case you follow up"],
              ["Data held by AI providers", "Only for the limited periods their API terms allow, as described in section 5"],
            ]}
          />
          <LegalH3>Deleting your account</LegalH3>
          <p>
            You can delete your account at any time from your profile. When you do, we cancel any active subscription immediately, delete
            every document along with its original file, extracted text, scripts, voiceover audio and videos, and then delete your login and
            profile. This can&apos;t be undone. Purchase records are kept without the link to your account, as described above. Deleted data
            may remain for a short time in our providers&apos; backups and logs until they are overwritten in their normal cycle.
          </p>
        </Section>

        <Section id="security">
          <p>We take reasonable technical and organisational measures to protect your information, including:</p>
          <ul>
            <li>encryption in transit (HTTPS) for every connection to the Service;</li>
            <li>private, access-controlled storage for documents, audio and video. Files are never publicly listed; playback uses signed links that expire after a few hours;</li>
            <li>database rules and server-side checks so that each account can only access its own documents and reels;</li>
            <li>passwords handled by our authentication provider and stored only in hashed form;</li>
            <li>card payments handled entirely by Stripe, with payment notifications verified by cryptographic signature;</li>
            <li>IP addresses used for limits stored only as salted one-way hashes, and raw IP addresses in the visit log kept server-side only, for 90 days; and</li>
            <li>secrets and provider keys kept on the server, never in your browser.</li>
          </ul>
          <p>
            No system is perfectly secure. Please use a strong, unique password. If we become aware of a security incident that affects your
            personal information, we will notify you and the authorities where the law requires. To report a vulnerability, email{" "}
            <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="your-rights">
          <p>Wherever you are, you can:</p>
          <ul>
            <li>delete any document from your library, and delete your entire account from your profile;</li>
            <li>change your password from your profile;</li>
            <li>stop product update emails at any time by using the unsubscribe link or emailing us; and</li>
            <li>clear the preferences stored on your device through your browser settings.</li>
          </ul>
          <LegalH3>EEA, UK and Swiss residents</LegalH3>
          <p>Under the GDPR and similar laws, you have the right to:</p>
          <ul>
            <li><strong>access</strong> the personal information we hold about you and get a copy;</li>
            <li><strong>rectify</strong> information that is inaccurate or incomplete;</li>
            <li><strong>erase</strong> your information (&quot;the right to be forgotten&quot;);</li>
            <li><strong>restrict</strong> how we process it in certain circumstances;</li>
            <li><strong>data portability</strong>, meaning a copy of information you gave us in a machine-readable format;</li>
            <li><strong>object</strong> to processing based on our legitimate interests;</li>
            <li><strong>withdraw consent</strong> at any time, where we rely on it, without affecting processing that happened before; and</li>
            <li><strong>complain</strong> to your local data protection authority (for example, the Information Commissioner&apos;s Office in the UK). We would appreciate the chance to help first.</li>
          </ul>
          <LegalH3>How to make a request</LegalH3>
          <p>
            Email <Mail to={PRIVACY} /> from the address on your account and tell us what you would like. We may need to confirm your identity
            before acting on a request, and will only ask for what we need to do that. We will respond within one month (GDPR) or 45 days
            (US state laws), and will tell you if we need more time as the law allows. Requests are free unless they are clearly unfounded or
            excessive.
          </p>
        </Section>

        <Section id="us-privacy">
          <p>
            If you live in California or another US state with a comprehensive privacy law (such as Colorado, Connecticut, Virginia, Texas or
            Oregon), you have the following rights, subject to some exceptions:
          </p>
          <ul>
            <li><strong>Right to know / access</strong> the categories and specific pieces of personal information we have collected about you, where it came from, why we use it, and who we disclose it to;</li>
            <li><strong>Right to delete</strong> personal information we collected from you;</li>
            <li><strong>Right to correct</strong> inaccurate personal information;</li>
            <li><strong>Right to opt out</strong> of the sale or sharing of personal information, targeted advertising and certain profiling. We don&apos;t do any of these (see section 13);</li>
            <li><strong>Right to limit</strong> the use of sensitive personal information. We only use any sensitive information contained in your documents to provide the Service you asked for, so there is nothing further to limit;</li>
            <li><strong>Right to non-discrimination</strong>: we won&apos;t deny you the Service, charge you a different price or give you a lower quality of service because you exercised these rights; and</li>
            <li><strong>Right to appeal</strong>: if we decline your request, you can reply to ask us to reconsider, and if you are still unhappy you can contact your state attorney general.</li>
          </ul>
          <p>
            You can make a request by emailing <Mail to={PRIVACY} />. You may use an authorised agent; we may ask the agent for proof of
            your permission and ask you to verify your identity directly.
          </p>
          <LegalH3>Categories of personal information (last 12 months)</LegalH3>
          <LegalTable
            head={["Category", "Examples", "Disclosed to"]}
            rows={[
              ["Identifiers", "Email address, account ID, hashed IP address, Stripe customer ID", "Supabase, Vercel, Stripe, Resend, Google (if used)"],
              ["Commercial information", "Plan, subscription status, reel credit usage, purchase records", "Supabase, Stripe"],
              ["Internet or network activity", "Request logs, processing status", "Vercel, Supabase"],
              ["User content (may include sensitive information)", "Uploaded documents, extracted text, generated scripts, audio and video", "Supabase, Vercel, Anthropic, our text-to-speech and image providers (in the limited form described in section 5)"],
              ["Account credentials", "Email and password (stored hashed)", "Supabase"],
            ]}
          />
          <p>
            We collect this information from you directly, from your device, and from Stripe and Google as described above. We use it for the
            business purposes listed in section 4 and disclose it only to service providers for those purposes. We do not sell it or share
            it for cross-context behavioural advertising, and we have not done so in the last 12 months.
          </p>
        </Section>

        <Section id="do-not-sell">
          <p>
            <strong>We do not sell your personal information, and we do not share it for cross-context behavioural advertising</strong>, as
            those terms are defined in the California Consumer Privacy Act as amended by the CPRA and similar state laws. We have no
            advertising partners, use no advertising cookies or tracking pixels, and do not let third parties collect information about you
            on our site for their own advertising. We do not knowingly sell or share the personal information of anyone under 16.
          </p>
          <p>
            Because we don&apos;t sell or share personal information, there is nothing you need to opt out of. If your browser sends a Global
            Privacy Control (GPC) signal, we treat it as a valid request to opt out of sale and sharing, which matches what we already do for
            everyone. If you would like written confirmation, or want to make any other privacy request, email <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="children">
          <p>
            Unspool is not directed at children under 13, and we do not knowingly collect personal information from children under 13. Where
            local law sets a higher age for consenting to online services (up to 16 in parts of the EEA), users below that age need a parent
            or guardian&apos;s consent. Users under 18 need a parent or guardian&apos;s permission to use the Service, as explained in the{" "}
            <Link href="/terms#eligibility">Terms</Link>.
          </p>
          <p>
            If you believe a child under 13 (or under the applicable age) has given us personal information without the required consent,
            contact <Mail to={PRIVACY} /> and we will delete it.
          </p>
        </Section>

        <Section id="international">
          <p>
            Unspool and the providers listed above are based in, or process data in, the United States and other countries that may not have
            the same data protection laws as where you live. When we transfer personal information from the EEA, UK or Switzerland, we rely on
            appropriate safeguards, such as the European Commission&apos;s Standard Contractual Clauses (and the UK equivalents) included in
            our providers&apos; data processing terms, or a provider&apos;s certification under the EU-US Data Privacy Framework and its UK and
            Swiss extensions where applicable. You can ask us for more information about these safeguards at <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="changes">
          <p>
            We will update this policy when our practices change, for example if we add a feature or a new provider. The date at the top shows
            when it last changed. If a change is significant, we will tell signed-in users by email or with a notice in the app before it
            takes effect, and where the law requires your consent to a change, we will ask for it.
          </p>
        </Section>

        <Section id="contact">
          <p>
            Privacy questions and requests: <Mail to={PRIVACY} />. Everything else: <Mail to={CONTACT} />.
          </p>
          <p>Unspool · unspool.cc</p>
        </Section>
      </article>
    </MarketingPage>
  );
}
