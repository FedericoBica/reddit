import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Mentions — Prowlit",
  description: "Protect and grow your reputation with 24/7 brand tracking. Analyze comment sentiment and jump into conversations with customers.",
};

function BrandVisual() {
  const mentions = [
    { type: "positive", sub: "r/SaaS", text: "Just switched to YourBrand — the onboarding is leagues better", sentiment: "+", age: "5m ago" },
    { type: "neutral", sub: "r/startups", text: "Anyone compared YourBrand vs Competitor X pricing?", sentiment: "~", age: "23m ago" },
    { type: "negative", sub: "r/Entrepreneur", text: "YourBrand support took 3 days to respond to my ticket", sentiment: "−", age: "1h ago" },
  ];
  const sentimentColors: Record<string, string> = {
    positive: "#22c55e",
    neutral: "#f59e0b",
    negative: "#ef4444",
  };
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip"><span className="dot" />Brand radar · live</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>3 mentions today</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mentions.map((m) => (
          <div key={m.text} style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "var(--bg-2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: sentimentColors[m.type] + "22",
                color: sentimentColors[m.type],
                fontWeight: 700, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{m.sentiment}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{m.sub} · {m.age}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>"{m.text}"</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "👁️",
    title: "24/7 Brand Monitoring",
    desc: "Every mention of your brand name, product, and common misspellings is tracked across all of Reddit, around the clock.",
  },
  {
    icon: "💭",
    title: "Sentiment Analysis",
    desc: "Know instantly whether a mention is positive, negative, or neutral. Prioritise crisis response and celebrate wins with customers.",
  },
  {
    icon: "⚡",
    title: "Instant Response Workflow",
    desc: "Jump into any brand mention with a pre-drafted reply in seconds. Turn complaints into testimonials. Turn praise into referrals.",
  },
  {
    icon: "📈",
    title: "Reputation Trends",
    desc: "Track your brand's sentiment score over time. See which product changes, launches, or campaigns moved the needle on Reddit.",
  },
];

const STEPS = [
  { n: "01", title: "Add your brand terms", desc: "Enter your brand name, product names, and any common variations. Prowlit also catches common misspellings automatically." },
  { n: "02", title: "Sentiment is scored instantly", desc: "Every mention is classified as positive, neutral, or negative. Urgent negative mentions surface at the top of your inbox." },
  { n: "03", title: "Engage at the right moment", desc: "Reply to praise, address complaints, and answer questions — all from one inbox. Build a reputation as a brand that actually listens." },
];

export default function BrandMentionsPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>💬 Brand Mentions</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Every Reddit mention.<br /><em>Zero missed conversations.</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Protect and grow your reputation with 24/7 brand tracking. Analyze comment sentiment and jump into conversations with customers the moment they happen.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>24/7</span><small>continuous monitoring</small></div>
            <div className="feat-stat"><span>3</span><small>sentiment categories</small></div>
            <div className="feat-stat"><span>&lt;5 min</span><small>avg response time</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The problem</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Your brand is being discussed.<br /><em>Are you in the room?</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                Reddit users talk about brands constantly — recommending, comparing, and complaining. Most companies only find out weeks later when the damage is done.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>Catch negative sentiment before it goes viral</li>
                <li><span>✓</span>Turn complaints into public trust-building moments</li>
                <li><span>✓</span>Amplify genuine positive reviews organically</li>
              </ul>
            </div>
            <BrandVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">Full-spectrum<br /><em>reputation management</em></h2>
          </div>
          <div className="feat-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="feat-benefit-card">
                <div className="feat-benefit-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">How it works</span>
            <h2 className="h-section">From mention to <em>brand win</em></h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad-sm banded">
        <div className="wrap">
          <div className="cta-block">
            <div>
              <span className="eyebrow">Get started today</span>
              <h2 className="h-section">Start protecting your<br /><em>brand reputation</em></h2>
              <p className="sub">Monitor every Reddit mention with sentiment analysis. Free to try, no credit card needed.</p>
              <div className="cta-row">
                <Link className="btn primary lg" href="/signup">Start Free Trial</Link>
                <Link className="btn lg" href="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
