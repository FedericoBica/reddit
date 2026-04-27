"use client";

import { useActionState, useMemo, useState } from "react";
import { CopyButton } from "@/app/components/copy-button";
import type { MentionReplyState } from "@/modules/mentions/actions";
import { generateMentionRepliesAction } from "@/modules/mentions/actions";

const initialState: MentionReplyState = {
  error: null,
  replies: [],
  usageLabel: null,
};

const STYLE_LABELS = ["Engaging", "Direct", "Balanced"];

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
  const replies = state.replies;

  const activeReply = useMemo(
    () => replies[activeIndex] ?? replies[0] ?? "",
    [activeIndex, replies],
  );

  return (
    <div>
      <div className="composer-head">
        <span>Reply draft</span>
        {state.usageLabel && <span className="composer-tone">{state.usageLabel}</span>}
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
