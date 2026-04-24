import type { Metadata } from "next";
import Link from "next/link";
import { BrandLink } from "@/app/components/logo";
import "@/app/landing.css";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built ReddProwl and what we believe about honest, human-led growth.",
};

export default function AboutPage() {
  return (
    <main className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href="/" logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/about" style={{ color: "var(--ink)", fontWeight: 700 }}>About</Link>
            <Link href="/login">Log in</Link>
            <Link className="btn primary sm" href="/signup">Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="section-pad" style={{ paddingBottom: 48 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">About ReddProwl</span>
          <h1
            className="h-section"
            style={{ marginTop: 20, fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 1 }}
          >
            We built the tool <em>we wished existed</em>.
          </h1>
          <p className="sub" style={{ marginTop: 24, fontSize: 20 }}>
            ReddProwl started as a side project. We were spending hours every week manually
            scanning Reddit for threads where our product was relevant — and missing most of
            them. We built a scraper. Then a classifier. Then a reply helper. Then we realised
            other founders had the same problem.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad banded" style={{ padding: "72px 0" }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">The problem we keep seeing</span>
          <h2 className="h-section" style={{ marginTop: 20, marginBottom: 28 }}>
            Reddit is full of buyers. <em>Almost nobody replies.</em>
          </h2>

          <div style={{ display: "grid", gap: 28, color: "var(--ink-2)", fontSize: 17, lineHeight: 1.65 }}>
            <p>
              Every day thousands of people post on Reddit asking for exactly what you sell.
              <em style={{ color: "var(--accent-ink)", fontStyle: "normal", fontWeight: 700 }}> &quot;What&apos;s the best tool for X?&quot;</em>{" "}
              <em style={{ color: "var(--accent-ink)", fontStyle: "normal", fontWeight: 700 }}>&quot;Anyone tried Y? Looking for alternatives.&quot;</em>{" "}
              These posts sit there for days, sometimes weeks, indexed by Google and read by thousands.
            </p>
            <p>
              The founders who reply to them — genuinely, helpfully, without sounding like an ad —
              win customers. The ones who don&apos;t watch those threads become someone else&apos;s case study.
            </p>
            <p>
              The problem isn&apos;t laziness. It&apos;s signal-to-noise. Finding the threads that actually
              matter inside an ocean of noise takes hours, and writing a reply that doesn&apos;t get
              you banned requires reading the room in a way that generic AI tools completely miss.
            </p>
            <p>
              That&apos;s the gap ReddProwl fills: find the right threads automatically, then help
              you say something real.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <span className="eyebrow">What we believe</span>
          <h2 className="h-section" style={{ marginTop: 20, marginBottom: 48 }}>
            Three principles we won&apos;t compromise on.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 28,
            }}
          >
            {[
              {
                n: "01",
                title: "Humans in the loop.",
                body: "ReddProwl never posts on your behalf. We surface opportunities, draft replies, and flag risks. You decide what goes live — from your own account. That's not a limitation; it's the only thing that actually works long-term.",
              },
              {
                n: "02",
                title: "Real help beats spam.",
                body: "The best marketing is a useful comment. We train our AI on top-voted, community-approved replies — not on conversion tricks. If your reply doesn't add value to the thread, we'll tell you.",
              },
              {
                n: "03",
                title: "Transparency about risk.",
                body: "Reddit's moderation is real. Shadowbans are real. We tell you when a subreddit's rules would flag your reply, when your self-promo ratio is too high, and when you're better off not posting at all.",
              },
            ].map((v) => (
              <div
                key={v.n}
                style={{
                  border: "1.5px solid var(--line)",
                  borderRadius: 16,
                  padding: "28px 24px",
                  background: "var(--paper)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 13,
                    color: "var(--accent-ink)",
                    marginBottom: 12,
                    letterSpacing: "0.04em",
                  }}
                >
                  {v.n}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    margin: "0 0 12px",
                    color: "var(--ink)",
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.6 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="section-pad banded" style={{ padding: "72px 0" }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Who it&apos;s built for</span>
          <h2 className="h-section" style={{ marginTop: 20, marginBottom: 32 }}>
            <em>Founders</em> doing their own growth.
          </h2>
          <p className="sub" style={{ marginBottom: 32 }}>
            Not agencies running 50 accounts. Not bots farming karma. Builders — early-stage and
            growth-stage — who want to show up in the conversations their customers are already
            having, say something useful, and turn that into pipeline.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "SaaS founders at 0–$500k ARR who rely on organic channels",
              "Consumer app teams that live or die by word-of-mouth",
              "Agencies managing Reddit presence for clients with real products",
              "Solo operators who can't afford to miss a high-intent thread",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  fontSize: 16,
                  color: "var(--ink-2)",
                }}
              >
                <span
                  style={{
                    color: "var(--accent-ink)",
                    fontWeight: 900,
                    fontSize: 14,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--paper)", padding: "40px 0" }}>
        <div className="wrap">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 32,
              textAlign: "center",
            }}
          >
            {[
              ["12k+", "subreddits monitored"],
              ["92%", "reply relevance avg."],
              ["60s", "median project setup"],
              ["0", "auto-posts — ever"],
            ].map(([n, label]) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 42,
                    fontWeight: 400,
                    color: "var(--ink)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad-sm">
        <div className="wrap">
          <div
            style={{
              border: "1.5px solid var(--ink)",
              borderRadius: 24,
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "56px 48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 24,
              maxWidth: 760,
            }}
          >
            <span
              className="eyebrow"
              style={{ color: "var(--butter)", borderColor: "var(--butter)" }}
            >
              Ready to try it
            </span>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Stop lurking on threads{" "}
              <em style={{ color: "var(--accent)" }}>your customers wrote</em>.
            </h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: "oklch(0.85 0.01 80)", maxWidth: 520 }}>
              7-day free trial. No credit card. Cancel in two clicks.
            </p>
            <div className="cta-row">
              <Link
                className="btn primary lg"
                href="/signup"
                style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
              >
                Start free trial
              </Link>
              <Link
                className="btn lg"
                href="/login"
                style={{ background: "transparent", borderColor: "var(--paper)", color: "var(--paper)" }}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <BrandLink href="/" logoSize={34} wordmarkSize={24} />
              <p>Reddit lead-gen for founders who would rather ship than lurk.</p>
            </div>
            <div className="foot-col">
              <h5>Product</h5>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <Link href="/about">About</Link>
              <a href="#">Customers</a>
              <a href="#">Contact</a>
            </div>
            <div className="foot-col">
              <h5>Legal</h5>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 RedProwl, Inc. Not affiliated with Reddit, Inc.</span>
            <span className="mono">all systems operational</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
