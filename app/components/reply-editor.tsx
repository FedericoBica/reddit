"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      {replies.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#AEAEB2", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Suggestions
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {replies.map((reply) => {
              const isActive = activeId === reply.id;
              return (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => { setText(reply.content); setActiveId(reply.id); }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${isActive ? "#E07000" : "#E5E5EA"}`,
                    background: isActive ? "#FFF3E8" : "#FAFAF8",
                    color: isActive ? "#E07000" : "#6B6B6E",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {STYLE_LABELS[reply.style] ?? reply.style}
                  {reply.was_used && (
                    <span style={{ color: "#16A34A", fontSize: 10, fontWeight: 900 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply with a genuine and informative response subtly mentioning your product..."
        rows={5}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid #EBEBEA",
          borderRadius: 10,
          fontSize: 13,
          lineHeight: 1.6,
          color: "#1C1C1E",
          background: "#FAFAF8",
          resize: "vertical",
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 160ms ease, box-shadow 160ms ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#D8D8D5";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#EBEBEA";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {generateForm}
          {activeReply && !activeReply.was_used && (
            <form action={useLeadReplyFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="replyId" value={activeReply.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
                Marcar como usada
              </Button>
            </form>
          )}
        </div>
        <CopyButton text={text || " "} permalink={permalink} />
      </div>
    </div>
  );
}
