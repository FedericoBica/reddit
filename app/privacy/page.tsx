import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Prowlit",
};

const S = {
  page: { minHeight: "100vh", background: "#FAFAF8", color: "#1C1C1E" } as React.CSSProperties,
  inner: { maxWidth: 820, margin: "0 auto", padding: "64px 24px 96px" } as React.CSSProperties,
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#E07000" },
  h1: { fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: 900, marginTop: 18 },
  date: { fontSize: 15, color: "#6B6B6E", marginTop: 14 },
  sections: { display: "grid", gap: 28, marginTop: 40, fontSize: 16, lineHeight: 1.7 } as React.CSSProperties,
  h2: { fontSize: 22, fontWeight: 800, marginBottom: 8 },
  ul: { paddingLeft: 20, margin: "8px 0 0" } as React.CSSProperties,
};

export default function PrivacyPage() {
  return (
    <main style={S.page}>
      <div style={S.inner}>
        <p style={S.eyebrow}>Prowlit</p>
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.date}>Last updated: May 2, 2026</p>

        <section style={S.sections}>
          <div>
            <h2 style={S.h2}>What Prowlit is</h2>
            <p>
              Prowlit is a SaaS platform that monitors Reddit and X (Twitter) for buyer-intent
              posts and brand mentions, classifies them with AI, and helps you draft human-like
              replies. It also surfaces Reddit content that ranks in Google search results for
              your brand terms. We process publicly available content on your behalf — we never
              post to any platform automatically.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Information we collect</h2>
            <p>We collect only what is necessary to operate the service:</p>
            <ul style={S.ul}>
              <li>
                <strong>Account data</strong> — your email address, used for authentication via
                magic link.
              </li>
              <li>
                <strong>Project configuration</strong> — company name, website, keywords,
                subreddits, competitors, and X keywords you configure inside the product.
              </li>
              <li>
                <strong>Reddit content</strong> — publicly available Reddit posts and comments
                matching your keywords, fetched via the Reddit API and stored to power your lead
                and mention inboxes.
              </li>
              <li>
                <strong>X (Twitter) content</strong> — publicly available tweets and mentions
                matching your keywords, fetched via the X API. If you connect your X account via
                OAuth, we also store your access and refresh tokens to enable reading your timeline
                and posting replies on your behalf when you explicitly request it.
              </li>
              <li>
                <strong>Google search data</strong> — search result snippets from Google (via
                SerpAPI) used to surface Reddit content that ranks for your brand terms.
              </li>
              <li>
                <strong>Generated content</strong> — AI-drafted reply suggestions created on your
                behalf, stored per lead so you can edit and send them yourself.
              </li>
              <li>
                <strong>Usage data</strong> — product activity (e.g. which leads you marked as
                replied) to maintain state across sessions.
              </li>
            </ul>
          </div>

          <div>
            <h2 style={S.h2}>How we use your information</h2>
            <ul style={S.ul}>
              <li>Authenticate your account and maintain your session.</li>
              <li>Monitor Reddit, X, and Google for content matching your project settings.</li>
              <li>Generate AI reply suggestions when you request them.</li>
              <li>Send email notifications about new leads or mentions (if enabled).</li>
              <li>Operate and improve the service.</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              We do not use your data for advertising. We do not sell your data to third parties.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Third-party services</h2>
            <p>
              Prowlit uses the following sub-processors to deliver the service:
            </p>
            <ul style={S.ul}>
              <li>
                <strong>Supabase</strong> — database, authentication, and file storage.
              </li>
              <li>
                <strong>OpenAI</strong> — AI classification of posts and generation of reply drafts.
                Content and your project context are sent to OpenAI for this purpose.
              </li>
              <li>
                <strong>Reddit API / Apify</strong> — fetching publicly available Reddit posts and
                comments.
              </li>
              <li>
                <strong>X (Twitter) API</strong> — fetching tweets and posting replies when you
                connect your X account.
              </li>
              <li>
                <strong>SerpAPI</strong> — querying Google search results to surface Reddit content
                ranking for your brand terms.
              </li>
              <li>
                <strong>Inngest</strong> — background job orchestration (scheduling scrapes, sending
                notifications).
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery for account and notification
                emails.
              </li>
              <li>
                <strong>Paddle</strong> — subscription billing and payment processing.
              </li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Each sub-processor is bound by its own data processing terms. We do not share your
              personal account data with them beyond what is technically required.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Cookies and local storage</h2>
            <p>
              Prowlit uses cookies and browser storage strictly for authentication (session
              tokens) and product functionality (e.g. remembering your active project). We do not
              use third-party tracking cookies or behavioral analytics cookies.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Data retention</h2>
            <p>
              We retain your data for as long as your account is active. You may request deletion
              of your account and associated data at any time by contacting us. Backups may persist
              for up to 30 days after deletion.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Your rights</h2>
            <p>
              Regardless of where you are located, you can:
            </p>
            <ul style={S.ul}>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and data.</li>
              <li>Export your project configuration and leads data.</li>
            </ul>
            <p style={{ marginTop: 12 }}>To exercise any of these rights, contact us at the address below.</p>
          </div>

          <div>
            <h2 style={S.h2}>Security</h2>
            <p>
              All data is encrypted in transit (TLS) and at rest. Access to production data is
              restricted via Supabase Row-Level Security — each account can only read its own data.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Changes to this policy</h2>
            <p>
              We may update this policy when the service changes materially. If we do, we will
              update the date at the top of this page. Continued use of the service after a change
              constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Contact</h2>
            <p>
              For privacy questions or data requests, email{" "}
              <a href="mailto:fedebicasua@gmail.com" style={{ color: "#E07000" }}>
                fedebicasua@gmail.com
              </a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
