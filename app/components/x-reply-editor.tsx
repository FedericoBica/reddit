"use client";

import { useState } from "react";
import type { XPostDTO, XPostReplyDTO } from "@/db/schemas/domain";
import { updateXPostStatusFromForm } from "@/modules/x/actions";

const STYLE_LABELS: Record<string, string> = {
  hook: "Hook",
  reply: "Reply",
  mention: "Mention",
};

export function XReplyEditor({
  replies,
  projectId,
  xPostId,
  postStatus,
  generateForm,
}: {
  replies: XPostReplyDTO[];
  projectId: string;
  xPostId: string;
  postStatus: XPostDTO["status"];
  generateForm: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(replies[0]?.id ?? null);
  const activeReply = replies.find((r) => r.id === activeId) ?? replies[0] ?? null;
  const charCount = activeReply?.content.length ?? 0;
  const overLimit = charCount > 280;

  return (
    <div>
      <div className="composer-head">
        <span>Reply draft</span>
        {activeReply && (
          <span className="composer-tone">
            style: {STYLE_LABELS[activeReply.style] ?? activeReply.style}
          </span>
        )}
      </div>

      {replies.length > 0 && (
        <div className="composer-toolbar">
          {replies.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`composer-tb${activeId === r.id ? " composer-tb-active" : ""}`}
            >
              {STYLE_LABELS[r.style] ?? r.style}
              {r.was_used && <span className="composer-tb-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      {activeReply && (
        <>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              padding: "10px 12px",
              background: "#F6F7F8",
              borderRadius: 6,
              border: "1px solid #DAE0E6",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              marginTop: 8,
            }}
          >
            {activeReply.content}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: overLimit ? "#EA0027" : "#8E8E93" }}>
              {charCount} / 280{overLimit && " — over limit"}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(activeReply.content)}
              style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1B", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
            >
              Copy
            </button>
          </div>

          {postStatus !== "replied" && (
            <form action={updateXPostStatusFromForm} style={{ marginTop: 8 }}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="postId" value={xPostId} />
              <input type="hidden" name="status" value="replied" />
              <input type="hidden" name="replyId" value={activeReply.id} />
              <button type="submit" className="btn-replied" style={{ width: "100%" }}>
                ✓ Mark as Replied
              </button>
            </form>
          )}
        </>
      )}

      <div style={{ marginTop: 12 }}>{generateForm}</div>
    </div>
  );
}
