import Link from "next/link";

export function XUpgradeGate({ projectId }: { projectId: string }) {
  const features = [
    "Monitor X/Twitter for buyer-intent posts in real time",
    "AI classification by intent score — prioritize high-signal tweets",
    "Track keywords across X alongside your Reddit monitoring",
    "Manual outreach workflow — reply directly from the feed",
  ];

  return (
    <div className="app-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          padding: "48px 32px",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        {/* X logo */}
        <div
          style={{
            width: 52,
            height: 52,
            background: "#000",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.74-8.851L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
        </div>

        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#E07000",
            marginBottom: 10,
          }}
        >
          Growth & Professional
        </p>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#1A1A1B",
            marginBottom: 10,
            lineHeight: 1.15,
          }}
        >
          Unlock X Monitoring
        </h2>

        <p style={{ fontSize: 14, color: "#6B6B6E", lineHeight: 1.6, marginBottom: 28 }}>
          Your current plan doesn't include X/Twitter lead monitoring.
          Upgrade to track buyer-intent tweets alongside your Reddit feed.
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 32px",
            textAlign: "left",
            display: "grid",
            gap: 10,
          }}
        >
          {features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#FFF3EC",
                  border: "1.5px solid #E07000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2.5 2.5L8 2.5" stroke="#E07000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>

        <Link
          href={`/settings?tab=billing&projectId=${projectId}`}
          style={{
            display: "block",
            background: "#1A1A1B",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            padding: "13px 24px",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Upgrade to unlock X Monitoring →
        </Link>

        <p style={{ marginTop: 14, fontSize: 12, color: "#9CA3AF" }}>
          Starting at $39/mo · Cancel anytime
        </p>
      </div>
    </div>
  );
}
