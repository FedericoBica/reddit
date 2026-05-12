import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandLink } from "@/app/components/logo";
import { getPost, listPosts } from "@/lib/blog";
import "@/app/landing.css";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Prowlit Blog`,
    description: post.description,
  };
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(dateStr)
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href="/" logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/blog" style={{ fontWeight: 700, color: "var(--ink)" }}>Blog</Link>
            <Link href="/login">Log in</Link>
            <Link className="btn primary sm" href="/signup">Start here</Link>
          </div>
        </div>
      </nav>

      <article className="section-pad" style={{ paddingBottom: 80 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>

          <Link
            href="/blog"
            style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 40 }}
          >
            ← All posts
          </Link>

          {post.targetKeyword && (
            <div style={{ marginBottom: 16 }}>
              <span className="chip" style={{ fontSize: 11, padding: "3px 10px" }}>{post.targetKeyword}</span>
            </div>
          )}

          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20 }}>
            {post.title}
          </h1>

          {post.date && (
            <div style={{ marginBottom: 48, paddingBottom: 32, borderBottom: "1px solid var(--border, var(--line))" }}>
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{formatDate(post.date)}</span>
            </div>
          )}

          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div
            style={{
              marginTop: 64,
              padding: "32px 36px",
              background: "var(--bg-2)",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
              Ready to find your next 10 customers on Reddit?
            </p>
            <p style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 24 }}>
              Prowlit monitors Reddit and X, scores buyer intent, and drafts replies. Takes 2 minutes to set up.
            </p>
            <Link className="btn dark lg" href="/signup">Start here</Link>
          </div>

        </div>
      </article>

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
