"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
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
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        statuses: { draft: "Borrador", scheduled: "Programado", publishing: "Publicando", published: "Publicado", failed: "Falló" },
        sources: { ai_writer: "AI Writer", inspiration: "Inspiración", manual: "Manual" },
        chars: "caracteres",
        scheduled: "Programado:",
        published: "Publicado:",
        viewOnX: "Ver en X →",
        schedule: "Programar",
        postNow: "Publicar ahora",
        posting: "Publicando...",
        delete: "Eliminar",
        posted: "Publicado.",
      }
    : locale.startsWith("pt")
    ? {
        statuses: { draft: "Rascunho", scheduled: "Agendado", publishing: "Publicando", published: "Publicado", failed: "Falhou" },
        sources: { ai_writer: "AI Writer", inspiration: "Inspiração", manual: "Manual" },
        chars: "caracteres",
        scheduled: "Agendado:",
        published: "Publicado:",
        viewOnX: "Ver no X →",
        schedule: "Agendar",
        postNow: "Publicar agora",
        posting: "Publicando...",
        delete: "Excluir",
        posted: "Publicado.",
      }
    : {
        statuses: { draft: "Draft", scheduled: "Scheduled", publishing: "Publishing", published: "Published", failed: "Failed" },
        sources: { ai_writer: "AI Writer", inspiration: "Inspiration", manual: "Manual" },
        chars: "chars",
        scheduled: "Scheduled:",
        published: "Published:",
        viewOnX: "View on X →",
        schedule: "Schedule",
        postNow: "Post now",
        posting: "Posting...",
        delete: "Delete",
        posted: "Posted.",
      };
  const [scheduleResult, scheduleDispatch, schedulePending] = useActionState(schedulePostAction, undefined);
  const [postResult, postNowDispatch, postPending] = useActionState(postNowAction, undefined);
  const [, deleteDispatch, deletePending] = useActionState(deletePostAction, undefined);

  const st = STATUS_LABELS[post.status] ?? { label: post.status, color: "#6B7280", bg: "#F3F4F6" };
  const localizedStatus = copy.statuses[post.status as keyof typeof copy.statuses] ?? st.label;
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
          {localizedStatus}
        </span>
        <span style={{ fontSize: 11, color: "#7C7C83", marginLeft: "auto" }}>
          {copy.sources[post.source as keyof typeof copy.sources] ?? SOURCE_LABELS[post.source] ?? post.source}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "#1A1A1B", lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 12 }}>
        {post.content}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#7C7C83", marginBottom: 14 }}>
        <span>{post.content.length} {copy.chars}</span>
        {post.scheduled_for && (
          <span>{copy.scheduled} {formatDateTime(post.scheduled_for)}</span>
        )}
        {post.published_at && (
          <span>{copy.published} {formatDateTime(post.published_at)}</span>
        )}
        {post.x_tweet_id && (
          <a
            href={`https://x.com/i/web/status/${post.x_tweet_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1D4ED8", textDecoration: "none" }}
          >
            {copy.viewOnX}
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
              {schedulePending ? "..." : copy.schedule}
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
              {postPending ? copy.posting : copy.postNow}
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
              {deletePending ? "..." : copy.delete}
            </button>
          </form>
        )}
        {postResult && !postResult.ok && (
          <span style={{ fontSize: 12, color: "#D93025", alignSelf: "center" }}>{postResult.error}</span>
        )}
        {postResult?.ok && (
          <span style={{ fontSize: 12, color: "#2D6A3F", alignSelf: "center" }}>{copy.posted}</span>
        )}
      </div>
    </div>
  );
}

export function QueueList({ posts, projectId }: { posts: XScheduledPostDTO[]; projectId: string }) {
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        empty: "La cola está vacía",
        body: "Creá un post desde Content Studio y guardalo en la cola o programalo para un horario específico.",
        open: "Abrir Content Studio →",
      }
    : locale.startsWith("pt")
    ? {
        empty: "A fila está vazia",
        body: "Crie um post no Content Studio e salve na fila ou agende para um horário específico.",
        open: "Abrir Content Studio →",
      }
    : {
        empty: "Queue is empty",
        body: "Create a post from Content Studio and save it to queue or schedule it for a specific time.",
        open: "Open Content Studio →",
      };
  if (posts.length === 0) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>📅</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>{copy.empty}</p>
        <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 400, margin: "0 auto 20px" }}>
          {copy.body}
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
          {copy.open}
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
