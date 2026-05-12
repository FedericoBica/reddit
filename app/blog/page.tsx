import type { Metadata } from "next";
import Link from "next/link";
import { BrandLink } from "@/app/components/logo";
import { listPosts } from "@/lib/blog";
import "@/app/landing.css";

export const metadata: Metadata = {
  title: "Blog — Prowlit",
  description: "Guides and insights on Reddit lead generation, buyer intent, and honest growth.",
};

export const revalidate = 60;

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(dateStr)
  );
}

export default async function BlogIndexPage() {
  const posts = await listPosts();

  return (
    <main className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href="/" logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/blog" style={{ color: "var(--ink)", fontWeight: 700 }}>Blog</Link>
            <Link href="/login">Log in</Link>
            <Link className="btn primary sm" href="/signup">Start here</Link>
          </div>
        </div>
      </nav>

      <section className="section-pad" style={{ paddingBottom: 48 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Blog</span>
          <h1 className="h-section" style={{ marginTop: 16, marginBottom: 8 }}>
            Guides & insights
          </h1>
          <p className="sub" style={{ marginTop: 12, marginBottom: 56, fontSize: 18 }}>
            Everything we know about finding buyers on Reddit and X.
          </p>

          {posts.length === 0 ? (
            <p style={{ color: "var(--ink-3)" }}>No posts yet — check back soon.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {posts.map((post, i) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                  <article
                    className="blog-card"
                    style={{
                      padding: "32px 12px",
                      borderBottom: "1px solid var(--border, var(--line))",
                      borderTop: i === 0 ? "1px solid var(--border, var(--line))" : undefined,
                    }}
                  >
                    {post.targetKeyword && (
                      <span className="chip" style={{ fontSize: 11, padding: "3px 10px", marginBottom: 10, display: "inline-block" }}>
                        {post.targetKeyword}
                      </span>
                    )}
                    <h2 style={{ fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, marginBottom: 10 }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 14 }}>
                      {post.description}
                    </p>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {post.date && (
                        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{formatDate(post.date)}</span>
                      )}
                      <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, marginLeft: "auto" }}>
                        Read →
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="wrap">
          <div className="foot-bottom">
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>© 2025 Prowlit. All rights reserved.</span>
            <div style={{ display: "flex", gap: 20 }}>
              <Link href="/terms" style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none" }}>Terms</Link>
              <Link href="/privacy" style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none" }}>Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
