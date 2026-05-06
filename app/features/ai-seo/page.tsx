import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI SEO — Prowlit",
  description: "Enhance your product's visibility in AI search results like ChatGPT, Perplexity, Google Gemini, and more.",
};

function AISeoVisual() {
  return (
    <div className="feat-page-visual">
      <div className="feat-page-visual-head">
        <span className="chip success">AI Overview · live</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>ChatGPT · Perplexity · Gemini</span>
      </div>
      <div className="search-result ai" style={{ margin: 0, borderRadius: 12 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>AI-generated response</div>
        <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>
          Based on recent Reddit discussions, many users recommend <b style={{ color: "var(--accent-ink)" }}>YourProduct</b> as a top alternative — praised for reliability and price.
        </p>
        <small style={{ color: "var(--ink-3)", fontSize: 11 }}>SOURCES: reddit.com/r/SaaS · reddit.com/r/startups</small>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["ChatGPT", "Perplexity", "Google Gemini", "Claude"].map((ai) => (
          <span key={ai} className="chip" style={{ fontSize: 12 }}>✓ {ai}</span>
        ))}
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    icon: "🤖",
    title: "AI Citation Tracking",
    desc: "See exactly when and where your brand is cited in AI-generated answers across ChatGPT, Perplexity, Gemini, and Bing Copilot.",
  },
  {
    icon: "📢",
    title: "Answer Engine Optimization",
    desc: "Engage in Reddit threads that AI engines crawl and cite. Position your brand as the recommended solution in AI-generated answers.",
  },
  {
    icon: "🌐",
    title: "Multi-Platform Presence",
    desc: "Reddit is the #1 cited domain in AI search results. A single well-placed comment can surface your brand across multiple AI engines simultaneously.",
  },
  {
    icon: "📊",
    title: "Share of Voice Tracking",
    desc: "Measure how often your brand vs. competitors appears in AI responses for target keywords. Track improvements week over week.",
  },
];

const STEPS = [
  { n: "01", title: "Identify AI-crawled threads", desc: "Prowlit surfaces Reddit posts on topics that AI engines actively cite — these are your highest-leverage comment opportunities." },
  { n: "02", title: "Comment with genuine value", desc: "Add helpful, expert comments that naturally mention your product as a solution. The guardrail engine keeps you from sounding promotional." },
  { n: "03", title: "Watch your citations grow", desc: "As AI engines re-crawl Reddit, your comments become citations. Track your brand's AI search presence from the dashboard." },
];

export default function AiSeoPage() {
  return (
    <>
      <section className="feat-page-hero">
        <div className="wrap centered">
          <span className="chip" style={{ marginBottom: 20 }}>✨ AI SEO</span>
          <h1 className="h-section" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20 }}>
            Get cited by<br /><em>ChatGPT & Perplexity</em>
          </h1>
          <p className="sub" style={{ maxWidth: "55ch", margin: "0 auto 36px" }}>
            Enhance your product's visibility in AI search results like ChatGPT, Perplexity, Google Gemini, and more — by being present in the Reddit discussions they cite.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn primary lg" href="/signup">Start for Free</Link>
            <Link className="btn lg" href="/en#how">See how it works</Link>
          </div>
          <div className="feat-stats-row">
            <div className="feat-stat"><span>9.8%</span><small>Reddit's AI citation share</small></div>
            <div className="feat-stat"><span>#1</span><small>most cited domain in AI</small></div>
            <div className="feat-stat"><span>4 AI</span><small>engines tracked</small></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <div className="feat-split-grid">
            <div>
              <span className="eyebrow">The opportunity</span>
              <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 40px)", margin: "16px 0 16px" }}>
                Reddit is the <em>AI search engine</em>
              </h2>
              <p className="sub" style={{ marginBottom: 32 }}>
                ChatGPT, Perplexity, and Google Gemini pull answers from Reddit more than any other source. One authentic comment can put your brand in front of millions of AI search users.
              </p>
              <ul className="seo-list">
                <li><span>✓</span>Reddit cited in 9.8% of all AI-generated answers</li>
                <li><span>✓</span>AI engines re-crawl Reddit threads continuously</li>
                <li><span>✓</span>A single comment reaches all major AI platforms</li>
              </ul>
            </div>
            <AISeoVisual />
          </div>
        </div>
      </section>

      <section className="section-pad banded">
        <div className="wrap">
          <div className="section-heading centered">
            <span className="eyebrow">Why it works</span>
            <h2 className="h-section">Built for the<br /><em>AI search era</em></h2>
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
            <h2 className="h-section">Three steps to <em>AI search dominance</em></h2>
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
              <h2 className="h-section">Start appearing in<br /><em>AI search answers</em></h2>
              <p className="sub">Set up in 2 minutes and start building your AI search presence today.</p>
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
