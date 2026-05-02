import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Prowlit",
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

export default function TermsPage() {
  return (
    <main style={S.page}>
      <div style={S.inner}>
        <p style={S.eyebrow}>Prowlit</p>
        <h1 style={S.h1}>Terms of Service</h1>
        <p style={S.date}>Last updated: May 2, 2026</p>

        <section style={S.sections}>
          <div>
            <h2 style={S.h2}>Acceptance</h2>
            <p>
              By creating an account or using Prowlit, you agree to these Terms of Service. If
              you do not agree, do not use the service.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>What Prowlit provides</h2>
            <p>
              Prowlit monitors Reddit for posts and comments matching your configured keywords
              and brand terms, classifies them with AI, and helps you draft replies. The service
              surfaces relevant conversations — you decide whether and how to engage with them.
              Prowlit never posts to Reddit on your behalf automatically.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Your account</h2>
            <ul style={S.ul}>
              <li>You must provide a valid email address to create an account.</li>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>You may not share your account with others or create accounts on behalf of third parties without their consent.</li>
              <li>You must be at least 18 years old to use Prowlit.</li>
            </ul>
          </div>

          <div>
            <h2 style={S.h2}>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul style={S.ul}>
              <li>Use Prowlit to send spam, unsolicited messages, or harass Reddit users.</li>
              <li>Violate Reddit's User Agreement or Content Policy when engaging with leads or mentions.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from Prowlit's infrastructure.</li>
              <li>Use the service for any unlawful purpose or in violation of applicable regulations.</li>
              <li>Attempt to circumvent account limits or billing restrictions.</li>
            </ul>
          </div>

          <div>
            <h2 style={S.h2}>AI-generated content</h2>
            <p>
              Prowlit uses AI to classify leads and generate reply suggestions. These suggestions
              are drafts only — you review and decide whether to use them. You are solely responsible
              for any content you post to Reddit. Prowlit makes no guarantees about the accuracy,
              appropriateness, or effectiveness of AI-generated content.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Reddit content</h2>
            <p>
              Reddit posts and comments surfaced in the product are publicly available content
              owned by their respective authors and subject to Reddit's terms. Prowlit does not
              claim ownership of this content and displays it for your informational use only.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Subscription and billing</h2>
            <p>
              Access to paid features requires a subscription. Subscriptions are billed as described
              at sign-up. You may cancel at any time; cancellation takes effect at the end of your
              current billing period. We reserve the right to change pricing with reasonable advance
              notice.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Intellectual property</h2>
            <p>
              Prowlit and its underlying technology are owned by Prowlit. You retain ownership
              of any content you create (project configurations, custom reply drafts). By using the
              service, you grant Prowlit a limited license to process your configuration data
              solely to operate the service.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Disclaimer of warranties</h2>
            <p>
              Prowlit is provided "as is" without warranties of any kind, express or implied.
              We do not warrant that the service will be uninterrupted, error-free, or that any
              leads or mentions surfaced will result in business outcomes. Use the service at your
              own risk.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Prowlit's total liability for any claim
              arising from use of the service is limited to the amount you paid in the 3 months
              preceding the claim. Prowlit is not liable for indirect, incidental, or
              consequential damages.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Termination</h2>
            <p>
              You may cancel your account at any time from the settings page. We may suspend or
              terminate accounts that violate these terms, with or without notice depending on
              severity. Upon termination, your data will be deleted in accordance with our Privacy
              Policy.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Changes to these terms</h2>
            <p>
              We may update these terms as the service evolves. Material changes will be communicated
              via email or an in-app notice. Continued use after the effective date of updated terms
              constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Contact</h2>
            <p>
              Questions about these terms?{" "}
              <a href="mailto:fedebicasua@gmail.com" style={{ color: "#E07000" }}>
                fedebicasua@gmail.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
