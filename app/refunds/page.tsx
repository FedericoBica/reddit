import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy – Prowlit",
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

export default function RefundsPage() {
  return (
    <main style={S.page}>
      <div style={S.inner}>
        <p style={S.eyebrow}>Prowlit</p>
        <h1 style={S.h1}>Refund Policy</h1>
        <p style={S.date}>Last updated: May 19, 2026</p>

        <section style={S.sections}>
          <div>
            <h2 style={S.h2}>Overview</h2>
            <p>
              Prowlit is a monthly subscription SaaS. We want you to be satisfied with your
              purchase. This policy explains when refunds are available and how to request one.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>7-day money-back guarantee</h2>
            <p>
              If you are not satisfied with Prowlit for any reason, you may request a full refund
              within <strong>7 days</strong> of your initial subscription payment. This applies
              to first-time subscribers only — it does not apply to plan upgrades or renewals.
            </p>
            <p style={{ marginTop: 12 }}>
              To request a refund within this window, email{" "}
              <a href="mailto:fedebicasua@gmail.com" style={{ color: "#E07000" }}>
                fedebicasua@gmail.com
              </a>{" "}
              with the subject line <em>"Refund request"</em> and include the email address
              associated with your account. We will process eligible refunds within 5 business days.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Renewals and mid-cycle cancellations</h2>
            <p>
              After the 7-day window, subscription payments are non-refundable. If you cancel
              your subscription mid-cycle, you retain access to Prowlit until the end of your
              current billing period — no partial refunds are issued for unused days.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Plan upgrades</h2>
            <p>
              When you upgrade to a higher plan, the prorated difference is charged immediately.
              Upgrade charges are non-refundable once the upgraded plan becomes active and
              additional capacity (keywords, AI replies, seats) is available to you.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Exceptions</h2>
            <p>We may issue refunds outside the standard policy in the following cases:</p>
            <ul style={S.ul}>
              <li>
                A technical error on our side prevented you from using the service during your
                billing period and we were unable to resolve it within a reasonable time.
              </li>
              <li>
                You were charged in error (e.g. a duplicate charge or a billing provider
                processing mistake).
              </li>
            </ul>
            <p style={{ marginTop: 12 }}>
              In these cases, contact us at the address below with details and we will investigate
              promptly.
            </p>
          </div>

          <div>
            <h2 style={S.h2}>Contact</h2>
            <p>
              For refund requests or billing questions, email{" "}
              <a href="mailto:fedebicasua@gmail.com" style={{ color: "#E07000" }}>
                fedebicasua@gmail.com
              </a>
              . Please include your account email and a brief description of your issue.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
