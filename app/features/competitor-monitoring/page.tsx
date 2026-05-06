import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitor Monitoring — Prowlit",
  description: "Track your competitors' mentions across Reddit comments 24/7 and be present whenever they are being discussed.",
};

function CompetitorVisual() {
  const competitors = [
    { name: "Competitor A", mentions: 47, trend: "+12%", sentiment: 62 },
    { name: "Competitor B", mentions: 31, trend: "+3%", sentiment: 71 },
    { name: "Your Brand", mentions: 28, trend: "+28%", sentiment: 89, highlight: true },
  ];
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip">🔍 Competitor radar · this week</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {competitors.map((c) => (
          <div key={c.name} style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${c.highlight ? "var(--accent)" : "var(--line)"}`,
            background: c.highlight ? "var(--accent-soft)" : "var(--bg-2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: c.highlight ? "var(--accent-ink)" : "var(--ink)", marginBottom: 2 }}>
                {c.name} {c.highlight && "← you"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.mentions} mentions · {c.trend}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 2 }}>sentiment</div>
              <div className={`score-pill ${c.sentiment >= 80 ? "hot" : "warm"}`}>{c.sentiment}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--ink-3)" }}>
        💡 <b style={{ color: "var(--ink)" }}>Opportunity:</b> 3 threads comparing Competitor A to alternatives — no one has mentioned you yet.
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "🔭",
    title: "Always-On Surveillance",
    desc: "Track every Reddit mention of your top competitors, 24/7. Know what buyers are saying about them before your sales team gets on a call.",
  },
  {
    icon: "📊",
    title: "Share of Voice",
    desc: "See your brand's mention volume vs. competitors over time. Understand if you're growing your share of the Reddit conversation — or losing ground.",
  },
  {
    icon: "🎯",
    title: "Opportunity Detection",
    desc: "Prowlit flags threads where competitors are mentioned but you are not. These are your highest-value engagement opportunities.",
  },
  {
    icon: "🧩",
    title: "Competitive Intelligence",
    desc: "Discover what buyers complain about with your competitors. Use their weaknesses as your positioning. Turn their dissatisfied users into your customers.",
  },
];

const STEPS = [
  { n: "01", title: "Add your competitors", desc: "Enter your competitors' names and product names. Prowlit starts tracking mentions across all of Reddit immediately." },
  { n: "02", title: "Get the intelligence", desc: "See mentions in real time, with sentiment and context. Identify patterns: what buyers love, hate, and wish was different." },
  { n: "03", title: "Intercept the conversation", desc: "When a buyer compares competitors in a thread, Prowlit alerts you. Jump in with a helpful comment and win the comparison." },
];

export default function CompetitorMonitoringPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>🔍 Competitor Monitoring</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Be there every time<br /><em>competitors are discussed</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Track your competitors' mentions across Reddit 24/7 and be present whenever they are being discussed — especially when buyers are weighing alternatives.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>24/7</span><small>competitor tracking</small></div>
            <div className="feat-stat"><span>∞</span><small>competitors monitored</small></div>
            <div className="feat-stat"><span>Real-time</span><small>opportunity alerts</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The strategy</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Win in the conversations<br /><em>you don't even know are happening</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                Reddit is where buyers make final decisions. Every day, thousands of threads compare your competitors. Without monitoring, your brand is absent from every one of them.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>Instant alerts when competitors are mentioned</li>
                <li><span>✓</span>Flag comparison threads as high-priority opportunities</li>
                <li><span>✓</span>Track sentiment trends to spot competitor weaknesses</li>
              </ul>
            </div>
            <CompetitorVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">Intelligence that<br /><em>drives decisions</em></h2>
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
            <h2 className="h-section">From mention to <em>won deal</em></h2>
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
              <h2 className="h-section">Start winning<br /><em>the comparison game</em></h2>
              <p className="sub">Track competitor mentions across all of Reddit and intercept buyers at the decision point. Free to try.</p>
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
