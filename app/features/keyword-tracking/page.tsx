import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Reddit Keyword Tracking — Prowlit",
  description: "Get instant alerts when your target keywords appear on Reddit. Filtered by AI to only show relevant results.",
};

function KeywordVisual() {
  const alerts = [
    { kw: "CRM for startups", sub: "r/startups", score: 92, age: "2m ago", band: "hot" },
    { kw: "Intercom alternative", sub: "r/SaaS", score: 87, age: "14m ago", band: "hot" },
    { kw: "customer support tool", sub: "r/Entrepreneur", score: 64, age: "1h ago", band: "warm" },
  ];
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip"><span className="dot" />Live alerts</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>3 keywords · 12 subreddits</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((a) => (
          <div key={a.kw} style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "var(--bg-2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 3 }}>"{a.kw}"</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{a.sub} · {a.age}</div>
            </div>
            <div className={`score-pill ${a.band}`}>{a.score}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <span style={{ fontSize: 13, color: "var(--accent-ink)", fontWeight: 600 }}>AI filtered — only showing relevant matches</span>
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "⚡",
    title: "Real-Time Alerts",
    desc: "Get notified the moment a matching post appears on Reddit — before it gains traction and before your competitors can respond.",
  },
  {
    icon: "🧠",
    title: "AI Noise Filter",
    desc: "Simple keyword tools flood you with irrelevant matches. Prowlit's AI reads the context of each post and only surfaces genuinely relevant results.",
  },
  {
    icon: "🎛️",
    title: "Custom Thresholds",
    desc: "Set a minimum intent score per keyword. Only hear about posts where someone is actively looking for a solution — not just mentioning a topic.",
  },
  {
    icon: "📡",
    title: "Subreddit Targeting",
    desc: "Limit monitoring to the subreddits where your buyers actually hang out. Ignore noise from off-topic communities entirely.",
  },
];

const STEPS = [
  { n: "01", title: "Add your keywords", desc: "Enter the phrases your ideal buyers use when they have a problem you solve. Prowlit suggests related terms based on your product." },
  { n: "02", title: "AI filters the noise", desc: "Every matching post is scored for intent and relevance. Only the ones above your threshold land in your inbox." },
  { n: "03", title: "Engage instantly", desc: "Open the alert, read the thread, and send a reply — all from within Prowlit. Be first. Be helpful. Win the lead." },
];

export default function KeywordTrackingPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>🔔 AI Keyword Tracking</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Never miss a buyer<br /><em>mentioning your keywords</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Get instant alerts when your target keywords appear on Reddit — filtered by AI to only show the results that actually matter.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>&lt;2 min</span><small>alert latency</small></div>
            <div className="feat-stat"><span>95%</span><small>noise reduction</small></div>
            <div className="feat-stat"><span>∞</span><small>subreddits monitored</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The problem</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Signal-to-noise ratio <em>is everything</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                Simple keyword tools like F5Bot send you hundreds of irrelevant alerts. Prowlit's AI reads each post in context and only sends you the matches worth your time.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>AI reads full post context, not just keyword presence</li>
                <li><span>✓</span>Intent scoring separates buyers from browsers</li>
                <li><span>✓</span>Team inbox so nothing falls through the cracks</li>
              </ul>
            </div>
            <KeywordVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">Keyword tracking<br /><em>that doesn't waste your time</em></h2>
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
            <h2 className="h-section">From keyword to <em>closed lead</em></h2>
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
              <h2 className="h-section">Set up alerts in<br /><em>under 2 minutes</em></h2>
              <p className="sub">Track any keyword on Reddit with AI-powered filtering. No credit card required.</p>
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
