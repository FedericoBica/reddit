"use client";

import { useActionState } from "react";
import type { XScheduledPostDTO } from "@/db/schemas/domain";
import { deletePostAction, postNowAction, schedulePostAction } from "@/modules/x/post-actions";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: "Draft",      color: "#6B7280", bg: "#F3F4F6" },
  scheduled:  { label: "Scheduled",  color: "#1D4ED8", bg: "#EFF6FF" },
  publishing: { label: "Publishing", color: "#92400E", bg: "#FEF3C7" },
  published:  { label: "Published",  color: "#065F46", bg: "#D1FAE5" },
  failed:     { label: "Failed",     color: "#991B1B", bg: "#FEE2E2" },
};

const SOURCE_LABELS: Record<string, string> = {
  ai_writer: "AI Writer",
  inspiration: "Inspiration",
  manual: "Manual",
};

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function PostCard({ post, projectId }: { post: XScheduledPostDTO; projectId: string }) {
  const [scheduleResult, scheduleDispatch, schedulePending] = useActionState(schedulePostAction, undefined);
  const [postResult, postNowDispatch, postPending] = useActionState(postNowAction, undefined);
  const [, deleteDispatch, deletePending] = useActionState(deletePostAction, undefined);

  const st = STATUS_LABELS[post.status] ?? { label: post.status, color: "#6B7280", bg: "#F3F4F6" };
  const canSchedule = post.status === "draft";
  const canPostNow = post.status === "draft" || post.status === "scheduled" || post.status === "failed";
  const canDelete = post.status !== "publishing" && post.status !== "published";

  return (
    <div style={{ border: "1px solid #E5E5E5", borderRadius: 10, padding: "16px 18px", marginBottom: 14, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            color: st.color,
            background: st.bg,
          }}
        >
          {st.label}
        </span>
        <span style={{ fontSize: 11, color: "#7C7C83", marginLeft: "auto" }}>
          {SOURCE_LABELS[post.source] ?? post.source}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "#1A1A1B", lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 12 }}>
        {post.content}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#7C7C83", marginBottom: 14 }}>
        <span>{post.content.length} chars</span>
        {post.scheduled_for && (
          <span>Scheduled: {formatDateTime(post.scheduled_for)}</span>
        )}
        {post.published_at && (
          <span>Published: {formatDateTime(post.published_at)}</span>
        )}
        {post.x_tweet_id && (
          <a
            href={`https://x.com/i/web/status/${post.x_tweet_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1D4ED8", textDecoration: "none" }}
          >
            View on X →
          </a>
        )}
      </div>

      {post.error && (
        <p style={{ fontSize: 12, color: "#D93025", marginBottom: 10 }}>{post.error}</p>
      )}

      {/* ── Schedule picker ── */}
      {canSchedule && (
        <form action={scheduleDispatch} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="content" value={post.content} />
          <input
            type="datetime-local"
            name="scheduledFor"
            className="settings-input"
            style={{ fontSize: 12, padding: "5px 10px", flex: 1 }}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
          <button
            type="submit"
            disabled={schedulePending}
            className="settings-btn-secondary"
            style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
          >
            {schedulePending ? "..." : "Schedule"}
          </button>
          {scheduleResult && !scheduleResult.ok && (
            <span style={{ fontSize: 12, color: "#D93025" }}>{scheduleResult.error}</span>
          )}
        </form>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {canPostNow && (
          <form action={postNowDispatch}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="content" value={post.content} />
            <button
              type="submit"
              disabled={postPending}
              className="settings-btn-primary"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              {postPending ? "Posting..." : "Post now"}
            </button>
          </form>
        )}
        {canDelete && (
          <form action={deleteDispatch}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              disabled={deletePending}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E5E5", background: "none", color: "#7C7C83", cursor: "pointer" }}
            >
              {deletePending ? "..." : "Delete"}
            </button>
          </form>
        )}
        {postResult && !postResult.ok && (
          <span style={{ fontSize: 12, color: "#D93025", alignSelf: "center" }}>{postResult.error}</span>
        )}
        {postResult?.ok && (
          <span style={{ fontSize: 12, color: "#2D6A3F", alignSelf: "center" }}>Posted.</span>
        )}
      </div>
    </div>
  );
}

export function QueueList({ posts, projectId }: { posts: XScheduledPostDTO[]; projectId: string }) {
  if (posts.length === 0) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>📅</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Queue is empty</p>
        <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 400, margin: "0 auto 20px" }}>
          Create a post from Content Studio and save it to queue or schedule it for a specific time.
        </p>
        <a
          href="/x/studio"
          style={{
            display: "inline-block",
            padding: "9px 20px",
            borderRadius: 8,
            background: "#FF4500",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Open Content Studio →
        </a>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} projectId={projectId} />
      ))}
    </div>
  );
}
