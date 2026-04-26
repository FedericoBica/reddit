"use client";

import { useState } from "react";
import type { LeadReplyDTO } from "@/db/schemas/domain";
import { useLeadReplyFromForm } from "@/modules/leads/actions";
import { CopyButton } from "./copy-button";

const STYLE_LABELS: Record<string, string> = {
  engaging: "Engaging",
  direct: "Direct",
  balanced: "Balanced",
};

export function ReplyEditor({
  replies,
  permalink,
  projectId,
  leadId,
  returnTo,
  generateForm,
}: {
  replies: LeadReplyDTO[];
  permalink: string | null;
  projectId: string;
  leadId: string;
  returnTo: string;
  generateForm: React.ReactNode;
}) {
  const [text, setText] = useState(replies[0]?.content ?? "");
  const [activeId, setActiveId] = useState<string | null>(replies[0]?.id ?? null);

  const activeReply = replies.find((r) => r.id === activeId) ?? null;
  const activeLabel = activeReply ? (STYLE_LABELS[activeReply.style] ?? activeReply.style) : null;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="composer-head">
        <span>Reply draft</span>
        {activeLabel && <span className="composer-tone">tone: {activeLabel}</span>}
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
