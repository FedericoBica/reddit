import Link from "next/link";
import type { XPostDTO } from "@/db/schemas/domain";
import { updateXPostStatusFromForm } from "@/modules/x/actions";
import { formatRelative, formatDate } from "../feed-utils";

export function XPostCard({ post, active, href, copy }: { post: XPostDTO; active: boolean; href: string; copy: Record<string, string> }) {
  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
    >
      <div className="opportunity-meta">
        <span className="opportunity-dot" style={{ background: "#000" }} />
        {post.author_username && <span>@{post.author_username}</span>}
        {post.posted_at && <span>{formatRelative(post.posted_at, copy)}</span>}
        {post.like_count != null && <span>♥ {post.like_count}</span>}
      </div>
      <h2 className="opportunity-heading" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
        {post.text.length > 160 ? `${post.text.slice(0, 160)}…` : post.text}
      </h2>
      {post.classification_reason && (
        <p style={{ fontSize: 11, color: "#46A758", fontWeight: 500, lineHeight: 1.4, marginTop: 4 }}>
          {post.classification_reason.slice(0, 100)}
        </p>
      )}
      {post.intent_score != null && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#46A758" }}>
            Score: {post.intent_score}
          </span>
        </div>
      )}
    </Link>
  );
}

export function XPostDetail({ post, projectId, copy }: { post: XPostDTO; projectId: string; copy: Record<string, string> }) {
  return (
    <section className="detail-pane" aria-label="X post detail">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" style={{ background: "#000" }} />
          {post.author_name && <span>{post.author_name}</span>}
          {post.author_username && <span>@{post.author_username}</span>}
          {post.posted_at && <span>{formatDate(post.posted_at, copy)}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none",
                padding: "5px 14px", borderRadius: 20, border: "1px solid #000",
              }}
            >
              {copy.viewX}
            </a>
          )}
          <form action={updateXPostStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={`/feed?type=x&projectId=${projectId}`} />
            <button className="btn-replied" type="submit">{copy.statusReplied}</button>
          </form>
        </div>
      </div>

      <div className="detail-content">
        <p style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 400, color: "#1A1A1B", whiteSpace: "pre-wrap" }}>
          {post.text}
        </p>

        {post.keywords_matched && post.keywords_matched.length > 0 && (
          <p style={{ fontSize: 11, color: "#7C7C83", fontWeight: 600, marginTop: 16 }}>
            {copy.keywords}: {post.keywords_matched.join(", ")}
          </p>
        )}
      </div>

      <article className="lead-post">
        <div className="post-stats-bar">
          {post.like_count != null && <span>♥ {post.like_count} {copy.likes}</span>}
          {post.retweet_count != null && <span>↺ {post.retweet_count} {copy.retweets}</span>}
          {post.reply_count != null && <span>💬 {post.reply_count} {copy.replies}</span>}
          {post.impression_count != null && <span>👁 {post.impression_count} {copy.views}</span>}
        </div>

        {post.classification_reason && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F6F7F8", borderRadius: 8, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83", marginBottom: 4 }}>{copy.aiAnalysis}</p>
            <p style={{ fontSize: 13, color: "#1A1A1B", lineHeight: 1.5 }}>{post.classification_reason}</p>
            {post.intent_score != null && (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#46A758", marginTop: 6 }}>
                {copy.intentScore}: {post.intent_score}/100
              </p>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
