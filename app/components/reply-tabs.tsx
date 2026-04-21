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

export function ReplyTabs({
  replies,
  permalink,
  projectId,
  leadId,
  returnTo,
  regenerateForm,
}: {
  replies: LeadReplyDTO[];
  permalink: string | null;
  projectId: string;
  leadId: string;
  returnTo: string;
  regenerateForm: React.ReactNode;
}) {
  const [activeStyle, setActiveStyle] = useState(replies[0]?.style ?? "engaging");
  const active = replies.find((r) => r.style === activeStyle) ?? replies[0];

  if (!active) return null;

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #F0F0EE", marginBottom: 16 }}>
        {replies.map((reply) => {
          const isActive = activeStyle === reply.style;
          return (
            <button
              key={reply.style}
              type="button"
              onClick={() => setActiveStyle(reply.style)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 800,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: isActive ? "#E07000" : "#AEAEB2",
                borderBottom: isActive ? "2px solid #E07000" : "2px solid transparent",
                marginBottom: -1.5,
                letterSpacing: "0.01em",
                transition: "color 120ms ease",
              }}
            >
              {STYLE_LABELS[reply.style] ?? reply.style}
              {reply.was_used && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#D1FAE5",
                  color: "#065F46",
                  fontSize: 9,
                  fontWeight: 900,
                }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active reply body */}
      <p className="reddit-body" style={{ fontSize: 13, lineHeight: 1.65 }}>
        {active.content}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <CopyButton text={active.content} permalink={permalink} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!active.was_used && (
            <form action={useLeadReplyFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="replyId" value={active.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
                Marcar como usada
              </Button>
            </form>
          )}
          {regenerateForm}
        </div>
      </div>
    </div>
  );
}
