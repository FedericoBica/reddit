"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { CopyButton } from "@/app/components/copy-button";
import type { MentionReplyState } from "@/modules/mentions/actions";
import { generateMentionRepliesAction } from "@/modules/mentions/actions";

const initialState: MentionReplyState = {
  error: null,
  replies: [],
  usageLabel: null,
};

const STYLE_LABELS = ["Engaging", "Direct", "Balanced"];

type ReplyLength = "short" | "medium" | "long";
const LENGTH_LABELS: Record<ReplyLength, string> = { short: "Short", medium: "Medium", long: "Long" };
const LENGTH_DESCRIPTIONS: Record<ReplyLength, string> = {
  short: "1–2 sentences",
  medium: "3–5 sentences",
  long: "6–10 sentences",
};

export function MentionReplyGenerator({
  projectId,
  mentionId,
  permalink,
}: {
  projectId: string;
  mentionId: string;
  permalink: string;
}) {
  const [state, formAction, pending] = useActionState(generateMentionRepliesAction, initialState);
  const [activeIndex, setActiveIndex] = useState(0);
  const [replyLength, setReplyLength] = useState<ReplyLength>("medium");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const replies = state.replies;

  const activeReply = useMemo(
    () => replies[activeIndex] ?? replies[0] ?? "",
    [activeIndex, replies],
  );

  return (
    <div>
      <div className="composer-head">
        <span>Reply draft</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {state.usageLabel && <span className="composer-tone">{state.usageLabel}</span>}
          <details ref={detailsRef} style={{ position: "relative" }}>
            <summary
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 10px", borderRadius: 20, border: "1px solid #DAE0E6",
                background: "#F6F7F8", fontSize: 11, fontWeight: 700, color: "#4B5563",
                cursor: "pointer", listStyle: "none", userSelect: "none", whiteSpace: "nowrap",
              }}
            >
              {LENGTH_LABELS[replyLength]}
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div
              style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 140, overflow: "hidden",
              }}
            >
              {(["short", "medium", "long"] as const).map((opt) => {
                const active = replyLength === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setReplyLength(opt); if (detailsRef.current) detailsRef.current.open = false; }}
                    style={{
                      display: "flex", flexDirection: "column", width: "100%",
                      padding: "8px 14px", textAlign: "left",
                      background: active ? "#FFF3EC" : "transparent",
                      border: "none", borderBottom: "1px solid #F5F5F5", cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#FF4500" : "#1A1A1B" }}>
                      {LENGTH_LABELS[opt]}
                    </span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>
                      {LENGTH_DESCRIPTIONS[opt]}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      {state.error && (
        <div style={{ padding: "10px 12px", borderRadius: 4, background: "#FBE2E5", border: "1px solid #F2B7BD", color: "#EA0027", fontSize: 12, marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      {replies.length > 0 && (
        <div className="composer-toolbar">
          {replies.map((reply, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={`${mentionId}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`composer-tb${isActive ? " composer-tb-active" : ""}`}
              >
                {STYLE_LABELS[index] ?? `Variant ${index + 1}`}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        value={activeReply}
        readOnly
        placeholder={pending ? "Generating replies…" : "Generate reply suggestions for this mention."}
        rows={6}
        className={`composer-txa${replies.length > 0 ? " composer-txa-attached" : ""}`}
      />

      <div className="composer-foot">
        <span className="composer-foot-meta">
          {activeReply.length} chars
        </span>
        <div className="composer-foot-right">
          <form action={formAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="mentionId" value={mentionId} />
            <input type="hidden" name="replyLength" value={replyLength} />
            <button
              type="submit"
              className={`composer-btn${replies.length === 0 ? " composer-btn-accent" : ""}`}
              disabled={pending}
            >
              {pending ? "Generating…" : replies.length > 0 ? "⥁ Regenerate" : "✦ Generate Reply Suggestions"}
            </button>
          </form>
          <CopyButton text={activeReply || " "} permalink={permalink} />
        </div>
      </div>
    </div>
  );
}
