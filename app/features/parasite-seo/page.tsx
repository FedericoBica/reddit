import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parasite SEO — Prowlit",
  description: "Leverage the massive domain authority of Reddit to hijack top Google rankings. Place your brand front and center in the discussions already winning the SEO race.",
};

function ParasiteSeoVisual() {
  const results = [
    { rank: 1, domain: "reddit.com", title: "Best CRM for small SaaS teams 2025?", comment: "Your brand · 94% upvoted", highlight: true },
    { rank: 2, domain: "reddit.com", title: "Competitor A vs Competitor B — which is better?", comment: "Your brand · mentioned", highlight: true },
    { rank: 3, domain: "review-site.com", title: "Top 10 CRM Tools Reviewed", comment: null, highlight: false },
  ];
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip">🔍 Google SERP · top results</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map((r) => (
          <div key={r.rank} style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${r.highlight ? "var(--accent)" : "var(--line)"}`,
            background: r.highlight ? "var(--accent-soft)" : "var(--bg-2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>#{r.rank}</span>
              <span style={{ fontSize: 11, color: r.highlight ? "var(--accent-ink)" : "var(--ink-3)", fontWeight: 600 }}>{r.domain}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: r.comment ? 4 : 0 }}>{r.title}</div>
            {r.comment && <div style={{ fontSize: 11, color: "var(--accent-ink)", fontWeight: 600 }}>↳ {r.comment}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "🏋️",
    title: "Borrow Reddit's Authority",
    desc: "Reddit has one of the highest domain authority scores on the internet. Your comments inherit that authority and rank alongside Reddit's results.",
  },
  {
    icon: "⚡",
    title: "Rank Without a Website",
    desc: "No blog, no backlink building, no content team needed. A strategic comment in a high-ranking Reddit thread can put you on page 1 within days.",
  },
  {
    icon: "🎪",
    title: "Capture Comparison Traffic",
    desc: "Target threads where buyers compare you to competitors. Be present in the conversation and influence the decision at the exact moment it happens.",
  },
  {
    icon: "🔄",
    title: "Compound Over Time",
    desc: "Unlike ads, Reddit comments don't expire. A well-placed comment from months ago can keep driving traffic and leads indefinitely.",
  },
];

const STEPS = [
  { n: "01", title: "Find high-ranking threads", desc: "Prowlit identifies Reddit threads that already rank on page 1 of Google for your target keywords — these are your SEO leverage points." },
  { n: "02", title: "Comment with authority", desc: "Add a genuinely helpful comment that positions your product as the answer. Our AI drafts the reply; you review and send." },
  { n: "03", title: "Rank alongside Reddit", desc: "Your comment appears in a page-1 result. Buyers searching Google see your brand in a trusted peer discussion, not an ad." },
];

export default function ParasiteSeoPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>📈 Parasite SEO</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Hijack Google rankings<br /><em>through Reddit</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Leverage the massive domain authority of Reddit to hijack top Google rankings. Place your brand front and center in the discussions already winning the SEO race.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>DA 91</span><small>Reddit's domain authority</small></div>
            <div className="feat-stat"><span>Top 3</span><small>Reddit ranks for most queries</small></div>
            <div className="feat-stat"><span>$0</span><small>ad spend required</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The strategy</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Reddit already owns <em>your keywords</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                Search any buying-intent keyword and Reddit dominates page 1. Instead of competing against Reddit's DA 91, use it as your distribution channel.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>Reddit threads rank for 80%+ of "best X" and "X vs Y" queries</li>
                <li><span>✓</span>Comments in top-ranked threads inherit the same visibility</li>
                <li><span>✓</span>No domain authority or backlink building required</li>
              </ul>
            </div>
            <ParasiteSeoVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">SEO without<br /><em>building a blog</em></h2>
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
            <h2 className="h-section">Page 1 in <em>three steps</em></h2>
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
              <h2 className="h-section">Rank on Google<br /><em>without a website</em></h2>
              <p className="sub">Start appearing in top search results through Reddit's domain authority. Free to try.</p>
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
