"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLink } from "@/app/components/logo";

export const FEATURE_NAV_ITEMS = [
  { slug: "lead-generation", icon: "🎯", title: "Lead Generation", desc: "Turn Reddit intent into customers" },
  { slug: "ai-seo", icon: "✨", title: "AI SEO", desc: "Rank in ChatGPT, Perplexity & Gemini" },
  { slug: "parasite-seo", icon: "📈", title: "Parasite SEO", desc: "Hijack Google rankings via Reddit" },
  { slug: "keyword-tracking", icon: "🔔", title: "Keyword Tracking", desc: "Real-time Reddit keyword alerts" },
  { slug: "brand-mentions", icon: "💬", title: "Brand Mentions", desc: "24/7 brand reputation monitoring" },
  { slug: "competitor-monitoring", icon: "🔍", title: "Competitor Monitoring", desc: "Track rivals across Reddit 24/7" },
];

function FeaturesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="feat-nav-wrap">
      <button
        className="feat-nav-trigger"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        Features
        <svg
          className={`lang-chevron${open ? " open" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="lang-backdrop" onClick={() => setOpen(false)} />
          <div className="feat-nav-dropdown">
            {FEATURE_NAV_ITEMS.map((f) => (
              <Link
                key={f.slug}
                href={`/features/${f.slug}`}
                className="feat-nav-item"
                onClick={() => setOpen(false)}
              >
                <span className="feat-nav-icon">{f.icon}</span>
                <div>
                  <div className="feat-nav-title">{f.title}</div>
                  <div className="feat-nav-desc">{f.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FeaturePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href="/en" logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <FeaturesDropdown />
            <Link href="/en#pricing">Pricing</Link>
            <Link href="/en#how">How it Works</Link>
            <Link href="/about">About</Link>
            <Link className="btn dark sm" href="/login">Login</Link>
            <Link className="btn primary sm" href="/signup">Start Free</Link>
          </div>
        </div>
      </nav>

      {children}

      <footer className="landing-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <BrandLink href="/en" logoSize={34} wordmarkSize={24} />
              <p>Reddit lead radar with AI reply generation.</p>
            </div>
            <div className="foot-col">
              <h5>Features</h5>
              {FEATURE_NAV_ITEMS.map((f) => (
                <Link key={f.slug} href={`/features/${f.slug}`}>{f.title}</Link>
              ))}
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <Link href="/about">About</Link>
              <Link href="/en#pricing">Pricing</Link>
              <Link href="/en#how">How it Works</Link>
            </div>
            <div className="foot-col">
              <h5>Legal</h5>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2025 Prowlit. All rights reserved.</span>
            <span className="mono">all systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
