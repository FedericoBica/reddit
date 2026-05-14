"use client";

import { useActionState, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import {
  generateInspirationAction,
  dismissInspirationAction,
} from "@/modules/x/inspiration-actions";
import { postNowAction, saveDraftAction } from "@/modules/x/post-actions";
import type { XScheduledPostDTO } from "@/db/schemas/domain";

const CHAR_LIMIT = 280;

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  insight:   { color: "#1D4ED8", bg: "#EFF6FF" },
  story:     { color: "#065F46", bg: "#D1FAE5" },
  question:  { color: "#7C3AED", bg: "#EDE9FE" },
  "hot-take":{ color: "#B45309", bg: "#FEF3C7" },
  product:   { color: "#BE185D", bg: "#FCE7F3" },
};

const CATEGORY_LABELS: Record<string, string> = {
  insight: "Insight",
  story: "Story",
  question: "Question",
  "hot-take": "Hot Take",
  product: "Product",
};

function InspirationCard({
  post,
  projectId,
}: {
  post: XScheduledPostDTO;
  projectId: string;
}) {
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        dismiss: "Descartar",
        hook: "Hook:",
        saving: "Guardando...",
        saved: "Guardado ✓",
        saveToQueue: "Guardar en cola",
        posting: "Publicando...",
        postNow: "Publicar ahora",
        postLabel: "Post",
      }
    : locale.startsWith("pt")
    ? {
        dismiss: "Dispensar",
        hook: "Gancho:",
        saving: "Salvando...",
        saved: "Salvo ✓",
        saveToQueue: "Salvar na fila",
        posting: "Publicando...",
        postNow: "Publicar agora",
        postLabel: "Post",
      }
    : {
        dismiss: "Dismiss",
        hook: "Hook:",
        saving: "Saving...",
        saved: "Saved ✓",
        saveToQueue: "Save to Queue",
        posting: "Posting...",
        postNow: "Post Now",
        postLabel: "Post",
      };
  const [content, setContent] = useState(post.content);
  const [isDirty, setIsDirty] = useState(false);
  const [postResult, postDispatch, postPending] = useActionState(postNowAction, undefined);
  const [saveResult, saveDispatch, savePending] = useActionState(saveDraftAction, undefined);
  const [, dismissDispatch, dismissPending] = useActionState(dismissInspirationAction, undefined);

  const charCount = content.length;
  const overLimit = charCount > CHAR_LIMIT;
  const colors = CATEGORY_COLORS[post.category ?? ""] ?? { color: "#6B7280", bg: "#F3F4F6" };
  const categoryLabel = CATEGORY_LABELS[post.category ?? ""] ?? post.category ?? copy.postLabel;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setIsDirty(e.target.value !== post.content);
  }

  const isPosted = postResult?.ok;
  const isSaved = saveResult?.ok;

  if (isPosted || dismissPending) return null;

  return (
    <div
      style={{
        border: "1px solid #E5E5E5",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 18,
        background: "#fff",
        transition: "opacity 0.2s",
        opacity: dismissPending ? 0 : 1,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid #F5F5F5",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            color: colors.color,
            background: colors.bg,
            letterSpacing: "0.02em",
          }}
        >
          {categoryLabel}
        </span>
        <form action={dismissDispatch}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            disabled={dismissPending}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#BBBBBB",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 2px",
            }}
            title={copy.dismiss}
          >
            ×
          </button>
        </form>
      </div>

      {/* ── Editable content ── */}
      <div style={{ position: "relative" }}>
        <textarea
          value={content}
          onChange={handleChange}
          rows={5}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 15,
            lineHeight: 1.6,
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            color: "#1A1A1B",
            background: "transparent",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── Hook explanation ── */}
      {post.hook_explanation && (
        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            padding: "0 16px 10px",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#6B7280" }}>{copy.hook}</strong> {post.hook_explanation}
        </p>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderTop: "1px solid #F5F5F5",
          background: "#FAFAFA",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {/* Char count */}
        <span
          style={{
            fontSize: 12,
            color: overLimit ? "#D93025" : "#9CA3AF",
            fontWeight: overLimit ? 700 : 400,
          }}
        >
          {charCount} / {CHAR_LIMIT}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Save to Queue */}
          <form action={saveDispatch}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="content" value={content} />
            <input type="hidden" name="source" value="inspiration" />
            <button
              type="submit"
              disabled={savePending || overLimit || !content.trim()}
              className="settings-btn-secondary"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              {savePending ? copy.saving : isSaved ? copy.saved : copy.saveToQueue}
            </button>
          </form>

          {/* Post Now */}
          <form action={postDispatch}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="content" value={content} />
            <input type="hidden" name="source" value="inspiration" />
            <button
              type="submit"
              disabled={postPending || overLimit || !content.trim()}
              className="settings-btn-primary"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              {postPending ? copy.posting : copy.postNow}
            </button>
          </form>
        </div>
      </div>

      {/* ── Inline errors ── */}
      {(postResult?.ok === false || saveResult?.ok === false) && (
        <p
          style={{
            fontSize: 12,
            color: "#D93025",
            padding: "6px 16px 10px",
          }}
        >
          {postResult?.ok === false ? postResult.error : saveResult?.ok === false ? saveResult.error : null}
        </p>
      )}
    </div>
  );
}

export function InspirationCards({
  suggestions,
  projectId,
}: {
  suggestions: XScheduledPostDTO[];
  projectId: string;
}) {
  return (
    <div>
      {suggestions.map((s) => (
        <InspirationCard key={s.id} post={s} projectId={projectId} />
      ))}
    </div>
  );
}

export function GenerateButton({
  projectId,
  label,
  action,
  primary,
}: {
  projectId: string;
  label: string;
  action: typeof generateInspirationAction;
  primary?: boolean;
}) {
  const [result, dispatch, pending] = useActionState(action, undefined);

  return (
    <form action={dispatch}>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className={primary ? "settings-btn-primary" : "settings-btn-secondary"}
        style={{ padding: "9px 20px", fontSize: 13 }}
      >
        {pending ? "Generating..." : label}
      </button>
      {result?.ok === false && (
        <p style={{ fontSize: 12, color: "#D93025", marginTop: 6 }}>{result.error}</p>
      )}
    </form>
  );
}
