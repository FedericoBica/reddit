import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF8", color: "#1C1C1E" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "64px 24px 96px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E07000" }}>
          ReddProwl
        </p>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: 900, marginTop: 18 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 15, color: "#6B6B6E", marginTop: 14 }}>
          Last updated: April 24, 2026
        </p>

        <section style={{ display: "grid", gap: 28, marginTop: 40, fontSize: 16, lineHeight: 1.7 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>What we collect</h2>
            <p>
              ReddProwl stores the minimum information needed to connect the Chrome extension to your
              account and operate outbound Reddit workflows. That can include extension session tokens,
              selected project identifiers, campaign configuration, queued outreach events, and message
              synchronization metadata.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>How we use it</h2>
            <p>
              We use this data only to authenticate the extension, create and manage outbound campaigns,
              sync queue execution state, and display campaign results in the product. We do not sell this
              data to third parties.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Browser permissions</h2>
            <p>
              The extension requests Chrome permissions such as <code>storage</code>, <code>alarms</code>,
              <code>activeTab</code>, and <code>scripting</code> to persist session state, schedule
              background work, and interact with Reddit pages where the user explicitly runs the extension.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Data sharing</h2>
            <p>
              Data is processed by ReddProwl infrastructure and service providers required to operate the
              product. We do not use extension data for advertising.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Retention</h2>
            <p>
              We retain operational data only as long as necessary to run the product, investigate issues,
              and maintain account history. You can revoke extension sessions from the application settings.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Contact</h2>
            <p>
              For privacy questions, contact the product administrator or support channel associated with
              your ReddProwl deployment.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
