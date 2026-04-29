"use client";

import { useRef, useState } from "react";
import type { LeadReplyDTO, ReplyLength } from "@/db/schemas/domain";
import { useLeadReplyFromForm } from "@/modules/leads/actions";
import { updateProjectFromForm } from "@/modules/projects/settings-actions";
import { CopyButton } from "./copy-button";

const STYLE_LABELS: Record<string, string> = {
  engaging: "Engaging",
  direct: "Direct",
  balanced: "Balanced",
};

const LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

export function ReplyEditor({
  replies,
  permalink,
  projectId,
  leadId,
  returnTo,
  generateForm,
  replyLength: initialReplyLength = "medium",
}: {
  replies: LeadReplyDTO[];
  permalink: string | null;
  projectId: string;
  leadId: string;
  returnTo: string;
  generateForm: React.ReactNode;
  replyLength?: ReplyLength;
}) {
  const [text, setText] = useState(replies[0]?.content ?? "");
  const [activeId, setActiveId] = useState<string | null>(replies[0]?.id ?? null);
  const [replyLength, setReplyLength] = useState<ReplyLength>(initialReplyLength);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const activeReply = replies.find((r) => r.id === activeId) ?? null;
  const activeLabel = activeReply ? (STYLE_LABELS[activeReply.style] ?? activeReply.style) : null;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleLengthChange(newLength: ReplyLength) {
    setReplyLength(newLength);
    if (detailsRef.current) detailsRef.current.open = false;
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("replyLength", newLength);
    await updateProjectFromForm(fd);
  }

  return (
    <div>
      <div className="composer-head">
        <span>Reply draft</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {activeLabel && <span className="composer-tone">tone: {activeLabel}</span>}
          <details ref={detailsRef} style={{ position: "relative" }}>
            <summary
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 10px 2px 10px",
                borderRadius: 20,
                border: "1px solid #DAE0E6",
                background: "#F6F7F8",
                fontSize: 11,
                fontWeight: 700,
                color: "#4B5563",
                cursor: "pointer",
                listStyle: "none",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              {LENGTH_LABELS[replyLength]}
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 50,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                minWidth: 140,
                overflow: "hidden",
              }}
            >
              {(["short", "medium", "long"] as const).map((opt) => {
                const descriptions: Record<ReplyLength, string> = {
                  short: "1-2 sentences",
                  medium: "3-5 sentences",
                  long: "Full reply",
                };
                const active = replyLength === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleLengthChange(opt)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      padding: "8px 14px",
                      textAlign: "left",
                      background: active ? "#FFF3EC" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #F5F5F5",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#FF4500" : "#1A1A1B" }}>
                      {LENGTH_LABELS[opt]}
                    </span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>
                      {descriptions[opt]}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="composer-toolbar">
          {replies.map((reply) => {
            const isActive = activeId === reply.id;
            return (
              <button
                key={reply.id}
                type="button"
                onClick={() => { setText(reply.content); setActiveId(reply.id); }}
                className={`composer-tb${isActive ? " composer-tb-active" : ""}`}
              >
                {STYLE_LABELS[reply.style] ?? reply.style}
                {reply.was_used && <span className="composer-tb-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply with a genuine and informative response subtly mentioning your product..."
        rows={5}
        className={`composer-txa${replies.length > 0 ? " composer-txa-attached" : ""}`}
      />

      <div className="composer-foot">
        <span className="composer-foot-meta">
          {text.length} chars · {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <div className="composer-foot-right">
          {generateForm}
          {activeReply && !activeReply.was_used && (
            <form action={useLeadReplyFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="replyId" value={activeReply.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button className="composer-btn" type="submit">
                Mark as Used
              </button>
            </form>
          )}
          <CopyButton text={text || " "} permalink={permalink} />
        </div>
      </div>
    </div>
  );
}
