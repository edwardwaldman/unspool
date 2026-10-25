import type { Metadata } from "next";
import Link from "next/link";
import { LegalH3, LegalHeader, LegalSection, LegalTable, LegalToc, type TocItem } from "@/components/legal/legal-doc";
import { MarketingPage } from "@/components/shell/marketing-page";
import { ACCEPTED_EXTENSIONS, LIMITS, MAX_FILE_BYTES, MAX_PAGES, MAX_REELS, MAX_WORDS, MIN_REELS } from "@/lib/config";
import { formatCents, FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PAID_TIERS as PAID, PLANS, TOPUP_PACKS, TRIAL } from "@/lib/plans";
import { SHARE_DAILY_LIMIT } from "@/lib/shares";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
  description:
    "The rules for using Unspool: accounts, your documents, AI-generated reels, share links, Pro features, the free plan, payments, subscriptions, refunds and disputes.",
};

const EFFECTIVE = "October 25, 2026";
const CONTACT = "hello@unspool.cc";
const PRIVACY_CONTACT = "privacy@unspool.cc";

const FILE_TYPES = ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ");
const MAX_MB = Math.round(MAX_FILE_BYTES / (1024 * 1024));
const fmt = (n: number) => n.toLocaleString("en-US");

const SECTIONS = [
  { id: "acceptance", title: "Accepting these terms" },
  { id: "definitions", title: "Definitions" },
  { id: "eligibility", title: "Who can use Unspool" },
  { id: "accounts", title: "Your account and its security" },
  { id: "communications", title: "Electronic communications" },
  { id: "service", title: "What Unspool does" },
  { id: "ai-output", title: "AI-generated reels: read this" },
  { id: "your-content", title: "Your content and our licence to process it" },
  { id: "sharing", title: "Share links and public reels" },
  { id: "pro-features", title: "Pro features: editing reels and reel style" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "intellectual-property", title: "Our intellectual property" },
  { id: "free-plan", title: "The free plan" },
  { id: "paid-plans", title: "Paid plans, credits, billing and cancellation" },
  { id: "refunds", title: "Refunds" },
  { id: "chargebacks", title: "Chargebacks and payment disputes" },
  { id: "promotions", title: "Trials, promotions and promo codes" },
  { id: "taxes", title: "Prices and taxes" },
  { id: "third-parties", title: "Third-party services" },
  { id: "beta", title: "New and experimental features" },
  { id: "availability", title: "Availability and changes to the service" },
  { id: "security", title: "Security and reporting vulnerabilities" },
  { id: "termination", title: "Suspension, termination and deleting your account" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "disputes", title: "Governing law and disputes" },
  { id: "export", title: "Export controls and sanctions" },
  { id: "general", title: "General terms" },
  { id: "changes", title: "Changes to these terms" },
  { id: "contact", title: "Contact" },
] as const satisfies readonly TocItem[];

type SectionId = (typeof SECTIONS)[number]["id"];

/** A section's number, so cross-references stay right when sections move. */
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

export default function TermsPage() {
  return (
    <MarketingPage>
      <article className="prose-unspool legal-dense max-w-[760px] pt-14">
        <LegalHeader
          title="Terms of Service"
          effective={EFFECTIVE}
          intro={
            <>
              <p className="mt-6">
                These Terms of Service (the &quot;Terms&quot;) are a legally binding agreement between you and Unspool (&quot;Unspool&quot;,
                &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) that governs your access to and use of the website and app at unspool.cc,
                every page, feature, reel, share link, email and service we make available through it (together, the &quot;Service&quot;). We
                have tried to write them in plain English, but they are still a contract: please read them in full, because they cover what you
                can expect from us, what we expect from you, how payments, subscriptions and credits work, that payments are final (
                <See id="refunds" />), the limits on our liability (<See id="liability" />) and how disputes are handled (
                <See id="disputes" />).
              </p>
              <p>
                How we collect, use and share personal information is explained in our <Link href="/privacy">Privacy Policy</Link>, which forms
                part of these Terms. Anything shown to you at checkout (such as the price, the billing interval and any promotion) also forms
                part of these Terms for that purchase.
              </p>
            </>
          }
        />

        <LegalToc items={[...SECTIONS]} />

        <Section id="acceptance">
          <p>
            By creating an account, uploading a document, opening a share link, buying anything, or otherwise accessing or using the Service,
            you confirm that you have read, understood and agree to be bound by these Terms and the Privacy Policy. When you sign up with your
            email address, the sign-up form tells you that continuing means you agree to these Terms and the Privacy Policy, and we record the
            date and time at which you did so. The same applies if you sign up with Google or any other sign-in method we offer. If you do not
            agree, you must not use the Service.
          </p>
          <p>
            If you use Unspool on behalf of a company, school, university or other organisation, you confirm that you have authority to accept
            these Terms on its behalf, and &quot;you&quot; includes that organisation. If you do not have that authority, you must not accept
            these Terms or use the Service on the organisation&apos;s behalf.
          </p>
          <p>
            Some parts of the Service may be subject to additional terms that we show you when you use them (for example, the terms of a
            particular promotion). If additional terms conflict with these Terms, the additional terms apply to that part of the Service only.
          </p>
        </Section>

        <Section id="definitions">
          <p>In these Terms:</p>
          <ul>
            <li>
              <strong>&quot;Account&quot;</strong> means the account you create to use the Service, identified by your email address or by
              the third-party sign-in you used.
            </li>
            <li>
              <strong>&quot;Document&quot;</strong> means a file you upload to the Service, together with the text we extract from it.
            </li>
            <li>
              <strong>&quot;Reel&quot;</strong> means a short explainer generated from a Document, including its title, hook, script, quiz,
              captions, voiceover audio, illustrations, animations and any rendered video file.
            </li>
            <li>
              <strong>&quot;Your Content&quot;</strong> means your Documents and the Reels generated from them, and any instructions you give
              us (such as an edit request or a reel style).
            </li>
            <li>
              <strong>&quot;Credit&quot;</strong> means a unit of the Service that makes one Reel (or one edit of a Reel). Credits have no cash
              value.
            </li>
            <li>
              <strong>&quot;Subscription&quot;</strong> means a paid plan (Plus, Pro or Ultra) billed weekly or yearly; <strong>&quot;Top-up&quot;</strong>{" "}
              means a one-time purchase of Credits.
            </li>
            <li>
              <strong>&quot;Share Link&quot;</strong> means a public web address you create that lets anyone who has it watch a particular
              Reel (<See id="sharing" />).
            </li>
            <li>
              <strong>&quot;AI Providers&quot;</strong> means the third-party companies whose artificial-intelligence models we use to read
              Documents, write scripts, produce voiceovers and create illustrations, as listed in the Privacy Policy.
            </li>
            <li>
              <strong>&quot;Consumer&quot;</strong> means an individual acting for purposes that are wholly or mainly outside their trade,
              business, craft or profession.
            </li>
          </ul>
          <p>
            Headings are for convenience only and don&apos;t affect the meaning of these Terms. Words such as &quot;including&quot; and
            &quot;for example&quot; introduce examples and do not limit the general words before them.
          </p>
        </Section>

        <Section id="eligibility">
          <p>
            You must be at least 13 years old to use Unspool. If you live somewhere that sets a higher minimum age for using online services
            like this one without a parent&apos;s consent (for example, up to 16 in some European countries), you must meet that age or have
            your parent or guardian&apos;s consent.
          </p>
          <p>
            If you are under 18, or under the age of majority where you live, you may only use Unspool with the permission of a parent or
            legal guardian, and only they may make purchases on your behalf or authorise a payment method. A parent or guardian who allows a
            minor to use the Service agrees to these Terms on the minor&apos;s behalf, is responsible for the minor&apos;s use of the Service,
            and is responsible for any charges made on the account.
          </p>
          <p>
            You may not use the Service if you are barred from doing so under the laws that apply to you, if you are subject to sanctions
            described in <See id="export" />, or if we have previously suspended or terminated your account for breaking these Terms, unless
            we have agreed in writing that you may return.
          </p>
        </Section>

        <Section id="accounts">
          <p>
            You need a free account to turn a document into reels. You can sign up with an email address and password (confirmed with a
            six-digit code we email to you) or, where offered, with your Google account. Accounts are provided through our authentication
            provider, Supabase.
          </p>
          <ul>
            <li>
              Give us accurate information, including an email address that you own and can receive mail at, and keep it up to date. We use
              it to confirm your account, reset your password and contact you about the Service. If we can&apos;t reach you because your
              email address is wrong or no longer works, notices we send to it still count as given.
            </li>
            <li>
              Choose a password of at least 8 characters that you don&apos;t use elsewhere, and keep it secret. You are responsible for all
              activity that happens under your account, including purchases, whether or not you authorised it, unless it happened because of
              our failure to protect the Service.
            </li>
            <li>
              Accounts are for one person. Don&apos;t share your login, sell, rent or transfer your account, or create multiple accounts to
              get extra free reels, extra uploads or a second free trial, or otherwise get around a limit.
            </li>
            <li>
              Tell us straight away at <Mail to={CONTACT} /> if you think someone else has accessed your account or your password has been
              compromised. You can change your password from your profile at any time.
            </li>
            <li>
              We may refuse a username, email address or sign-up, or require you to verify your email address again, where we reasonably
              think it is needed to protect the Service or other people.
            </li>
          </ul>
        </Section>

        <Section id="communications">
          <p>
            By creating an account you agree to receive electronic communications from us, including sign-up codes, password resets, receipts
            and invoices (sent by Stripe), notices about your account, changes to these Terms or the Privacy Policy, security alerts and other
            service messages. These are part of the Service and you can&apos;t opt out of them while you have an account. You agree that all
            agreements, notices, disclosures and other communications we provide electronically satisfy any legal requirement that they be in
            writing, and that clicking a button such as &quot;Create account&quot; or &quot;Subscribe&quot; is your electronic signature.
          </p>
          <p>
            Product update and marketing emails are optional. We only send them if you opted in, and you can stop them at any time by using the
            unsubscribe option in the email or contacting us. We do not send text messages and do not make marketing calls.
          </p>
        </Section>

        <Section id="service">
          <p>
            Unspool turns a document you upload into a series of short, vertical explainer &quot;reels&quot;, similar in format to short
            social videos, often ending with a short quiz, so you can absorb the material more easily. Here is how it works today:
          </p>
          <ul>
            <li>
              You upload a file. We currently accept {FILE_TYPES} files of up to {MAX_MB} MB. We extract the text; for scanned PDFs and
              photos, we use an AI model to read the text from the image.
            </li>
            <li>
              Long documents are cut down to fit our processing limits: we use at most the first {PLANS.free.maxPages} pages of a PDF on the
              free plan (up to {MAX_PAGES} on paid plans, see <See id="paid-plans" />) and the first {fmt(MAX_WORDS)} words of any document
              (more on Pro and Ultra). Anything beyond that is not covered by your reels, and we will tell you when a document was shortened.
            </li>
            <li>
              An AI model plans the reels (usually between {MIN_REELS} and {MAX_REELS}, depending on how many distinct key ideas the document
              has) and writes a script for each one. The number of reels is decided automatically and may differ for similar documents.
            </li>
            <li>
              Each script is turned into a voiceover with a text-to-speech service, and may be combined with animations, diagrams,
              AI-generated illustrations, captions and background music into a video. If a voiceover isn&apos;t available, the player can read
              the script aloud using your device&apos;s built-in voice.
            </li>
            <li>
              Your documents and reels are private to your account by default. They are not published and are not shown to other users
              unless you create a Share Link for a reel (<See id="sharing" />).
            </li>
          </ul>
          <p>
            Generation is automated and can take a few minutes, longer at busy times; Pro and Ultra documents are processed with priority.
            Occasionally generation fails, for example because a file can&apos;t be read, is password-protected, contains mostly images we
            can&apos;t interpret, or a provider is unavailable. When that happens you can retry (a limited number of times per document each
            day, and a limited number of attempts per reel), or delete the document. A reel that fails for good returns its credit
            automatically (<See id="paid-plans" />).
          </p>
          <p>
            Voices used in reels are synthetic. They are not the voices of real people, and any resemblance to a real person&apos;s voice is
            unintended. Music used in reels is licensed or created for Unspool and may only be used as part of the reel.
          </p>
        </Section>

        <Section id="ai-output">
          <p>
            <strong>Reels are written by AI and can be wrong.</strong> We instruct the AI to stay faithful to your document and not to invent
            facts, but AI models can still misread a document, get numbers, names, formulas, units or dates wrong, mislabel a graph or
            diagram, leave out important detail, nuance, exceptions or caveats, oversimplify, mix up two ideas, or state something with more
            confidence than the original does. Quiz questions and their marked answers can also be wrong. Illustrations, diagrams, analogies
            and stories are illustrative only and are not evidence of anything in your document.
          </p>
          <p>
            <strong>Unspool is a study and comprehension aid, not advice.</strong> Nothing in a reel is legal, financial, tax, investment,
            medical, psychological, nutritional, safety, academic or other professional advice, even when the document you uploaded is a
            contract, a policy, a lease, a medical leaflet, a prescription, a safety procedure or a financial statement. Don&apos;t rely on a
            reel to make a decision that matters, sign anything, take or stop any treatment or medication, operate equipment, meet a deadline,
            or answer an exam or assessment question.
          </p>
          <p>
            <strong>Always check the original.</strong> For anything important, read the original document and, where appropriate, ask a
            qualified professional, your teacher or the document&apos;s author. You are solely responsible for how you use reels and for
            checking that they are accurate and suitable for your purpose before you rely on them, share them or act on them.
          </p>
          <p>
            <strong>Outputs are not unique.</strong> Because of how AI works, the same or similar output may be generated for other users from
            similar material. Reels may also reflect limitations or biases in the AI models we use, which we don&apos;t control.
          </p>
        </Section>

        <Section id="your-content">
          <LegalH3>You keep ownership</LegalH3>
          <p>
            As between you and Unspool, you own your uploaded files, and we do not claim ownership of the reels generated for you. Whether
            AI-generated material can be protected by copyright varies by country, and similar outputs may be generated for other people, so
            we can&apos;t promise that a reel is unique, original or protectable. Our templates, formats, animations, music, characters and
            other parts of the Service that appear in a reel remain ours (<See id="intellectual-property" />).
          </p>
          <LegalH3>The licence you give us</LegalH3>
          <p>
            To run the Service we need your permission to handle your content. You grant Unspool a worldwide, non-exclusive, royalty-free,
            sublicensable (only to the service providers that help us run the Service) licence to host, store, copy, process, transmit,
            reformat, translate into speech and video, and display your content, and to create derivative works from it (that is, the reels),{" "}
            <strong>solely to provide, secure and support the Service for you</strong>, to show a reel to anyone you share it with, and to
            comply with the law. This includes sending your content to the service providers listed in our Privacy Policy (for example, the AI
            model provider that writes the scripts and the text-to-speech provider that voices them) so they can do that work for us.
          </p>
          <p>
            We do not use your content to train AI models, we do not sell it, and we do not make it public unless you create a Share Link. The
            licence ends when you delete the content or your account, except for copies that remain for a short time in backups and logs, that
            we must keep to comply with the law, or that are needed to resolve a dispute or enforce these Terms.
          </p>
          <LegalH3>Your promises about your content</LegalH3>
          <p>When you upload something or create a Share Link, you confirm that:</p>
          <ul>
            <li>you own it, or you have all the rights, licences and permissions needed to upload it, have it processed in the way described in these Terms and the Privacy Policy, and (if you share it) make the reel available to others;</li>
            <li>uploading, processing and sharing it does not break any law, contract, licence, confidentiality obligation (such as an NDA, exam rules or your employer&apos;s policies) or anyone else&apos;s rights, including copyright, trademark, privacy and publicity rights; and</li>
            <li>if it contains other people&apos;s personal information, you have a lawful basis to share it with us for this purpose and have given them any notice the law requires.</li>
          </ul>
          <LegalH3>Sensitive and regulated data</LegalH3>
          <p>
            Unspool is not designed for regulated or highly sensitive data, and we do not offer special protections for it. Don&apos;t upload
            patient health records, payment card numbers, bank details, government ID numbers, passwords or secrets, children&apos;s records,
            classified or export-controlled material, or other data that you are legally required to protect in a particular way, unless you
            are permitted to and accept that it will be processed as described in our Privacy Policy. We are not your &quot;business
            associate&quot; under HIPAA, we are not a &quot;school official&quot; under FERPA, and we do not sign agreements of those kinds.
          </p>
          <LegalH3>We may review and remove content</LegalH3>
          <p>
            We don&apos;t routinely look at your documents or reels, and automated systems process them without human review. We may access,
            review, block or remove content, and refuse to process a document, where we reasonably believe it is needed to provide support you
            asked for, to investigate a breach of these Terms or a security issue, to respond to a legal request, or to protect people. We are
            not obliged to monitor content and are not responsible for content you upload or share.
          </p>
        </Section>

        <Section id="sharing">
          <p>
            You can create a Share Link for any reel you can play. Anyone who has the link can watch that reel, without an account, on any
            device. Share Links are not listed or indexed by us, but they are public: anyone you send the link to can forward it, and we
            can&apos;t control who ends up seeing it.
          </p>
          <ul>
            <li>
              <strong>What a Share Link shows.</strong> The reel itself (its title, hook, script, captions, quiz, voiceover and video) and, if
              you leave the option on, your document&apos;s title. It does not show your file, its name, your other reels, your account or your
              email address. The page also shows a short summary of the reel&apos;s text and an invitation to try Unspool.
            </li>
            <li>
              <strong>Views.</strong> We count how many times each Share Link is opened and show you that number. We don&apos;t tell you who
              watched.
            </li>
            <li>
              <strong>Locked reels can&apos;t be shared.</strong> Only reels you can play can be shared. You can create up to {SHARE_DAILY_LIMIT}{" "}
              new Share Links in any rolling 24-hour period.
            </li>
            <li>
              <strong>Turning a link off.</strong> You can revoke a Share Link at any time, after which it stops working. Deleting the reel&apos;s
              document or your account also turns off every Share Link for it. Copies someone else has already downloaded, recorded or
              screenshotted are outside our control.
            </li>
            <li>
              <strong>You are responsible for what you share.</strong> Only share reels made from material you are allowed to share. A reel can
              reveal the contents of the underlying document, including personal or confidential information, so check before you share.
            </li>
          </ul>
          <p>
            When someone opens a Share Link and later creates an account, we may record which link brought them, to understand how people find
            Unspool (see the Privacy Policy). We may disable a Share Link that we reasonably believe breaks these Terms or someone&apos;s rights.
          </p>
        </Section>

        <Section id="pro-features">
          <p>Some features are only available on certain paid plans. Today, Pro and Ultra include:</p>
          <ul>
            <li>
              <strong>Editing a reel.</strong> You can ask the AI to rewrite one of your reels (for example &quot;make it simpler&quot; or
              &quot;add an example&quot;), in up to 300 characters. Each edit uses one credit, which is returned if the edit fails. While an
              edit is being made the reel shows as updating; if it fails, the previous version stays. Edits are subject to the same AI accuracy
              limits as any reel (<See id="ai-output" />), and an edit request must follow <See id="acceptable-use" />.
            </li>
            <li>
              <strong>Reel style.</strong> You can change how your reels look, such as captions, font and colours. Your style applies to reels
              when you watch them and may not apply to every format, export or Share Link.
            </li>
            <li>Longer reels, larger documents and priority processing, as described in <See id="paid-plans" />.</li>
          </ul>
          <p>
            Which features belong to which plan can change (<See id="availability" />). If your plan no longer includes a feature, for example
            because you downgrade or your subscription ends, you lose access to it, but reels already made stay available.
          </p>
        </Section>

        <Section id="acceptable-use">
          <p>Use Unspool fairly and lawfully. In particular, you must not, and must not help or allow anyone else to:</p>
          <ul>
            <li>upload, generate or share anything illegal, including content that sexually exploits or endangers children, promotes terrorism or violent extremism, incites violence or hatred, or harasses, threatens, bullies, stalks or defames anyone;</li>
            <li>upload material that infringes someone else&apos;s copyright, trademark, trade secret, privacy, publicity or other rights, or that you obtained unlawfully (for example, a leaked exam paper);</li>
            <li>upload other people&apos;s confidential or personal information without the right to do so, or use the Service to dox or profile anyone;</li>
            <li>upload malware, or files designed to exploit, crash, overload or slow down our systems or our providers&apos; systems (such as decompression bombs or malformed files);</li>
            <li>include instructions in a document, edit request or style setting intended to manipulate the AI into ignoring its instructions, revealing system information, producing harmful output, or acting outside its purpose (&quot;prompt injection&quot; or &quot;jailbreaking&quot;);</li>
            <li>use the Service to create content that is sexually explicit, that promotes self-harm, eating disorders or dangerous activities, that gives instructions for weapons, drugs or other serious harm, or that is designed to deceive (such as fake news, fake reviews or impersonation of a real person or organisation);</li>
            <li>use reels or Share Links to send spam, advertising or chain messages, or to drive traffic artificially;</li>
            <li>scrape, crawl, frame or mirror the Service, or use bots, scripts or other automated means to access it, except through features we provide for that purpose;</li>
            <li>probe, scan or test the vulnerability of the Service except as allowed in <See id="security" />, or bypass any security, authentication, access control, paywall, credit system, upload limit or rate limit, including by creating multiple accounts, sharing accounts or manipulating requests;</li>
            <li>access or try to access another person&apos;s account, documents, reels or Share Links that weren&apos;t shared with you;</li>
            <li>reverse engineer, decompile, copy, resell, sublicense or rent the Service, or use it or its output to build, train or benchmark a competing product or AI model, except where the law expressly allows this;</li>
            <li>remove, obscure or alter any watermark, copyright notice or attribution in a reel or on the Service; or</li>
            <li>use the Service in a way that breaks the usage policies of the AI Providers it relies on, or that could expose us, our providers or other users to harm or legal liability.</li>
          </ul>
          <LegalH3>Academic integrity</LegalH3>
          <p>
            Unspool is meant to help you understand and revise material, not to do your work for you. Follow the rules of your school,
            university, employer or course. Don&apos;t submit reels, scripts or quiz answers as your own work, and don&apos;t use them where AI
            tools are not permitted, including during an exam or assessment. Course materials, textbooks and instructor notes are often
            protected by copyright or by your institution&apos;s rules; check that you are allowed to upload them for your personal study before
            you do, and don&apos;t share reels made from them unless you are allowed to.
          </p>
          <LegalH3>Copyright complaints</LegalH3>
          <p>
            Uploaded documents are private, and reels are only visible to others through Share Links their owner chose to create. If you
            believe material processed or shared through Unspool infringes your copyright, email <Mail to={CONTACT} /> with: your name and
            contact details; a description of the copyrighted work; the Share Link or other information that lets us find the material; a
            statement that you believe in good faith that the use is not authorised by the owner, its agent or the law; and a statement, under
            penalty of perjury, that your notice is accurate and that you are the owner or authorised to act for the owner, with your physical
            or electronic signature. We may remove or disable material, notify the user who shared it, and terminate repeat infringers&apos;
            accounts. If your material was removed and you believe that was a mistake, you can send us a counter-notice with the equivalent
            information. Sending a knowingly false notice or counter-notice can make you liable for damages.
          </p>
        </Section>

        <Section id="intellectual-property">
          <p>
            Apart from your content, the Service and everything in it belongs to Unspool or our licensors: the software, source code, design,
            layouts, reel formats, templates, animations, 3D models and characters, diagrams, music, sample and demo reels, advertisements, the
            Unspool name, logo and other brand features, and our website text. These are protected by copyright, trademark and other
            intellectual property laws. We reserve all rights not expressly granted to you in these Terms.
          </p>
          <p>
            We give you a personal, limited, non-exclusive, non-transferable, non-sublicensable, revocable permission to use the Service for its
            intended purpose while you follow these Terms. You may use reels generated from your own documents for your own personal study or
            internal purposes, and share them through Share Links, as long as doing so doesn&apos;t break these Terms or anyone else&apos;s
            rights. You may not use reels commercially (for example, selling them or using them in paid courses or advertising), or use our
            name, logo or branding, without our prior written permission.
          </p>
          <p>
            If you send us feedback, ideas or suggestions, you allow us to use them freely, for any purpose, without paying you or owing you
            anything, and without any obligation to keep them confidential. We are glad to hear from you.
          </p>
        </Section>

        <Section id="free-plan">
          <p>You can use Unspool for free with a free account and no payment card. On the free plan:</p>
          <ul>
            <li>
              <strong>One document.</strong> A free account can unspool one document. Deleting it doesn&apos;t free up another; to unspool
              more documents, choose a paid plan or buy a top-up.
            </li>
            <li>
              <strong>Your first reel is free.</strong> For each document, reel 1 is made and can be watched as soon as it is ready.
            </li>
            <li>
              <strong>Then 1 reel every {FREE_REEL_INTERVAL_MIN} minutes.</strong> {FREE_REEL_INTERVAL_MIN} minutes after a free reel of a
              document is unlocked, you can unlock the next one; we make it when you open it. You can unlock up to {FREE_REELS_PER_DAY} free
              reels in any rolling 24-hour period across all your documents (this cap includes each document&apos;s first reel). You can see
              the title and hook of every reel, including locked ones.
            </li>
            <li>
              Free documents can be up to {PLANS.free.maxPages} pages, and free videos carry a small Unspool watermark. You can still share
              your reels.
            </li>
            <li>
              <strong>Daily upload limit.</strong> Free accounts can upload up to {LIMITS.freeUploadsPerDay} documents in any rolling 24-hour
              period. To stop people getting around this with extra accounts, the limit is counted per account and per network connection
              (using a scrambled, hashed version of your IP address), so people sharing a network may share the same allowance. Deleting a
              document doesn&apos;t give the upload back.
            </li>
            <li>The file size, word and file-type limits described in <See id="service" /> apply.</li>
          </ul>
          <p>
            The free plan is offered at our discretion and has no guaranteed level of service. We may change the number of free reels, the
            timing, or the free limits at any time for new and existing documents, and we may withdraw the free plan, or limit or close free
            accounts, that we reasonably believe are being used to abuse it (for example, multiple accounts created by the same person).
          </p>
        </Section>

        <Section id="paid-plans">
          <p>
            Prices are shown in the app and on our <Link href="/pricing">pricing page</Link> before you buy. Paid plans bill weekly or yearly
            and give you reel credits: 1 credit makes 1 reel, and a document uses one credit for each reel we plan for it.
          </p>
          <LegalTable
            head={["Plan", "Weekly price", "Yearly price", "Credits", "Max pages"]}
            rows={PAID.map((t) => [
              PLANS[t].name,
              formatCents(PLANS[t].priceCents),
              formatCents(PLANS[t].yearlyCents),
              `${fmt(PLANS[t].credits)} a week`,
              String(PLANS[t].maxPages),
            ])}
          />
          <ul>
            <li>
              <strong>What each plan includes.</strong> Pro and Ultra also get longer reels, reel editing and reel style (
              <See id="pro-features" />) and priority processing, and Ultra gets early access to new features. A different price or a
              promotion shown to you at checkout takes precedence over the table above.
            </li>
            <li>
              <strong>Yearly plans.</strong> Yearly plans get the same weekly credits, which reset every 7 days from the start of your billing
              year, and renew automatically every year until you cancel.
            </li>
            <li>
              <strong>Credits.</strong> Your weekly credits reset every week (at the start of each weekly billing period, or every 7 days on a
              yearly plan) and unused weekly credits don&apos;t carry over. When a document is planned we reserve one credit per reel. If you
              don&apos;t have enough, we make as many reels as your credits cover and the rest stay locked until you have more. If a reel fails
              to generate for good, its credit is returned. Credits have no cash value, can&apos;t be transferred, sold or exchanged, and are
              not property; they are a limited licence to use the Service.
            </li>
            <li>
              <strong>Top-ups.</strong> One-time packs of reel credits ({TOPUP_PACKS.map((p) => `${p.credits} for ${formatCents(p.priceCents)}`).join(", ")})
              can be added to any account, including free accounts. Top-up credits don&apos;t expire while your account exists, are used after
              your weekly credits, and aren&apos;t refundable (<See id="refunds" />). They can&apos;t be moved to another account and are lost
              if you delete your account or it is closed for breaking these Terms.
            </li>
            <li>
              <strong>Free trial.</strong> Each account can have one {TRIAL.days}-day free trial of Plus. A payment card is required. During the
              trial you get Plus features with up to {TRIAL.maxReels} reels in total. Unless you cancel before the trial ends, it turns into a
              paid Plus subscription at {formatCents(PLANS.plus.priceCents)} per week and your card is charged then (<See id="promotions" />).
            </li>
            <li>
              <strong>Fair use.</strong> A fair-use limit also applies to protect the Service: currently up to{" "}
              {LIMITS.subscriberUploadsPerDay} uploads in any rolling 24-hour period, on top of the per-file limits in <See id="service" />.
              &quot;Unlimited&quot; or very large allowances are always subject to fair use and to these Terms.
            </li>
            <li>
              <strong>Automatic renewal.</strong> Your subscription renews automatically every week (or every year on a yearly plan), and we
              (through Stripe) will charge the payment method you gave us at the then-current price at the start of each billing period, until
              you cancel. By subscribing, you authorise these recurring charges without further action from you. You can see your next renewal
              date in the billing portal.
            </li>
            <li>
              <strong>Changing plans.</strong> You can switch between Plus, Pro and Ultra at any time. Stripe prorates the change: you are
              credited for the unused part of the old plan and charged for the rest of the period on the new one. Your credits for the period
              change to match the new plan.
            </li>
            <li>
              <strong>Cancelling.</strong> You can cancel at any time from your profile: choose &quot;Manage subscription&quot; to open the
              Stripe billing portal, where you can cancel, update your payment method and see your invoices. When you cancel there, your
              subscription stays active until the end of the period you have already paid for and then does not renew. Cancelling stops future
              charges; nothing already paid is refunded (<See id="refunds" />). Deleting the app from your phone, not using the Service, or
              deleting a document does not cancel a subscription.
            </li>
            <li>
              <strong>When a subscription ends.</strong> Reels already made stay available. Documents bought with the old one-time document
              unlock stay unlocked. New reels follow the free plan rules in <See id="free-plan" />, and unused top-up credits stay on your
              account.
            </li>
            <li>
              <strong>Failed payments.</strong> If a renewal payment fails, Stripe may retry it, and we may keep your access active for a short
              time while it does. If payment still can&apos;t be collected, your subscription will end, and you remain responsible for any
              amount owed.
            </li>
            <li>
              <strong>Price changes.</strong> We may change our prices. If we do, we will tell you in advance by email or in the app, and the new
              price will apply from your next billing period after the notice. If you don&apos;t want to pay the new price, you can cancel before
              it takes effect. Subscribers on the earlier $7.99 monthly plan keep that price and get Plus credits.
            </li>
            <li>
              <strong>Errors.</strong> If we make an obvious mistake in a price or a charge, we may correct it, cancel the order or charge the
              correct amount, after telling you. If we overcharged you because of our error, we will return the difference.
            </li>
          </ul>
          <LegalH3>Payment processing</LegalH3>
          <p>
            Payments are processed by Stripe on Stripe&apos;s secure checkout pages. We never see or store your full card number. By paying, you
            also agree to any terms Stripe presents to you. You must use a payment method you are authorised to use, and you authorise us
            (through Stripe) to charge it for all amounts due. Prices are charged in US dollars; your bank may apply its own currency
            conversion or foreign transaction fees, which are your responsibility.
          </p>
        </Section>

        <Section id="refunds">
          <p>
            <strong>All payments are final. We do not give refunds</strong>, in whole or in part, for any reason, unless the law where you live
            requires us to. This covers every payment on Unspool, including:
          </p>
          <ul>
            <li>
              <strong>Subscriptions.</strong> Weekly and yearly plans, including the current period after you cancel, unused weeks, partial
              periods, renewals you forgot to cancel, and periods in which you didn&apos;t use the Service. Cancelling only stops future charges.
            </li>
            <li>
              <strong>Top-ups and credits.</strong> Used or unused. Credits have no cash value and can&apos;t be exchanged for money. A reel that
              fails to generate gives its <em>credit</em> back automatically; that is a credit, not a refund.
            </li>
            <li>
              <strong>Free trials that convert.</strong> If you don&apos;t cancel before the trial ends, the first charge is final.
            </li>
            <li>
              <strong>Dissatisfaction with output.</strong> Reels you don&apos;t like, that contain mistakes, or that don&apos;t cover your whole
              document. You can see a free reel before paying, and AI output is never guaranteed (<See id="ai-output" />).
            </li>
            <li>
              <strong>Plan changes, account deletion and account closure.</strong> Downgrading, deleting your account, or having it closed for
              breaking these Terms doesn&apos;t entitle you to a refund.
            </li>
            <li>
              <strong>Changes to the Service.</strong> Changes to features, limits, models, voices, formats or prices, temporary outages, or the
              Service shutting down.
            </li>
          </ul>
          <p>
            By completing a purchase you ask us to start delivering it straight away, and you agree that any right to cancel and get your money
            back that would otherwise apply ends once delivery begins, to the extent the law allows.
          </p>
          <p>
            The only exception is where a refund is required by law. Nothing in these Terms takes away a right you have under the consumer law
            that applies to you and can&apos;t be waived (for example, certain statutory rights of consumers in the European Union or the United
            Kingdom). If such a right applies, we will honour it to the extent the law requires and no further. To make a claim under such a
            right, email <Mail to={CONTACT} /> from the address on your account with the date of the charge.
          </p>
        </Section>

        <Section id="chargebacks">
          <p>
            If you think a charge is wrong, please contact us at <Mail to={CONTACT} /> before disputing it with your bank or card issuer; we
            can usually explain or fix a charge quickly. If you file a chargeback or payment dispute, we may suspend your account (including
            access to credits and paid features) while it is open, provide the payment processor with information about your account and use
            of the Service to respond to it, and, if the dispute is resolved in our favour, recover the amount owed. Filing chargebacks for
            charges that you authorised, or that are final under these Terms, is a breach of these Terms and may lead to your account being
            closed.
          </p>
        </Section>

        <Section id="promotions">
          <ul>
            <li>
              <strong>Free trials.</strong> Free trials are limited to one per person, household and payment method, across all accounts, and
              are for new subscribers only. We may refuse a trial, or end one early, where we reasonably believe it is being misused.
            </li>
            <li>
              <strong>Promo codes and discounts.</strong> We may offer promotion codes or discounts at checkout. Unless the offer says
              otherwise, a code: can only be used once per account; has no cash value; can&apos;t be sold, transferred or combined with other
              offers; applies only for the period stated; and may expire or be withdrawn. After a promotional period ends, the regular price
              applies automatically until you cancel.
            </li>
            <li>
              <strong>Referrals.</strong> We may record that a new user arrived through someone&apos;s Share Link. Unless we announce a specific
              referral programme with its own terms, this does not earn anyone credits, money or other rewards.
            </li>
            <li>
              We may void any trial, code, credit or discount obtained by fraud, by mistake, by creating multiple accounts, or in breach of these
              Terms, and may charge for any benefit obtained that way.
            </li>
          </ul>
        </Section>

        <Section id="taxes">
          <p>
            Prices are stated in US dollars. Depending on where you live, sales tax, VAT, GST or similar taxes may apply to your purchase. Where
            we are required to collect such taxes, they will be shown at checkout before you pay, based on the billing information you give,
            which must be accurate. You are responsible for any other taxes, duties or fees (such as bank charges) that apply to you.
          </p>
        </Section>

        <Section id="third-parties">
          <p>
            Unspool relies on other companies to work, including Supabase (accounts, database and file storage), Vercel (hosting), Anthropic
            (AI models that read documents and write reel scripts), a text-to-speech provider for voiceovers, an image-generation provider for
            illustrations, Stripe (payments), Resend (account emails) and, if you choose it, Google sign-in. The full list, and what each one
            does with your information, is in our <Link href="/privacy#sharing">Privacy Policy</Link>.
          </p>
          <p>
            Some features depend on these services, and on your own device, browser and internet connection (for example, the built-in voice
            used when a voiceover isn&apos;t available). We aren&apos;t responsible for third-party services we don&apos;t control, for their
            availability or content, or for any loss caused by them, and your use of a third-party service such as Google or Stripe may also be
            governed by its own terms. The Service may contain links to other websites; we don&apos;t endorse and aren&apos;t responsible for
            them.
          </p>
        </Section>

        <Section id="beta">
          <p>
            We sometimes release features labelled as new, early access, beta, preview or experimental, or make them available to some users
            before others (Ultra subscribers may get early access). These features may be incomplete, may change or be withdrawn at any time
            without notice, may have lower reliability or accuracy, and are provided entirely &quot;as is&quot;. Please don&apos;t rely on them
            for anything important. Feedback on them is welcome and covered by <See id="intellectual-property" />.
          </p>
        </Section>

        <Section id="availability">
          <p>
            We work hard to keep Unspool running smoothly, but we can&apos;t promise it will always be available, error-free or fast, and we
            don&apos;t offer a service-level agreement. It may be interrupted for maintenance, updates, provider outages, high demand or reasons
            outside our control.
          </p>
          <p>
            Unspool is a young product and will change. We may add, change or remove features, file types, formats, AI models, voices, music,
            limits and plans at any time, and the reels generated after a change may look or sound different from earlier ones. If we make a
            change that significantly reduces what you get from a subscription you have paid for, we will let you know and you can cancel. If
            we decide to shut down the Service, we will try to give you at least 30 days&apos; notice so you can save anything you want to
            keep. Shutting down doesn&apos;t entitle you to a refund (<See id="refunds" />).
          </p>
          <p>
            Unspool is not a backup or storage service. Keep your own copies of your original documents; we may delete content as described in
            our Privacy Policy, and generation results are not guaranteed. Links to your audio and video expire after a few hours and are
            renewed when you open the app; don&apos;t rely on them as permanent links.
          </p>
        </Section>

        <Section id="security">
          <p>
            We use reasonable measures to protect the Service and your content, described in the <Link href="/privacy#security">Privacy
            Policy</Link>. You must not interfere with them. If you find a security vulnerability, please report it to{" "}
            <Mail to={PRIVACY_CONTACT} /> with enough detail for us to reproduce it, and give us a reasonable time to fix it before telling
            anyone else.
          </p>
          <p>
            We won&apos;t pursue legal action against good-faith security research that: only uses your own accounts and test data; doesn&apos;t
            access, change or delete other people&apos;s data; doesn&apos;t degrade the Service (no denial-of-service, spam or social
            engineering); stops and reports as soon as you find a vulnerability; and isn&apos;t used to obtain money, credits or other benefits.
            This doesn&apos;t authorise testing of our providers&apos; systems, which have their own rules.
          </p>
        </Section>

        <Section id="termination">
          <LegalH3>You can leave at any time</LegalH3>
          <p>
            You can delete any document from your library, and you can delete your whole account from your profile. Deleting your account
            cancels any active subscription immediately, permanently deletes your documents, reels and Share Links, forfeits any remaining
            credits, and deletes your login. This can&apos;t be undone. Some records, such as purchase records we keep for accounting and tax,
            are retained as described in the Privacy Policy.
          </p>
          <LegalH3>We can suspend or close accounts</LegalH3>
          <p>
            We may suspend or terminate your access, disable Share Links, remove content, withhold or remove credits, or refuse to process a
            document, with or without notice, if we reasonably believe that you have broken these Terms, that your use creates a legal,
            security or financial risk for us, our providers or other users, that your account has been compromised, or if we are required to
            by law. Where it is reasonable and lawful to do so, we will tell you why and give you a chance to respond. Closing or suspending an
            account for breaking these Terms doesn&apos;t entitle you to a refund (<See id="refunds" />).
          </p>
          <LegalH3>Inactive free accounts</LegalH3>
          <p>
            We may delete free accounts that have not been signed into for 24 months, after emailing the address on the account at least 30 days
            in advance. Accounts with an active subscription or unused top-up credits are not deleted for inactivity.
          </p>
          <LegalH3>What survives</LegalH3>
          <p>
            Sections that by their nature should continue after your account ends continue to apply, including those on your promises about
            your content, intellectual property, refunds, chargebacks, disclaimers, limitation of liability, indemnity, disputes, export
            controls and general terms, together with any amounts you owe.
          </p>
        </Section>

        <Section id="disclaimers">
          <p>
            To the fullest extent the law allows, the Service, all reels, Share Links and any other output are provided{" "}
            <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong>, with all faults, without warranties of any kind,
            whether express, implied or statutory. That includes implied warranties of merchantability, satisfactory quality, fitness for a
            particular purpose, title, non-infringement, accuracy, completeness and quiet enjoyment, and any warranties arising from a course of
            dealing or usage of trade. We don&apos;t promise that reels will be accurate, complete, current or suitable for any purpose, that
            using Unspool will improve your grades, understanding or results, that the Service will meet your needs, or that it will be
            uninterrupted, timely, secure or free of errors, viruses or other harmful components. No advice or information you get from us or
            through the Service creates any warranty not expressly stated in these Terms.
          </p>
          <p>
            Some countries and states don&apos;t allow certain warranties to be excluded. If you are a Consumer, you may have legal rights that
            these Terms can&apos;t take away, and nothing here affects them.
          </p>
        </Section>

        <Section id="liability">
          <p>To the fullest extent the law allows:</p>
          <ul>
            <li>
              Unspool and its owners, directors, staff, agents, licensors and suppliers will not be liable for any indirect, incidental,
              special, consequential, exemplary or punitive damages, or for any loss of profits, revenue, savings, data, content, goodwill,
              grades, academic standing, employment, or business opportunities, arising out of or related to these Terms or the Service, even
              if we were told such damages were possible.
            </li>
            <li>
              We will not be liable for decisions you make or actions you take based on a reel, including errors or omissions in AI-generated
              content, or for anything that happens because you shared a reel or a Share Link.
            </li>
            <li>
              We will not be liable for loss caused by unauthorised access to your account that results from you not keeping your password
              secure, or by events outside our reasonable control.
            </li>
            <li>
              Our total liability for all claims arising out of or related to these Terms or the Service is limited to the greater of (a) the
              amount you paid us in the 12 months before the event giving rise to the claim, and (b) US$50.
            </li>
          </ul>
          <p>
            These limits apply whatever the legal theory (contract, tort including negligence, strict liability, statute or otherwise) and even
            if a remedy fails of its essential purpose. They are an essential part of the bargain between you and us, and our prices reflect
            them. They don&apos;t limit liability that can&apos;t be limited by law, such as liability for death or personal injury caused by
            negligence, or for fraud or fraudulent misrepresentation. If you are a Consumer in the EU or UK, we are responsible for loss you
            suffer that is a foreseeable result of our breach of these Terms or our failure to use reasonable care, as the law requires.
          </p>
        </Section>

        <Section id="indemnity">
          <p>
            If you use the Service other than as a Consumer, or otherwise to the extent the law allows, you agree to defend, indemnify and hold
            harmless Unspool and its owners, directors, staff and agents against any claims, losses, damages, liabilities, fines, costs and
            expenses (including reasonable legal fees) brought by a third party that arise from your content, reels you shared, your breach of
            these Terms, or your violation of any law or anyone else&apos;s rights. We will tell you about any such claim and let you take part
            in its defence at your expense; you may not settle a claim that affects us without our written consent.
          </p>
        </Section>

        <Section id="disputes">
          <p>
            <strong>Talk to us first.</strong> If you have a problem with Unspool, please email <Mail to={CONTACT} /> with a description of the
            issue and what you would like us to do, and give us 30 days to try to resolve it informally before starting any formal proceedings.
            Most problems can be sorted out this way.
          </p>
          <p>
            <strong>Governing law.</strong> These Terms, and any dispute arising out of or relating to them or the Service, are governed by the
            laws of <strong>[STATE/COUNTRY]</strong>, without regard to its conflict-of-law rules. The United Nations Convention on Contracts
            for the International Sale of Goods does not apply. Subject to the next paragraph, the courts of <strong>[STATE/COUNTRY]</strong>{" "}
            will have exclusive jurisdiction over any such dispute, and you and we agree to submit to their jurisdiction. Either of us may
            instead bring an individual claim in a small-claims court if it qualifies.
          </p>
          <p>
            <strong>Time limit.</strong> To the extent the law allows, any claim you have arising out of or relating to these Terms or the
            Service must be brought within one year after it arises; otherwise it is permanently barred.
          </p>
          <p>
            <strong>Consumers.</strong> If you are a Consumer, you keep the benefit of any mandatory consumer protection laws of the country
            where you live, and you may also bring proceedings in the courts of that country. Consumers in the European Union can also find out
            about out-of-court resolution options from their national consumer authorities.
          </p>
        </Section>

        <Section id="export">
          <p>
            You may not use, access, export or re-export the Service in violation of US or other applicable export control and economic
            sanctions laws. You confirm that you are not located in a country or region subject to comprehensive US sanctions, and that you are
            not on any US government list of prohibited or restricted parties (such as the Specially Designated Nationals list) or owned or
            controlled by anyone who is. Don&apos;t upload export-controlled technical data.
          </p>
        </Section>

        <Section id="general">
          <ul>
            <li>
              <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and anything shown to you at checkout, are the
              whole agreement between you and us about the Service and replace any earlier agreements about it.
            </li>
            <li>
              <strong>Order of precedence.</strong> If these Terms and the Privacy Policy conflict about how we handle personal information, the
              Privacy Policy applies. Otherwise these Terms apply.
            </li>
            <li>
              <strong>Severability.</strong> If any part of these Terms is found to be unenforceable, the rest stays in effect, and the
              unenforceable part will be applied as far as the law allows to give effect to its intent.
            </li>
            <li>
              <strong>No waiver.</strong> If we don&apos;t enforce a right straight away, we haven&apos;t given it up. A waiver only counts if
              it is in writing.
            </li>
            <li>
              <strong>Assignment.</strong> You may not transfer your rights or obligations under these Terms without our written consent. We may
              transfer ours, for example as part of a merger, acquisition or sale of the business, as long as your rights under these Terms are
              not reduced.
            </li>
            <li>
              <strong>Relationship.</strong> Nothing in these Terms creates a partnership, joint venture, employment or agency relationship
              between you and us.
            </li>
            <li>
              <strong>No third-party beneficiaries.</strong> These Terms are for the benefit of you and us only. No one else has rights under
              them, except our owners, staff and suppliers where a section says it protects them.
            </li>
            <li>
              <strong>Events beyond our control.</strong> We aren&apos;t responsible for delays or failures caused by events we can&apos;t
              reasonably control, such as outages at our providers, internet or power failures, cyberattacks, government action, labour
              disputes, pandemics or natural disasters.
            </li>
            <li>
              <strong>Notices.</strong> We may send notices to the email address on your account or show them in the app; they count as received
              when sent. You can send notices to us at <Mail to={CONTACT} />.
            </li>
            <li>
              <strong>Language.</strong> These Terms are written in English. If we provide a translation, the English version applies if there
              is any conflict, unless the law says otherwise.
            </li>
          </ul>
        </Section>

        <Section id="changes">
          <p>
            We may update these Terms from time to time, for example when we add features, change pricing or respond to new laws. The date at
            the top shows when they last changed, and we keep earlier versions available on request. If a change is significant, we will tell
            signed-in users by email or with a notice in the app at least 14 days before it takes effect, unless the change is needed sooner
            for legal or security reasons. Changes won&apos;t apply retroactively, and changes to payment terms won&apos;t apply to a billing
            period you have already paid for. If you keep using Unspool after the changes take effect, you accept the updated Terms; if you
            don&apos;t agree, you can stop using the Service, cancel any subscription and delete your account.
          </p>
        </Section>

        <Section id="contact">
          <p>
            Questions about these Terms, billing, chargebacks or copyright: <Mail to={CONTACT} />. Privacy questions, requests about your data
            and security reports: <Mail to={PRIVACY_CONTACT} />.
          </p>
          <p>Unspool · unspool.cc</p>
        </Section>
      </article>
    </MarketingPage>
  );
}
