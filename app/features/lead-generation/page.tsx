import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Generation — Prowlit",
  description: "Turn high-intent Reddit users into a consistent stream of leads, app installs, and loyal customers through organic engagement.",
};

function LeadVisual() {
  const leads = [
    { ini: "SF", name: "u/scrappy_founder", tag: "Founder · SaaS", score: 94, band: "hot" },
    { ini: "DD", name: "u/dtc_dave", tag: "DTC · Shopify", score: 88, band: "hot" },
    { ini: "GC", name: "u/growth_chloe", tag: "Growth · B2B", score: 71, band: "warm" },
  ];
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip"><span className="dot" />Live leads · last 24h</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>3 new matches</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {leads.map((l) => (
          <div key={l.name} className="feat-lead-row">
            <div className="avatar" style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{l.ini}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{l.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{l.tag}</div>
            </div>
            <div className={`score-pill ${l.band}`}>{l.score}</div>
            <button className="btn sm">Reply</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "🎯",
    title: "Intent Scoring",
    desc: "Every post is scored 0–100 for buyer intent. Only reply to the leads most likely to convert — skip the noise entirely.",
  },
  {
    icon: "🔍",
    title: "Keyword Matching",
    desc: "Set up keywords for your product category. Prowlit monitors all of Reddit 24/7 and surfaces posts that match before your competitors see them.",
  },
  {
    icon: "🤖",
    title: "AI Reply Drafts",
    desc: "For each lead, Prowlit drafts a human-sounding reply tailored to the thread context. Review, tweak, and send — or regenerate in one click.",
  },
  {
    icon: "📥",
    title: "Unified Inbox",
    desc: "All leads, draft replies, and sent messages in one place. Your team can collaborate, assign leads, and track conversion without juggling tabs.",
  },
];

const STEPS = [
  { n: "01", title: "Describe your ICP", desc: "Enter the keywords, subreddits, and product category that describe your ideal customer problem." },
  { n: "02", title: "Prowlit finds the buyers", desc: "Our system scans Reddit continuously. When a post scores above your intent threshold, it lands in your inbox." },
  { n: "03", title: "Reply authentically", desc: "Review the AI draft, personalise it, and send. The guardrail engine ensures you never violate subreddit rules." },
];

export default function LeadGenerationPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>🎯 Lead Generation</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Turn Reddit<br /><em>intent into revenue</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Turn high-intent Reddit users into a consistent stream of leads, app installs, and loyal customers through organic engagement.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>94%</span><small>intent accuracy</small></div>
            <div className="feat-stat"><span>2 min</span><small>setup time</small></div>
            <div className="feat-stat"><span>24/7</span><small>Reddit monitoring</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The inbox</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Every lead <em>scored and ready</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                Stop reading thousands of posts manually. Prowlit scores every Reddit thread for buyer intent and queues only the ones worth your time.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>Intent scores from 0–100 using OpenAI classification</li>
                <li><span>✓</span>Match reasons so you know exactly why a lead surfaced</li>
                <li><span>✓</span>Thread context preserved for better reply quality</li>
              </ul>
            </div>
            <LeadVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">Everything you need<br /><em>to close Reddit leads</em></h2>
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

      <section className="section-pad" id="how">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">How it works</span>
            <h2 className="h-section">From zero to <em>first lead in minutes</em></h2>
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
              <h2 className="h-section">Your next customer<br /><em>is already on Reddit</em></h2>
              <p className="sub">Start finding high-intent leads in under 2 minutes. No credit card required.</p>
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
