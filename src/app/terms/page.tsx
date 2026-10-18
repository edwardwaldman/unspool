import type { Metadata } from "next";
import Link from "next/link";
import { LegalH3, LegalHeader, LegalSection, LegalToc, type TocItem } from "@/components/legal/legal-doc";
import { MarketingPage } from "@/components/shell/marketing-page";
import { ACCEPTED_EXTENSIONS, LIMITS, MAX_FILE_BYTES, MAX_PAGES, MAX_REELS, MAX_WORDS, MIN_REELS, PRICING, formatPrice } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Unspool: accounts, your documents, AI-generated reels, the free plan, payments and subscriptions.",
};

const EFFECTIVE = "October 18, 2026";
const CONTACT = "hello@unspool.cc";
const PRIVACY_CONTACT = "privacy@unspool.cc";

const DOC_PRICE = formatPrice(PRICING.documentCents);
const SUB_PRICE = formatPrice(PRICING.subscriptionCents);
const FILE_TYPES = ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ");
const MAX_MB = Math.round(MAX_FILE_BYTES / (1024 * 1024));
const fmt = (n: number) => n.toLocaleString("en-US");

const SECTIONS = [
  { id: "acceptance", title: "Accepting these terms" },
  { id: "eligibility", title: "Who can use Unspool" },
  { id: "accounts", title: "Your account and its security" },
  { id: "service", title: "What Unspool does" },
  { id: "ai-output", title: "AI-generated reels: read this" },
  { id: "your-content", title: "Your content and our licence to process it" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "intellectual-property", title: "Our intellectual property" },
  { id: "free-plan", title: "The free plan" },
  { id: "paid-plans", title: "Paid plans, billing and cancellation" },
  { id: "refunds", title: "Refunds" },
  { id: "taxes", title: "Prices and taxes" },
  { id: "third-parties", title: "Third-party services" },
  { id: "availability", title: "Availability and changes to the service" },
  { id: "termination", title: "Suspension, termination and deleting your account" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "disputes", title: "Governing law and disputes" },
  { id: "general", title: "General terms" },
  { id: "changes", title: "Changes to these terms" },
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

export default function TermsPage() {
  return (
    <MarketingPage>
      <article className="prose-unspool max-w-[720px] pt-14">
        <LegalHeader
          title="Terms of Service"
          effective={EFFECTIVE}
          intro={
            <>
              <p className="mt-6">
                These terms are the agreement between you and Unspool (&quot;Unspool&quot;, &quot;we&quot;, &quot;us&quot;) for using the
                website and app at unspool.cc (the &quot;Service&quot;). We have tried to write them in plain English. Please read them,
                because they cover what you can expect from us, what we expect from you, and how payments work.
              </p>
              <p>
                How we handle personal information is explained separately in our <Link href="/privacy">Privacy Policy</Link>, which forms
                part of these terms.
              </p>
            </>
          }
        />

        <LegalToc items={[...SECTIONS]} />

        <Section id="acceptance">
          <p>
            By creating an account, uploading a document, buying anything, or otherwise using the Service, you agree to these terms. When
            you sign up with your email address, the sign-up form tells you that continuing means you agree to these terms and the Privacy
            Policy, and we record when you did so. The same applies if you sign up with Google. If you don&apos;t agree, please don&apos;t use the Service.
          </p>
          <p>
            If you use Unspool on behalf of a company, school or other organisation, you confirm that you are allowed to accept these terms
            for it, and &quot;you&quot; includes that organisation.
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
            legal guardian, and only they may make purchases on your behalf. A parent or guardian who allows a minor to use the Service is
            responsible for that use.
          </p>
          <p>
            You may not use the Service if you are barred from doing so under the laws that apply to you, or if we have previously
            terminated your account for breaking these terms.
          </p>
        </Section>

        <Section id="accounts">
          <p>
            You need a free account to turn a document into reels. You can sign up with an email address and password (confirmed with a
            six-digit code we email to you) or, where offered, with your Google account. Accounts are provided through our authentication
            provider, Supabase.
          </p>
          <ul>
            <li>Give us an email address that you own and can receive mail at. We use it to confirm your account, reset your password and contact you about the Service.</li>
            <li>Choose a password of at least 8 characters that you don&apos;t use elsewhere, and keep it secret. You are responsible for activity that happens under your account.</li>
            <li>Accounts are for one person. Don&apos;t share your login, sell or transfer your account, or create accounts to get around limits.</li>
            <li>
              Tell us straight away at <Mail to={CONTACT} /> if you think someone else has accessed your account. You can change your
              password from your profile at any time.
            </li>
          </ul>
        </Section>

        <Section id="service">
          <p>
            Unspool turns a document you upload into a series of short, vertical explainer &quot;reels&quot;, similar in format to short
            social videos, so you can absorb the material more easily. Here is how it works today:
          </p>
          <ul>
            <li>
              You upload a file. We currently accept {FILE_TYPES} files of up to {MAX_MB} MB. We extract the text; for scanned PDFs and
              photos, we use an AI model to read the text from the image.
            </li>
            <li>
              Long documents are cut down to fit our processing limits: we use at most the first {MAX_PAGES} pages of a PDF and the first{" "}
              {fmt(MAX_WORDS)} words of any document. Anything beyond that is not covered by your reels.
            </li>
            <li>
              An AI model plans the reels (usually between {MIN_REELS} and {MAX_REELS}, depending on how many distinct key ideas the
              document has) and writes a script for each one.
            </li>
            <li>
              Each script is turned into a voiceover with a text-to-speech service, and may be combined with AI-generated illustrations and
              captions into a video. If a voiceover isn&apos;t available, the player can read the script aloud using your device&apos;s
              built-in voice.
            </li>
            <li>Your documents and reels are private to your account. They are not published and are not shown to other users.</li>
          </ul>
          <p>
            Generation is automated and can take a few minutes. Occasionally it fails, for example because a file can&apos;t be read or a
            provider is unavailable; when that happens you can retry (a limited number of times per document each day), or delete the
            document.
          </p>
        </Section>

        <Section id="ai-output">
          <p>
            <strong>Reels are written by AI and can be wrong.</strong> We instruct the AI to stay faithful to your document and not to invent
            facts, but AI models can still misread a document, get numbers, names or dates wrong, leave out important detail or nuance,
            oversimplify, or state something with more confidence than the original does. Images are illustrative only and are not
            evidence of anything in your document.
          </p>
          <p>
            <strong>Unspool is a study and comprehension aid, not advice.</strong> Nothing in a reel is legal, financial, tax, medical,
            psychological, academic or other professional advice, even when the document you uploaded is a contract, a policy, a medical
            leaflet or a financial statement. Don&apos;t rely on a reel to make a decision that matters, sign anything, take or stop any
            treatment, meet a deadline, or answer an exam question.
          </p>
          <p>
            <strong>Always check the original.</strong> For anything important, read the original document and, where appropriate, ask a
            qualified professional, your teacher or the document&apos;s author. You are responsible for how you use reels.
          </p>
        </Section>

        <Section id="your-content">
          <LegalH3>You keep ownership</LegalH3>
          <p>
            &quot;Your content&quot; means the files you upload, the text we extract from them, and the reels generated from them (titles,
            hooks, scripts, voiceover audio, images and videos). As between you and Unspool, you own your uploaded files, and we do not claim
            ownership of the reels generated for you. Whether AI-generated material can be protected by copyright varies by country, and
            similar outputs may be generated for other people from similar material, so we can&apos;t promise that a reel is unique or
            protectable.
          </p>
          <LegalH3>The licence you give us</LegalH3>
          <p>
            To run the Service we need your permission to handle your content. You grant Unspool a worldwide, non-exclusive, royalty-free
            licence to host, store, copy, process, transmit and display your content, and to create derivative works from it (that is, the
            reels), <strong>solely to provide the Service to you</strong>, to keep it secure, and to comply with the law. This includes
            sending your content to the service providers listed in our Privacy Policy (for example, the AI model provider that writes the
            scripts and the text-to-speech provider that voices them) so they can do that work for us.
          </p>
          <p>
            We do not use your content to train AI models, we do not sell it, and we do not make it public. The licence ends when you delete
            the content or your account, except for copies that remain for a short time in backups or that we must keep to comply with the
            law.
          </p>
          <LegalH3>Your promises about your content</LegalH3>
          <p>When you upload something, you confirm that:</p>
          <ul>
            <li>you own it, or you have all the rights and permissions needed to upload it and have it processed in the way described in these terms and the Privacy Policy;</li>
            <li>uploading and processing it does not break any law, contract, confidentiality obligation (such as an NDA or your employer&apos;s policies) or anyone else&apos;s rights; and</li>
            <li>if it contains other people&apos;s personal information, you have a lawful basis to share it with us for this purpose.</li>
          </ul>
          <p>
            Unspool is not designed for regulated or highly sensitive data, and we do not offer special protections for it. Don&apos;t upload
            patient health records, payment card numbers, government ID numbers, passwords, classified material, or other data that you are
            legally required to protect in a particular way, unless you are permitted to and accept that it will be processed as described
            in our Privacy Policy. We are not your &quot;business associate&quot; under HIPAA and do not sign agreements of that kind.
          </p>
        </Section>

        <Section id="acceptable-use">
          <p>Use Unspool fairly and lawfully. In particular, you must not:</p>
          <ul>
            <li>upload or generate anything illegal, including content that sexually exploits children, promotes terrorism or violence, or harasses, threatens or defames anyone;</li>
            <li>upload material that infringes someone else&apos;s copyright, trademark, privacy or other rights, or that you obtained unlawfully;</li>
            <li>upload other people&apos;s confidential or personal information without the right to do so;</li>
            <li>upload malware, or files designed to exploit, crash or slow down our systems or our providers&apos; systems;</li>
            <li>include instructions in a document intended to manipulate the AI into ignoring its instructions, revealing information, or producing harmful output;</li>
            <li>scrape, crawl, or use bots or automated scripts to access the Service, except through features we provide for that purpose;</li>
            <li>probe, scan or test the vulnerability of the Service, or bypass any security, authentication, access control, paywall, upload limit or rate limit, including by creating multiple accounts;</li>
            <li>access or try to access another person&apos;s account, documents or reels;</li>
            <li>reverse engineer, copy or resell the Service, or use it or its output to build a competing product, except where the law expressly allows this;</li>
            <li>use the Service to generate spam, misleading content, or content that impersonates a person or organisation; or</li>
            <li>use the Service in a way that breaks the usage policies of the AI providers it relies on, or that could expose us or other users to harm or legal liability.</li>
          </ul>
          <LegalH3>Academic integrity</LegalH3>
          <p>
            Unspool is meant to help you understand and revise material, not to do your work for you. Follow the rules of your school,
            university or course. Don&apos;t submit reels or their scripts as your own work, and don&apos;t use them where AI tools are not
            permitted. Course materials, textbooks and instructor notes are often protected by copyright or by your institution&apos;s rules;
            check that you are allowed to upload them for your personal study before you do.
          </p>
          <LegalH3>Copyright complaints</LegalH3>
          <p>
            Uploaded documents are private and are not published to anyone else. If you nevertheless believe material processed through
            Unspool infringes your copyright, email <Mail to={CONTACT} /> with your contact details, a description of the work, enough
            information for us to identify the material, a statement that you believe in good faith that the use is not authorised, and a
            statement, under penalty of perjury, that your notice is accurate and that you are the owner or authorised to act for the owner.
            We may remove material and terminate repeat infringers&apos; accounts.
          </p>
        </Section>

        <Section id="intellectual-property">
          <p>
            Apart from your content, the Service and everything in it belongs to Unspool or our licensors: the software, design, layouts,
            reel formats and templates, sample reels, the Unspool name and logo, and our website text. These are protected by intellectual
            property laws.
          </p>
          <p>
            We give you a personal, non-exclusive, non-transferable, revocable permission to use the Service for its intended purpose while
            you follow these terms. You may use reels generated from your own documents for your own personal or internal purposes, as
            long as doing so doesn&apos;t break these terms or anyone else&apos;s rights. You may not use our name, logo or
            branding without our written permission.
          </p>
          <p>
            If you send us feedback or suggestions, you allow us to use them freely without paying you or owing you anything. We are glad to
            hear from you.
          </p>
        </Section>

        <Section id="free-plan">
          <p>You can use Unspool for free with a free account and no payment card. On the free plan:</p>
          <ul>
            <li>
              <strong>Reel 1 is free.</strong> For each document, the first reel can be watched as soon as it is ready.
            </li>
            <li>
              <strong>One more reel every hour.</strong> Another reel of that document becomes available for each full hour that passes
              after you uploaded it, until all of that document&apos;s reels are available. You can see the title and hook of every reel,
              including the ones that are still locked. Paying simply makes all of a document&apos;s reels available right away (see below).
            </li>
            <li>
              <strong>Daily upload limit.</strong> Free accounts can upload up to {LIMITS.freeUploadsPerDay} documents in any rolling 24-hour
              period. To stop people getting around this with extra accounts, the limit is counted per account and per network connection
              (using a scrambled, hashed version of your IP address), so people sharing a network may share the same allowance. Deleting a document doesn&apos;t give the upload back.
            </li>
            <li>The file size, page, word and file-type limits described in section 4 apply.</li>
          </ul>
          <p>
            The free plan is offered at our discretion. We may change the number of free reels, the timing, or the free limits at any time
            for new and existing documents, and we may withdraw the free plan or limit it for accounts we reasonably believe are abusing it.
          </p>
        </Section>

        <Section id="paid-plans">
          <p>We currently offer two ways to pay. Prices are shown in the app and on our <Link href="/pricing">pricing page</Link> before you buy.</p>
          <LegalH3>Unlock a single document ({DOC_PRICE}, one-time)</LegalH3>
          <ul>
            <li>A one-time payment of {DOC_PRICE} unlocks every reel of one specific document, straight away. It is not a subscription and does not renew.</li>
            <li>The unlock belongs to that document in your account. It can&apos;t be moved to another document or account. If you delete the document, or delete your account, the unlock is gone too.</li>
            <li>It doesn&apos;t change your daily upload limit.</li>
          </ul>
          <LegalH3>Unspool Unlimited subscription ({SUB_PRICE} per month)</LegalH3>
          <ul>
            <li>
              The subscription costs {SUB_PRICE} per month (unless a different price or a promotion code is shown to you at checkout) and
              makes every reel of every document you upload available as soon as it is ready, while your subscription is active.
            </li>
            <li>
              &quot;Unlimited&quot; means you don&apos;t pay per document. A fair-use limit still applies to protect the Service: currently up
              to {LIMITS.subscriberUploadsPerDay} uploads in any rolling 24-hour period, on top of the per-file limits in section 4. We may
              adjust this limit if needed to keep the Service running well for everyone.
            </li>
            <li>
              <strong>Automatic renewal.</strong> Your subscription renews automatically every month, and we (through Stripe) will charge
              the payment method you gave us at the then-current price at the start of each billing period, until you cancel. By
              subscribing, you authorise these recurring charges.
            </li>
            <li>
              <strong>Cancelling.</strong> You can cancel at any time from your profile: choose &quot;Manage subscription&quot; to open the
              Stripe billing portal, where you can cancel, update your payment method and see your invoices. When you cancel there, your
              subscription stays active until the end of the period you have already paid for and then does not renew. Cancelling stops
              future charges; it doesn&apos;t refund the current period (see Refunds).
            </li>
            <li>
              <strong>When a subscription ends.</strong> Documents you unlocked with a one-time payment stay unlocked. Other documents go
              back to the free plan rules in section 9, so reels that haven&apos;t yet become available through the hourly schedule will be
              locked again.
            </li>
            <li>
              <strong>Failed payments.</strong> If a renewal payment fails, Stripe may retry it, and we may keep your access active for a
              short time while it does. If payment still can&apos;t be collected, your subscription will end.
            </li>
            <li>
              <strong>Price changes.</strong> We may change the subscription price. If we do, we will tell you in advance by email or in the
              app, and the new price will apply from your next billing period after the notice. If you don&apos;t want to pay the new price,
              you can cancel before it takes effect.
            </li>
          </ul>
          <LegalH3>Payment processing</LegalH3>
          <p>
            Payments are processed by Stripe on Stripe&apos;s secure checkout pages. We never see or store your full card number. By paying,
            you also agree to any terms Stripe presents to you. You must use a payment method you are authorised to use. Prices are charged in
            US dollars; your bank may apply its own currency conversion or foreign transaction fees.
          </p>
        </Section>

        <Section id="refunds">
          {/* OWNER REVIEW: refund policy written as a reasonable default; confirm before relying on it. */}
          <p>We want you to be happy with what you pay for. Our refund policy is:</p>
          <ul>
            <li>
              <strong>Document unlocks.</strong> Because the reels are delivered digitally and become available immediately, one-time
              unlocks are generally non-refundable. However, if the reels for a document you paid to unlock fail to generate, or are so broken
              that they can&apos;t reasonably be used, and we can&apos;t fix the problem, contact us within 14 days of purchase and we will
              refund you.
            </li>
            <li>
              <strong>Subscriptions.</strong> You can cancel at any time to stop future charges. We don&apos;t give refunds or credits for
              partial months, or for months in which you didn&apos;t use the Service, except as described here or where the law requires.
              If you were charged for a renewal you didn&apos;t intend and haven&apos;t used the Service since, contact us within 7 days of
              the charge and we will look at it sympathetically.
            </li>
            <li>
              <strong>Mistakes and duplicate charges.</strong> If you were charged twice, or charged in error, we will refund the incorrect
              charge.
            </li>
            <li>
              <strong>Deleting your account.</strong> Deleting your account cancels any active subscription immediately, without a refund
              for the rest of the current billing period. If you only want to stop paying, cancel the subscription first and keep your account
              until the period ends.
            </li>
          </ul>
          <p>
            To ask for a refund, email <Mail to={CONTACT} /> from the address on your account, with the date of the charge. Approved refunds
            go back to the original payment method through Stripe; how long they take to appear depends on your bank.
          </p>
          <p>
            Nothing in this section limits rights you have under the law where you live. For example, if you are a consumer in the European
            Union or the United Kingdom, you may have a statutory right to cancel a purchase of digital content within 14 days, which can be
            lost once delivery has begun with your agreement. Where such a right applies to you, we will honour it.
          </p>
        </Section>

        <Section id="taxes">
          <p>
            Prices are stated in US dollars. Depending on where you live, sales tax, VAT, GST or similar taxes may apply to your purchase.
            Where we are required to collect such taxes, they will be shown at checkout before you pay. You are responsible for any other
            taxes, duties or fees (such as bank charges) that apply to you.
          </p>
        </Section>

        <Section id="third-parties">
          <p>
            Unspool relies on other companies to work, including Supabase (accounts, database and file storage), Vercel (hosting), Anthropic
            (AI models that read documents and write reel scripts), a text-to-speech provider for voiceovers, an image-generation provider
            for illustrations, Stripe (payments), Resend (account emails) and, if you choose it, Google sign-in. The full list, and what each
            one does with your information, is in our <Link href="/privacy#sharing">Privacy Policy</Link>.
          </p>
          <p>
            Some features depend on these services, and on your own device and browser (for example, the built-in voice used when a
            voiceover isn&apos;t available). We aren&apos;t responsible for third-party services we don&apos;t control, or for their
            availability, and your use of a third-party service such as Google or Stripe may also be governed by its own terms.
          </p>
        </Section>

        <Section id="availability">
          <p>
            We work hard to keep Unspool running smoothly, but we can&apos;t promise it will always be available, error-free or fast. It may
            be interrupted for maintenance, updates, provider outages or reasons outside our control.
          </p>
          <p>
            Unspool is a young product and will change. We may add, change or remove features, file types, formats, AI models, voices, limits
            and plans at any time. If we make a change that significantly reduces what you get from a subscription you have paid for, we will
            let you know and you can cancel. If we decide to shut down the Service, we will try to give you at least 30 days&apos; notice so
            you can save anything you want to keep, and we will refund the unused part of any prepaid subscription period.
          </p>
          <p>
            Unspool is not a backup or storage service. Keep your own copies of your original documents; we may delete content as described
            in our Privacy Policy, and generation results are not guaranteed.
          </p>
        </Section>

        <Section id="termination">
          <LegalH3>You can leave at any time</LegalH3>
          <p>
            You can delete any document from your library, and you can delete your whole account from your profile. Deleting your account
            cancels any active subscription immediately, permanently deletes your documents and reels, and deletes your login. This
            can&apos;t be undone. Some records, such as purchase records we keep for accounting and tax, are retained as described in the
            Privacy Policy.
          </p>
          <LegalH3>We can suspend or close accounts</LegalH3>
          <p>
            We may suspend or terminate your access, remove content, or refuse to process a document, with or without notice, if we
            reasonably believe that you have broken these terms, that your use creates a legal, security or financial risk for us, our
            providers or other users, or if we are required to by law. Where it is reasonable to do so, we will tell you why and give you a
            chance to respond. If we close your account without cause, we will refund the unused part of any prepaid subscription period.
            If we close it because you broke these terms, you won&apos;t get a refund.
          </p>
          <p>
            The sections on your promises about your content, intellectual property, disclaimers, limitation of liability, indemnity,
            disputes and general terms continue to apply after your account ends.
          </p>
        </Section>

        <Section id="disclaimers">
          <p>
            To the fullest extent the law allows, the Service and all reels are provided <strong>&quot;as is&quot;</strong> and{" "}
            <strong>&quot;as available&quot;</strong>, without warranties of any kind, whether express, implied or statutory. That includes
            implied warranties of merchantability, fitness for a particular purpose, title, non-infringement, accuracy and quiet enjoyment.
            We don&apos;t promise that reels will be accurate, complete or suitable for any purpose, that the Service will meet your needs, or
            that it will be uninterrupted, secure or free of errors or harmful components.
          </p>
          <p>
            Some countries and states don&apos;t allow certain warranties to be excluded. If you are a consumer, you may have legal rights
            that these terms can&apos;t take away, and nothing here affects them.
          </p>
        </Section>

        <Section id="liability">
          <p>To the fullest extent the law allows:</p>
          <ul>
            <li>
              Unspool and its owners, staff and suppliers will not be liable for any indirect, incidental, special, consequential, exemplary
              or punitive damages, or for any loss of profits, revenue, data, goodwill, grades, or business opportunities, arising out of or
              related to these terms or the Service, even if we were told such damages were possible.
            </li>
            <li>
              We will not be liable for decisions you make or actions you take based on a reel, including errors or omissions in AI-generated
              content.
            </li>
            <li>
              Our total liability for all claims arising out of or related to these terms or the Service is limited to the greater of (a)
              the amount you paid us in the 12 months before the event giving rise to the claim, and (b) US$50.
            </li>
          </ul>
          <p>
            These limits apply whatever the legal theory (contract, tort including negligence, or otherwise). They don&apos;t limit liability
            that can&apos;t be limited by law, such as liability for death or personal injury caused by negligence, or for fraud.
          </p>
        </Section>

        <Section id="indemnity">
          <p>
            If you use the Service other than as a consumer, or to the extent the law allows, you agree to defend and indemnify Unspool and
            its owners and staff against any claims, losses, damages, costs and expenses (including reasonable legal fees) brought by a third
            party that arise from your content, your breach of these terms, or your violation of any law or anyone else&apos;s rights. We
            will tell you about any such claim and let you take part in its defence.
          </p>
        </Section>

        <Section id="disputes">
          <p>
            <strong>Talk to us first.</strong> If you have a problem with Unspool, please email <Mail to={CONTACT} /> and give us 30 days
            to try to resolve it informally before starting any formal proceedings. Most problems can be sorted out this way.
          </p>
          <p>
            <strong>Governing law.</strong> These terms, and any dispute arising out of or relating to them or the Service, are governed by
            the laws of <strong>[STATE/COUNTRY]</strong>, without regard to its conflict-of-law rules. Subject to the next paragraph, the
            courts of <strong>[STATE/COUNTRY]</strong> will have exclusive jurisdiction over any such dispute, and you and we agree to submit
            to their jurisdiction. Either of us may instead bring an individual claim in a small-claims court if it qualifies.
          </p>
          <p>
            <strong>Consumers.</strong> If you are a consumer, you keep the benefit of any mandatory consumer protection laws of the country
            where you live, and you may also bring proceedings in the courts of that country. Consumers in the European Union can also find
            out about out-of-court resolution options from their national consumer authorities.
          </p>
        </Section>

        <Section id="general">
          <ul>
            <li>
              <strong>Entire agreement.</strong> These terms, together with the Privacy Policy and anything shown to you at checkout, are the
              whole agreement between you and us about the Service.
            </li>
            <li>
              <strong>Severability.</strong> If any part of these terms is found to be unenforceable, the rest stays in effect, and the
              unenforceable part will be applied as far as the law allows.
            </li>
            <li>
              <strong>No waiver.</strong> If we don&apos;t enforce a right straight away, we haven&apos;t given it up.
            </li>
            <li>
              <strong>Assignment.</strong> You may not transfer your rights under these terms. We may transfer ours, for example as part of a
              merger or sale of the business, as long as your rights under these terms are not reduced.
            </li>
            <li>
              <strong>Events beyond our control.</strong> We aren&apos;t responsible for delays or failures caused by events we can&apos;t
              reasonably control, such as outages at our providers, internet failures, or natural disasters.
            </li>
            <li>
              <strong>Notices.</strong> We may send notices to the email address on your account or show them in the app. You can send
              notices to us at <Mail to={CONTACT} />.
            </li>
            <li>
              <strong>Language.</strong> These terms are written in English. If we provide a translation, the English version applies if
              there is any conflict, unless the law says otherwise.
            </li>
          </ul>
        </Section>

        <Section id="changes">
          <p>
            We may update these terms from time to time, for example when we add features, change pricing or respond to new laws. The date
            at the top shows when they last changed. If a change is significant, we will tell signed-in users by email or with a notice in
            the app before it takes effect. Changes won&apos;t apply retroactively. If you keep using Unspool after the changes take effect,
            you accept the updated terms; if you don&apos;t agree, you can stop using the Service and delete your account.
          </p>
        </Section>

        <Section id="contact">
          <p>
            Questions about these terms, billing or refunds: <Mail to={CONTACT} />. Privacy questions and requests about your data:{" "}
            <Mail to={PRIVACY_CONTACT} />.
          </p>
          <p>Unspool · unspool.cc</p>
        </Section>
      </article>
    </MarketingPage>
  );
}
