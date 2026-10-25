import type { Metadata } from "next";
import Link from "next/link";
import { LegalH3, LegalHeader, LegalSection, LegalTable, LegalToc, type TocItem } from "@/components/legal/legal-doc";
import { MarketingPage } from "@/components/shell/marketing-page";
import { LIMITS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
  description:
    "What Unspool collects, why, which providers process it, what share links make public, how long we keep it, and how to exercise your privacy rights, including Do Not Sell or Share.",
};

const EFFECTIVE = "October 25, 2026";
const PRIVACY = "privacy@unspool.cc";
const CONTACT = "hello@unspool.cc";
const ANON_DAYS = LIMITS.anonymousRetentionDays;

const SECTIONS = [
  { id: "short-version", title: "The short version" },
  { id: "who-we-are", title: "Who we are and scope" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "sources", title: "Where it comes from" },
  { id: "how-we-use", title: "How we use it" },
  { id: "ai-processing", title: "How AI processing works" },
  { id: "share-links", title: "Share links: what others can see" },
  { id: "legal-bases", title: "Legal bases (EEA and UK)" },
  { id: "sharing", title: "Who we share it with" },
  { id: "cookies", title: "Cookies and storage on your device" },
  { id: "emails", title: "Emails we send" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "Security and breaches" },
  { id: "others-data", title: "Other people's information in your documents" },
  { id: "your-rights", title: "Your rights and choices" },
  { id: "us-privacy", title: "US state privacy rights (including California)" },
  { id: "do-not-sell", title: "Do Not Sell or Share My Personal Information" },
  { id: "other-regions", title: "Other regions" },
  { id: "children", title: "Children" },
  { id: "international", title: "International transfers" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
] as const satisfies readonly TocItem[];

type SectionId = (typeof SECTIONS)[number]["id"];

const sec = (id: SectionId) => SECTIONS.findIndex((s) => s.id === id) + 1;

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const n = SECTIONS.findIndex((s) => s.id === id);
  return (
    <LegalSection item={SECTIONS[n]} n={n + 1}>
      {children}
    </LegalSection>
  );
}

const Mail = ({ to }: { to: string }) => <a href={`mailto:${to}`}>{to}</a>;
const See = ({ id }: { id: SectionId }) => <a href={`#${id}`}>section {sec(id)}</a>;

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <article className="prose-unspool legal-dense max-w-[760px] pt-14">
        <LegalHeader
          title="Privacy Policy"
          effective={EFFECTIVE}
          intro={
            <>
              <p className="mt-6">
                This policy explains what personal information Unspool collects when you use unspool.cc and anything we make available through
                it (the &quot;Service&quot;), what we do with it, which companies help us process it, what becomes visible to others when you
                share a reel, how long we keep it, how we protect it, and the choices and rights you have. It should be read together with our{" "}
                <Link href="/terms">Terms of Service</Link>, which use the same defined words.
              </p>
              <p>
                &quot;Personal information&quot; (or &quot;personal data&quot;) means information that identifies, relates to or could
                reasonably be linked with you. It does not include information that has been de-identified or aggregated so it can no longer be
                linked to you.
              </p>
            </>
          }
        />

        <LegalToc items={[...SECTIONS]} />

        <Section id="short-version">
          <ul>
            <li>Documents you upload are private to your account. Nobody else sees them, and we never publish them.</li>
            <li>
              A reel only becomes visible to others if you create a Share Link for it. Anyone with that link can watch that one reel (and, if
              you choose, see your document&apos;s title). You can turn a link off at any time (<See id="share-links" />).
            </li>
            <li>We send your document&apos;s content to AI providers only to generate your reels. We don&apos;t use your documents to train AI models, and we don&apos;t sell them.</li>
            <li>We don&apos;t sell or share your personal information for advertising, and we don&apos;t use advertising trackers or third-party analytics.</li>
            <li>We keep a first-party log of visits (including IP address) for 90 days, for security, abuse prevention and improving the product.</li>
            <li>Card payments are handled by Stripe. We never see or store your card number.</li>
            <li>You can delete any document at any time, and delete your entire account from your profile. Deleting removes the file, its extracted text, its scripts, audio, videos and Share Links.</li>
            <li>Anonymous uploads that were never attached to an account or unlocked are deleted automatically after {ANON_DAYS} days.</li>
          </ul>
        </Section>

        <Section id="who-we-are">
          <p>
            Unspool (&quot;Unspool&quot;, &quot;we&quot;, &quot;us&quot;) operates the Service at unspool.cc. For the purposes of data
            protection laws such as the EU and UK General Data Protection Regulation (GDPR), Unspool is the &quot;controller&quot; of the
            personal information described in this policy, and the companies listed in <See id="sharing" /> act as our processors. You can
            reach us about anything in this policy at <Mail to={PRIVACY} />. We have not appointed a data protection officer, as we are not
            required to; privacy questions are handled directly by the people who run Unspool.
          </p>
          <p>
            This policy covers the Service and our communications with you. It doesn&apos;t cover third-party websites or services that we link
            to or that you use alongside Unspool (such as Google, Stripe&apos;s own pages, or a social network where you post a Share Link),
            which have their own policies.
          </p>
        </Section>

        <Section id="what-we-collect">
          <LegalH3>Information you give us</LegalH3>
          <ul>
            <li>
              <strong>Account details.</strong> Your email address and a password (stored by our authentication provider, Supabase, in hashed
              form; we never see it in plain text). If you sign in with Google, Google shares your email address and basic profile details (such
              as your name and profile picture) with our authentication provider, and those are kept with your login.
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
              <strong>Instructions and settings.</strong> Edit requests you write for a reel (Pro and Ultra), the reel style you choose, and the
              options you pick when sharing (such as whether to show your document&apos;s title).
            </li>
            <li>
              <strong>Messages.</strong> If you email us, we keep the message, any attachments and our reply so we can help you.
            </li>
          </ul>
          <LegalH3>Information we generate for you</LegalH3>
          <ul>
            <li>
              <strong>Reels.</strong> For each document: a title, a classification of the kind of document it is (for example study or work
              material, and whether it is a sensitive type such as a contract or medical document, so the scripts stick closely to its wording),
              the plan of reels, each reel&apos;s title, hook, script and quiz, voiceover audio files, and, where enabled, rendered video files
              that include AI-generated illustrations and captions. If you edit a reel, we keep a record of the edit request.
            </li>
            <li>
              <strong>Processing records.</strong> Page and word counts, whether the document was shortened, processing status, number of
              attempts, and error messages if something fails.
            </li>
            <li>
              <strong>Share Links.</strong> For each link: a random code, which reel and document it points to, whether it shows the document
              title, when it was created or revoked, and how many times it has been opened.
            </li>
          </ul>
          <LegalH3>Payment and plan information</LegalH3>
          <ul>
            <li>
              Payments are made on Stripe&apos;s checkout pages. Stripe collects your card or other payment details, billing details and email,
              and handles them under its own privacy policy. We never receive or store your full card number.
            </li>
            <li>
              From Stripe we receive and store: your Stripe customer ID, whether you have a subscription, which plan (Plus, Pro or Ultra) it is
              and whether it is billed weekly or yearly, its status, when the current period starts and ends, whether you have used your one free
              trial, and a record of each purchase (what it was for, the amount, the currency and a Stripe reference). You can see invoices and
              receipts in the Stripe billing portal from your profile. Stripe sends trial and payment receipts; we don&apos;t send extra billing
              emails.
            </li>
            <li>
              Usage records: to enforce plan limits we keep a ledger of reel credits reserved, returned and topped up, edit credits used and
              refunded, and free reels unlocked (with the document they were for and when). Free-plan limits are counted per account, and upload
              limits also per hashed network address.
            </li>
          </ul>
          <LegalH3>Information collected automatically</LegalH3>
          <ul>
            <li>
              <strong>Hashed IP address and usage records.</strong> When you upload a document or retry one, we take your IP address, combine it
              with a secret value and run it through a one-way hash function. We store only the resulting scrambled code, with the document and
              in a short-lived usage log (which also records your account ID, the document and the time), and use it to enforce the daily upload
              and retry limits and prevent abuse. Our app does not store your raw IP address with your documents.
            </li>
            <li>
              <strong>Visit log.</strong> We log visits to Unspool: your IP address, your approximate country (worked out from the IP address),
              your device and browser type, the site that sent you here, the page you landed on, how long the visit lasted, and the pages you
              open and actions you take (for example starting an upload, opening the sign-up form, watching a reel or pressing an upgrade
              button), with timestamps and, if you are signed in, your account ID and email address. We keep this log for 90 days and then
              delete it automatically. We use it for security, to prevent abuse (such as one person creating many free accounts) and to improve
              the product. It is not sold and not used for advertising.
            </li>
            <li>
              <strong>Referral.</strong> If you arrive through someone&apos;s Share Link and then create an account, we record the code of
              the link that brought you, so we can understand how people find Unspool.
            </li>
            <li>
              <strong>Server and request logs.</strong> Like any website, our hosting and infrastructure providers (Vercel and Supabase)
              automatically log technical information about requests, such as IP address, browser type, the page or API requested, the time and
              any errors. Our authentication provider also keeps a log of sign-in events, which can include the IP address used. We use these
              logs to keep the Service running, debug problems and protect it from abuse.
            </li>
            <li>
              <strong>Cookies and device storage.</strong> A small number of cookies and browser storage entries, described in{" "}
              <See id="cookies" />. We do not use advertising cookies, tracking pixels, session-replay tools or third-party analytics.
            </li>
          </ul>
          <LegalH3>What we don&apos;t collect</LegalH3>
          <p>
            We don&apos;t collect your precise location, contacts, photos library, microphone or camera input. We don&apos;t ask for your name,
            date of birth, phone number, address or government ID (Stripe may ask for billing details at checkout). We don&apos;t buy personal
            information about you from data brokers, and we don&apos;t combine your information with data from other websites.
          </p>
        </Section>

        <Section id="sources">
          <p>We get personal information from these sources:</p>
          <ul>
            <li><strong>You</strong>, when you create an account, upload documents, write edit requests, share reels, pay or contact us;</li>
            <li><strong>Your device and browser</strong>, automatically, when you visit or use the Service (<See id="what-we-collect" />);</li>
            <li><strong>Stripe</strong>, about your payments and subscription;</li>
            <li><strong>Google</strong>, if you choose to sign in with Google;</li>
            <li><strong>Other users</strong>, only in the sense that a document someone else uploads may mention you, or that you may arrive through someone&apos;s Share Link; and</li>
            <li><strong>Our AI Providers</strong>, which return the scripts, audio and images generated from your content.</li>
          </ul>
        </Section>

        <Section id="how-we-use">
          <p>We use personal information only to run Unspool. Specifically, to:</p>
          <ul>
            <li>create and secure your account, sign you in, confirm your email address with a code, and reset your password;</li>
            <li>store your documents and turn them into reels: extract the text, plan the reels, write scripts and quizzes, generate voiceovers, illustrations and videos, and apply your edits and reel style;</li>
            <li>show you your library and feed, remember which reels are available to you, and serve reels through Share Links you create;</li>
            <li>process payments, unlock documents, manage subscriptions, trials and credits, and keep records we need for accounting and tax;</li>
            <li>enforce upload and credit limits and our Terms, and detect and prevent fraud, abuse, duplicate accounts and security incidents;</li>
            <li>diagnose and fix errors, monitor performance, and keep the Service reliable;</li>
            <li>understand, in aggregate, how people find and use Unspool so we can improve it (for example, which pages lead to sign-ups, or how many people open shared reels);</li>
            <li>send you service emails (such as sign-up codes, password resets and important notices about the Service or your account) and respond to your messages;</li>
            <li>if you opted in, send you occasional product updates, which you can stop at any time;</li>
            <li>establish, exercise or defend legal claims; and</li>
            <li>comply with the law and respond to lawful requests.</li>
          </ul>
          <LegalH3>Automated processing</LegalH3>
          <p>
            Turning documents into reels is automated, and so are our limits (for example, deciding whether you have credits left, or whether
            an upload exceeds the daily limit). None of this produces legal or similarly significant effects on you, and we do not make
            decisions about you based solely on automated processing that would. We do not use your documents or reels for advertising, and we
            do not build advertising profiles. If you think an automated limit was applied to you by mistake, contact us and a person will look
            at it.
          </p>
          <p>
            If we want to use personal information for a purpose that isn&apos;t compatible with the ones above, we will tell you first and,
            where the law requires, ask for your consent.
          </p>
        </Section>

        <Section id="ai-processing">
          <p>Generating reels means sending parts of your content to AI providers that work on our behalf. Here is exactly what goes where:</p>
          <ul>
            <li>
              <strong>Reading the document.</strong> We extract text from most files on our own servers. If a PDF looks scanned, or you upload a
              photo, we send the file itself to Anthropic&apos;s Claude models to read the text from the image.
            </li>
            <li>
              <strong>Planning and writing.</strong> We send the extracted text (up to our length limit) and the file name to Anthropic&apos;s
              Claude models, which plan the reels and write each script and quiz. If you edit a reel, we also send your edit request and the
              reel&apos;s current script.
            </li>
            <li>
              <strong>Voiceover.</strong> We send each script&apos;s spoken lines, but not your original document, to our text-to-speech
              provider (OpenAI, or ElevenLabs if we have configured it) to produce the audio.
            </li>
            <li>
              <strong>Illustrations.</strong> The AI writes a short scene description for each moment of a reel, based on your document&apos;s
              content. We send those descriptions, but not the document itself, to our image-generation provider (fal.ai or Replicate) to create
              illustrations. These are combined with the voiceover and captions into a video, which we store in your account.
            </li>
            <li>
              <strong>Your device.</strong> If a reel has no generated voiceover, the player can read the script aloud using your device&apos;s
              built-in text-to-speech voice. Depending on your device and browser, that voice may be provided by your operating system or browser
              vendor. Animated scenes, diagrams and background music are drawn and played on your device.
            </li>
          </ul>
          <LegalH3>Training</LegalH3>
          <p>
            We do not train AI models, and we do not use your documents, extracted text, edit requests or reels to train or improve any AI
            model. We use our providers&apos; paid API services, which process your data to return results to us. Under their published API and
            business terms, these providers generally do not use data sent through their APIs to train their models by default, and may keep it
            for a limited period for purposes such as abuse and safety monitoring or as required by law. Each provider&apos;s own terms and
            privacy policy explain the details.
          </p>
          <LegalH3>Accuracy</LegalH3>
          <p>
            Reels are generated automatically and can contain mistakes, including mistakes about people mentioned in a document. If a reel
            misstates something about you, you can delete the document, ask the person who shared it to revoke the link, or contact us. See the{" "}
            <Link href="/terms#ai-output">Terms</Link> for more on relying on AI output.
          </p>
        </Section>

        <Section id="share-links">
          <p>
            Your reels are private until you share one. When you create a Share Link, anyone who has the link can open a public page and watch
            that reel without an account. That page shows:
          </p>
          <ul>
            <li>the reel&apos;s title, hook, script, captions and quiz, its voiceover and its video;</li>
            <li>your document&apos;s title, only if you leave that option on; and</li>
            <li>a short summary of the reel&apos;s text, and an invitation to try Unspool.</li>
          </ul>
          <p>
            It does not show your file, its file name, your other reels, how many reels the document has, your account, your email address or
            your name. Links to the audio and video on that page expire after about an hour and are renewed when the page is opened. We count how
            many times each link is opened and show you the count; we don&apos;t tell you who watched, and we don&apos;t record viewers&apos;
            identities against the link (viewers&apos; visits are covered by the visit log in <See id="what-we-collect" />, like any other visit).
          </p>
          <p>
            Share Links are not listed or indexed by us, but anyone with a link can forward it, and social networks and messaging apps may fetch
            the page to show a preview. You can revoke a link at any time; deleting the document or your account revokes all of its links. We
            can&apos;t recall copies that viewers have already downloaded, recorded or screenshotted. Please check what a reel reveals about the
            underlying document, and about other people, before you share it.
          </p>
        </Section>

        <Section id="legal-bases">
          <p>If you are in the European Economic Area, the United Kingdom or Switzerland, we rely on these legal bases:</p>
          <LegalTable
            head={["Purpose", "Legal basis"]}
            rows={[
              ["Providing your account, processing your documents into reels, edits and reel style, storing your library", "Performing our contract with you (the Terms)"],
              ["Serving reels through Share Links you create", "Performing our contract with you"],
              ["Taking payments, unlocking documents, managing subscriptions, trials and credits", "Performing our contract with you"],
              ["Keeping purchase, accounting and tax records", "Complying with legal obligations"],
              ["Hashed IP for upload limits, the visit log, referral attribution, logs, fraud and abuse prevention, security, debugging, improving the product", "Our legitimate interests in running a secure, reliable and affordable service and understanding how it is found and used, balanced against your rights"],
              ["Service emails (sign-up codes, password resets, important notices)", "Performing our contract with you"],
              ["Optional product update emails", "Your consent, which you can withdraw at any time"],
              ["Storing preferences and sign-in state on your device", "Strictly necessary for the service you asked for; your preferences are stored at your request"],
              ["Responding to legal requests, enforcing our Terms and handling disputes", "Legal obligations and our legitimate interests"],
            ]}
          />
          <p>
            Documents you upload may contain special categories of data (such as health information, religious beliefs or political opinions)
            about you or others. We process such content only because you chose to upload it to be turned into reels for you, and only for that
            purpose; where the GDPR requires a separate condition, we rely on your explicit consent, given by choosing to upload the document
            for this purpose, which you can withdraw at any time by deleting it. Please don&apos;t upload other people&apos;s sensitive information unless you have the
            right to (<See id="others-data" />). Where we rely on legitimate interests, you can ask us for details of the balancing test and
            object at any time (<See id="your-rights" />).
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
              ["Supabase", "Database, user accounts and sign-in, private file storage", "Account details, documents, extracted text, scripts, audio and video files, Share Link records, purchase records, hashed IPs, visit log, request logs"],
              ["Vercel", "Hosts the website and runs our servers, video rendering and scheduled jobs", "All data passing through the app while it is processed, request logs including IP addresses"],
              ["Anthropic (Claude)", "Reads scanned files and photos, plans reels, writes scripts and quizzes, applies edits", "Document text and file name; the file itself when text must be read from an image; edit requests"],
              ["OpenAI, or ElevenLabs if configured", "Text-to-speech voiceovers", "The spoken lines of each script"],
              ["fal.ai or Replicate", "Generates illustrations for reel videos", "AI-written scene descriptions based on your document (not the document itself)"],
              ["Stripe", "Payments, subscriptions, trials, billing portal, receipts, tax calculation", "Email, account reference, the item purchased, payment and billing details you enter"],
              ["Resend", "Delivers our emails: account emails (sign-up codes, password resets) on behalf of our authentication provider, service notices, and product updates if you opted in", "Your email address and the email content"],
              ["Google (only if you choose it)", "Sign in with Google", "The sign-in request; Google shares your email and basic profile with us"],
            ]}
          />
          <p>
            <strong>People you share with.</strong> When you create a Share Link, the reel is disclosed to anyone who opens it, at your direction
            (<See id="share-links" />).
          </p>
          <p>We may also disclose information:</p>
          <ul>
            <li>if the law requires it, or in response to a valid legal request such as a subpoena or court order, after checking that it is lawful and, where allowed, telling you first;</li>
            <li>where necessary to protect the rights, safety or property of our users, the public or Unspool, or to investigate fraud, abuse, chargebacks or security incidents;</li>
            <li>to professional advisers (such as lawyers and accountants) under a duty of confidentiality; and</li>
            <li>to a buyer or successor if Unspool is involved in a merger, acquisition, financing or sale of assets, in which case this policy will continue to protect your information and we will tell you before it becomes subject to a different policy.</li>
          </ul>
          <p>We never sell your personal information, and we never share it with advertisers or data brokers.</p>
        </Section>

        <Section id="cookies">
          <p>
            We use only the cookies and browser storage needed for Unspool to work, to keep it secure, and to remember your own settings. We
            don&apos;t use advertising cookies, cross-site tracking or third-party analytics, so there is no cookie banner asking you to accept
            tracking.
          </p>
          <LegalTable
            head={["Name", "Type", "Purpose", "How long"]}
            rows={[
              ["sb-…-auth-token", "Cookie (Supabase)", "Keeps you signed in and refreshes your session securely", "Until you sign out, or the session expires"],
              ["unspool_vid", "Cookie, HTTP-only", "A random identifier for your browser, so the visit log can tell a returning visit from a new one", "1 year"],
              ["unspool_anon", "Cookie, HTTP-only", "A random identifier for your browser, so a document started before you signed in can be attached to your account when you sign in", "1 year"],
              ["unspool_ref", "Cookie, HTTP-only", "If you arrived through a Share Link, which link it was, so it can be recorded if you sign up", "30 days"],
              ["unspool_visit", "Session storage", "Groups the pages you open in one tab into one visit", "Until you close the tab"],
              ["unspool:prefs", "Local storage", "Your player settings: mute, playback speed, background music, and whether to use your device's voice", "Until you clear your browser storage"],
              ["unspool:saved", "Local storage", "Reels you have hearted (saved) on this device", "Until you clear your browser storage"],
              ["unspool:tour-seen, unspool:welcome", "Local storage", "Whether you have seen the welcome tour, so it only shows once", "Until you clear your browser storage"],
              ["unspool / pending-upload", "IndexedDB", "If you pick a file and then sign in with Google, holds that file in your browser during the redirect so the upload can continue", "Removed when it is picked back up; ignored and discarded if older than 30 minutes"],
            ]}
          />
          <p>
            Local storage, session storage and IndexedDB stay on your device and are not sent to us. Stripe sets its own cookies on its checkout
            and billing pages to process payments and prevent fraud, and Google does the same if you sign in with Google; those are governed by
            their own policies. You can clear cookies and storage in your browser settings at any time, but if you block the sign-in cookie you
            won&apos;t be able to stay signed in. Because we don&apos;t track you across sites, we treat &quot;Do Not Track&quot; and Global
            Privacy Control signals as consistent with what we already do (<See id="do-not-sell" />).
          </p>
        </Section>

        <Section id="emails">
          <LegalTable
            head={["Email", "When", "Can you opt out?"]}
            rows={[
              ["Sign-up code, password reset, email change", "When you ask for it", "No; they are needed to use your account"],
              ["Important service notices (security, changes to the Terms or this policy, account issues)", "Rarely, when needed", "No, while you have an account"],
              ["Receipts and invoices", "Sent by Stripe when you pay", "Managed by Stripe"],
              ["Product updates", "Occasionally, only if you ticked the box", "Yes, at any time"],
            ]}
          />
          <p>
            We don&apos;t put advertising trackers in our emails, and we don&apos;t sell or rent our email list. Our email provider
            may log delivery events (such as whether an email bounced) so we can keep emails working.
          </p>
        </Section>

        <Section id="retention">
          <p>We keep personal information only for as long as we need it:</p>
          <LegalTable
            head={["Information", "How long we keep it"]}
            rows={[
              ["Account details", "Until you delete your account"],
              ["Documents, extracted text, scripts, audio and videos", "Until you delete the document or your account. Deleting a document removes the original file, extracted text, scripts, voiceover audio, videos and its Share Links"],
              ["Edit requests and reel style", "Until you delete the reel's document or your account (style: until you change it or delete your account)"],
              ["Share Link records and view counts", "Until you delete the reel's document or your account; a revoked link's record is kept so the link stays dead"],
              ["Uploads never attached to an account", `Uploads made without an account that were never unlocked are deleted automatically by a daily clean-up once they are more than ${ANON_DAYS} days old`],
              ["Hashed IP stored with a document", "Deleted with the document"],
              ["Visit log (IP address, approximate country, device and browser, pages and actions)", "Deleted automatically by the daily clean-up after 90 days"],
              ["Usage log (account ID, hashed IP, document reference, time of each upload or retry)", "Deleted automatically by the daily clean-up after 3 days. The one exception: a record that your account has uploaded (account ID and time only, with the hashed IP and document reference removed after 3 days) is kept while your account exists so the one-free-document limit works, and is deleted when you delete your account"],
              ["Credit ledger", "While your account exists, so your balance and limits are correct"],
              ["Referral (which Share Link brought you)", "While your account exists"],
              ["Purchase records", "Kept for accounting and tax, typically for up to 7 years. When you delete your account, they are kept without the link to your account"],
              ["Stripe records", "Stripe keeps payment and customer records in line with its own legal and regulatory obligations"],
              ["Server and request logs", "Kept by our hosting providers for limited periods under their retention settings"],
              ["Emails with us", "As long as needed to deal with your request, and then for a reasonable period in case you follow up"],
              ["Data held by AI providers", `Only for the limited periods their API terms allow, as described in section ${sec("ai-processing")}`],
            ]}
          />
          <p>
            We may keep information longer where we are legally required to, or where it is reasonably needed to resolve a dispute, prevent
            fraud or abuse, or enforce our Terms, and only for as long as that need lasts.
          </p>
          <LegalH3>Deleting your account</LegalH3>
          <p>
            You can delete your account at any time from your profile. When you do, we cancel any active subscription immediately, delete every
            document along with its original file, extracted text, scripts, voiceover audio, videos and Share Links, and then delete your login
            and profile. This can&apos;t be undone. Purchase records are kept without the link to your account, as described above. Deleted data
            may remain for a short time in our providers&apos; backups and logs until they are overwritten in their normal cycle.
          </p>
        </Section>

        <Section id="security">
          <p>We take reasonable technical and organisational measures to protect your information, including:</p>
          <ul>
            <li>encryption in transit (HTTPS) for every connection to the Service, and encryption at rest by our storage and database providers;</li>
            <li>private, access-controlled storage for documents, audio and video. Files are never publicly listed; playback uses signed links that expire after a few hours (about an hour on Share Link pages);</li>
            <li>database rules and server-side checks so that each account can only access its own documents and reels, with the browser unable to read our database directly;</li>
            <li>passwords handled by our authentication provider and stored only in hashed form, and sign-up confirmed with an emailed code;</li>
            <li>card payments handled entirely by Stripe, with payment notifications verified by cryptographic signature;</li>
            <li>protections against cross-site requests and limits on how often uploads, retries, edits and links can be made;</li>
            <li>IP addresses used for limits stored only as salted one-way hashes, and raw IP addresses in the visit log kept server-side only, for 90 days;</li>
            <li>secrets and provider keys kept on the server, never in your browser, and access to production systems limited to the people who need it; and</li>
            <li>regular reviews of our code and dependencies for security issues.</li>
          </ul>
          <p>
            No system is perfectly secure, and we can&apos;t guarantee the security of information sent over the internet. Please use a strong,
            unique password and keep your devices up to date. To report a vulnerability, email <Mail to={PRIVACY} /> (see the{" "}
            <Link href="/terms#security">Terms</Link> for our safe-harbour rules).
          </p>
          <LegalH3>If something goes wrong</LegalH3>
          <p>
            If we become aware of a breach of security that leads to the accidental or unlawful loss, alteration, disclosure of, or access to
            your personal information, we will investigate it, take steps to contain it, and notify you and the relevant authorities where the
            law requires (for example, within 72 hours to a supervisory authority under the GDPR where required, and without unreasonable delay
            to affected users), telling you what happened, what information was involved and what you can do.
          </p>
        </Section>

        <Section id="others-data">
          <p>
            Documents often contain information about other people, such as names in a case study, a classmate&apos;s notes, or details in a
            work report. When you upload such a document, you decide what goes into it, and you are responsible for having the right to share
            that information with us for the purpose of making reels for you. We process it only for that purpose.
          </p>
          <p>
            If you believe a document uploaded by someone else, or a reel shared through a Share Link, contains your personal information and
            you want it removed, contact <Mail to={PRIVACY} /> with the Share Link (if you have one) and what you want us to do. Because we
            don&apos;t look inside people&apos;s private libraries, we may not be able to find information that hasn&apos;t been shared, but we
            will act on what we can identify, including disabling a Share Link.
          </p>
        </Section>

        <Section id="your-rights">
          <p>Wherever you are, you can:</p>
          <ul>
            <li>delete any document from your library, and delete your entire account from your profile;</li>
            <li>revoke any Share Link you created;</li>
            <li>change your password from your profile;</li>
            <li>stop product update emails at any time by replying &quot;unsubscribe&quot;, using your email app&apos;s unsubscribe option, or emailing us; and</li>
            <li>clear the preferences stored on your device through your browser settings.</li>
          </ul>
          <LegalH3>EEA, UK and Swiss residents</LegalH3>
          <p>Under the GDPR and similar laws, you have the right to:</p>
          <ul>
            <li><strong>access</strong> the personal information we hold about you and get a copy;</li>
            <li><strong>rectify</strong> information that is inaccurate or incomplete;</li>
            <li><strong>erase</strong> your information (&quot;the right to be forgotten&quot;);</li>
            <li><strong>restrict</strong> how we process it in certain circumstances;</li>
            <li><strong>data portability</strong>, meaning a copy of information you gave us in a structured, machine-readable format;</li>
            <li><strong>object</strong> to processing based on our legitimate interests, and to direct marketing at any time;</li>
            <li><strong>withdraw consent</strong> at any time, where we rely on it, without affecting processing that happened before;</li>
            <li><strong>not be subject to</strong> decisions based solely on automated processing that significantly affect you (we don&apos;t make any; see <See id="how-we-use" />); and</li>
            <li><strong>complain</strong> to your local data protection authority (for example, the Information Commissioner&apos;s Office in the UK, or the authority in the EU country where you live or work). We would appreciate the chance to help first.</li>
          </ul>
          <LegalH3>How to make a request</LegalH3>
          <p>
            Email <Mail to={PRIVACY} /> from the address on your account and tell us what you would like. We may need to confirm your identity
            before acting on a request, and will only ask for what we need to do that; we can&apos;t act on a request if we can&apos;t verify it.
            We will respond within one month (GDPR) or 45 days (US state laws), and will tell you if we need more time as the law allows.
            Requests are free unless they are clearly unfounded or excessive. Some rights have exceptions: for example, we may need to keep
            purchase records for tax purposes even if you ask us to delete them.
          </p>
        </Section>

        <Section id="us-privacy">
          <p>
            If you live in California or another US state with a comprehensive privacy law (such as Colorado, Connecticut, Delaware, Iowa,
            Montana, Nebraska, New Hampshire, New Jersey, Oregon, Texas, Utah or Virginia), you have the following rights, subject to some
            exceptions:
          </p>
          <ul>
            <li><strong>Right to know / access</strong> the categories and specific pieces of personal information we have collected about you, where it came from, why we use it, and who we disclose it to;</li>
            <li><strong>Right to delete</strong> personal information we collected from you;</li>
            <li><strong>Right to correct</strong> inaccurate personal information;</li>
            <li><strong>Right to portability</strong> of personal information you gave us;</li>
            <li><strong>Right to opt out</strong> of the sale or sharing of personal information, targeted advertising and certain profiling. We don&apos;t do any of these (<See id="do-not-sell" />);</li>
            <li><strong>Right to limit</strong> the use of sensitive personal information. We only use any sensitive information contained in your documents to provide the Service you asked for, so there is nothing further to limit;</li>
            <li><strong>Right to non-discrimination</strong>: we won&apos;t deny you the Service, charge you a different price or give you a lower quality of service because you exercised these rights; and</li>
            <li><strong>Right to appeal</strong>: if we decline your request, you can reply to ask us to reconsider, and if you are still unhappy you can contact your state attorney general.</li>
          </ul>
          <p>
            You can make a request by emailing <Mail to={PRIVACY} />. You may use an authorised agent; we may ask the agent for proof of your
            permission and ask you to verify your identity directly. We don&apos;t offer financial incentives in exchange for personal
            information.
          </p>
          <LegalH3>Categories of personal information (last 12 months)</LegalH3>
          <LegalTable
            head={["Category", "Examples", "Disclosed to"]}
            rows={[
              ["Identifiers", "Email address, account ID, IP address (visit log), hashed IP address, Stripe customer ID, browser identifier", "Supabase, Vercel, Stripe, Resend, Google (if used)"],
              ["Commercial information", "Plan, subscription status, reel credit usage, purchase records", "Supabase, Stripe"],
              ["Internet or network activity", "Visit log (pages and actions), request logs, processing status, Share Link view counts, referral", "Vercel, Supabase"],
              ["Approximate geolocation", "Country worked out from your IP address", "Supabase, Vercel"],
              ["User content (may include sensitive information)", "Uploaded documents, extracted text, edit requests, generated scripts, audio and video", `Supabase, Vercel, Anthropic, our text-to-speech and image providers (in the limited form described in section ${sec("ai-processing")}), and people you send a Share Link to`],
              ["Account credentials", "Email and password (stored hashed)", "Supabase"],
            ]}
          />
          <p>
            We collect this information from the sources in <See id="sources" />, use it for the business purposes listed in{" "}
            <See id="how-we-use" />, keep it for the periods in <See id="retention" />, and disclose it only to service providers for those
            purposes (and to people you share reels with, at your direction). We do not sell it or share it for cross-context behavioural
            advertising, and we have not done so in the last 12 months.
          </p>
        </Section>

        <Section id="do-not-sell">
          <p>
            <strong>We do not sell your personal information, and we do not share it for cross-context behavioural advertising</strong>, as those
            terms are defined in the California Consumer Privacy Act as amended by the CPRA and similar state laws. We have no advertising
            partners, use no advertising cookies or tracking pixels, and do not let third parties collect information about you on our site for
            their own advertising. We do not knowingly sell or share the personal information of anyone under 16.
          </p>
          <p>
            Because we don&apos;t sell or share personal information, there is nothing you need to opt out of. If your browser sends a Global
            Privacy Control (GPC) signal, we treat it as a valid request to opt out of sale and sharing, which matches what we already do for
            everyone. If you would like written confirmation, or want to make any other privacy request, email <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="other-regions">
          <ul>
            <li>
              <strong>Canada.</strong> We handle personal information in line with the Personal Information Protection and Electronic Documents
              Act (PIPEDA) and applicable provincial laws. You can access and correct your information and withdraw consent (subject to legal and
              contractual limits) by contacting us, and complain to the Office of the Privacy Commissioner of Canada.
            </li>
            <li>
              <strong>Brazil.</strong> If the LGPD applies to you, you have rights including confirmation of processing, access, correction,
              anonymisation or deletion, portability, information about sharing, and revocation of consent. Contact us to exercise them, or
              complain to the ANPD.
            </li>
            <li>
              <strong>Australia and New Zealand.</strong> We handle personal information in line with the Australian Privacy Principles and the
              New Zealand Privacy Act 2020 where they apply. You can request access and correction, and complain to the OAIC or the Office of the
              Privacy Commissioner.
            </li>
            <li>
              <strong>Everywhere else.</strong> We give everyone the same core protections described in this policy, whatever the law where
              they live requires, and will honour additional rights your local law gives you.
            </li>
          </ul>
        </Section>

        <Section id="children">
          <p>
            Unspool is not directed at children under 13, and we do not knowingly collect personal information from children under 13. Where
            local law sets a higher age for consenting to online services (up to 16 in parts of the EEA), users below that age need a parent or
            guardian&apos;s consent. Users under 18 need a parent or guardian&apos;s permission to use the Service, as explained in the{" "}
            <Link href="/terms#eligibility">Terms</Link>. Teen users get the same privacy protections as everyone else: we don&apos;t advertise
            to them, profile them or sell their information.
          </p>
          <p>
            If you believe a child under 13 (or under the applicable age) has given us personal information without the required consent,
            contact <Mail to={PRIVACY} /> and we will delete it. Parents and guardians can also contact us to review or delete their child&apos;s
            information.
          </p>
        </Section>

        <Section id="international">
          <p>
            Unspool and the providers listed above are based in, or process data in, the United States and other countries that may not have
            the same data protection laws as where you live. When we transfer personal information from the EEA, UK or Switzerland, we rely on
            appropriate safeguards, such as the European Commission&apos;s Standard Contractual Clauses (and the UK International Data Transfer
            Addendum) included in our providers&apos; data processing terms, or a provider&apos;s certification under the EU-US Data Privacy
            Framework and its UK and Swiss extensions where applicable, together with the security measures in <See id="security" />. You can ask
            us for more information about these safeguards, or a copy of them, at <Mail to={PRIVACY} />.
          </p>
        </Section>

        <Section id="changes">
          <p>
            We will update this policy when our practices change, for example if we add a feature or a new provider. The date at the top shows
            when it last changed, and we keep earlier versions available on request. If a change is significant, we will tell signed-in users by
            email or with a notice in the app before it takes effect, and where the law requires your consent to a change, we will ask for it.
            We won&apos;t use information we already hold in a materially different way without telling you and, where required, getting your
            consent.
          </p>
        </Section>

        <Section id="contact">
          <p>
            Privacy questions, requests and security reports: <Mail to={PRIVACY} />. Everything else: <Mail to={CONTACT} />. If you are in the
            EEA or UK and are not satisfied with our response, you can contact your data protection authority (<See id="your-rights" />).
          </p>
          <p>Unspool · unspool.cc</p>
        </Section>
      </article>
    </MarketingPage>
  );
}
