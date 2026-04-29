"use client";

import { useActionState, useState } from "react";
import { generatePostAction, saveDraftAction, postNowAction } from "@/modules/x/post-actions";
const CHAR_LIMIT = 280;

export function AIWriterTab({ projectId, hasProfile }: { projectId: string; hasProfile: boolean }) {
  const [generated, setGenerated] = useState<{ content: string; hookExplanation: string } | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [saveResult, saveDraftDispatch, savePending] = useActionState(saveDraftAction, undefined);
  const [postResult, postNowDispatch, postPending] = useActionState(postNowAction, undefined);

  const charCount = editedContent.length;
  const overLimit = charCount > CHAR_LIMIT;

  async function handleGenerate(formData: FormData) {
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generatePostAction(formData);
      if (result.ok) {
        setGenerated({ content: result.content, hookExplanation: result.hookExplanation });
        setEditedContent(result.content);
      } else {
        setGenerateError(result.error);
      }
    } catch {
      setGenerateError("Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (!hasProfile) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>✍️</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Set up your X Context first</p>
        <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 420, margin: "0 auto 20px" }}>
          The AI Writer uses your interests, voice, and rules from your X Context profile to write posts that sound like you.
        </p>
        <a
          href="/x/context"
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
          Set up My Context →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* ── Generate form ── */}
      <form action={handleGenerate} style={{ marginBottom: 28 }}>
        <input type="hidden" name="projectId" value={projectId} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Topic / What to post about
            </label>
            <input
              className="settings-input"
              name="topic"
              placeholder="e.g. Just shipped a new onboarding flow, reduced churn by 20%"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Angle (optional)
            </label>
            <input
              className="settings-input"
              name="angle"
              placeholder="e.g. Contrarian take, data-driven insight, personal story"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={generating}
              className="settings-btn-primary"
              style={{ padding: "9px 22px", fontSize: 14 }}
            >
              {generating ? "Generating..." : "Generate post"}
            </button>
          </div>
        </div>
        {generateError && (
          <p style={{ fontSize: 13, color: "#D93025", marginTop: 10 }}>{generateError}</p>
        )}
      </form>

      {/* ── Editor ── */}
      {generated && (
        <div>
          <div style={{ border: "1px solid #E5E5E5", borderRadius: 10, overflow: "hidden" }}>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                lineHeight: 1.55,
                border: "none",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                color: "#1A1A1B",
                background: "#fff",
                boxSizing: "border-box",
              }}
              placeholder="Your post content..."
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <span style={{ fontSize: 12, color: overLimit ? "#D93025" : "#7C7C83", fontWeight: overLimit ? 700 : 400 }}>
                {charCount} / {CHAR_LIMIT}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const fd = new FormData();
                  fd.set("projectId", projectId);
                  fd.set("topic", "");
                  await handleGenerate(fd);
                }}
                disabled={generating}
                style={{ fontSize: 12, color: "#7C7C83", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Regenerate
              </button>
            </div>
          </div>

          {generated.hookExplanation && (
            <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 8, padding: "0 2px" }}>
              <strong style={{ color: "#1A1A1B" }}>Hook:</strong> {generated.hookExplanation}
            </p>
          )}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <form action={saveDraftDispatch}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="content" value={editedContent} />
              <input type="hidden" name="source" value="ai_writer" />
              <button
                type="submit"
                disabled={savePending || overLimit || !editedContent.trim()}
                className="settings-btn-secondary"
                style={{ padding: "9px 18px", fontSize: 13 }}
              >
                {savePending ? "Saving..." : "Save to Queue"}
              </button>
            </form>

            <form action={postNowDispatch}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="content" value={editedContent} />
              <input type="hidden" name="source" value="ai_writer" />
              <button
                type="submit"
                disabled={postPending || overLimit || !editedContent.trim()}
                className="settings-btn-primary"
                style={{ padding: "9px 18px", fontSize: 13 }}
              >
                {postPending ? "Posting..." : "Post Now"}
              </button>
            </form>
          </div>

          {saveResult && !saveResult.ok && (
            <p style={{ fontSize: 13, color: "#D93025", marginTop: 8 }}>{saveResult.error}</p>
          )}
          {saveResult?.ok && (
            <p style={{ fontSize: 13, color: "#2D6A3F", marginTop: 8 }}>Saved to queue.</p>
          )}
          {postResult && !postResult.ok && (
            <p style={{ fontSize: 13, color: "#D93025", marginTop: 8 }}>{postResult.error}</p>
          )}
          {postResult?.ok && (
            <p style={{ fontSize: 13, color: "#2D6A3F", marginTop: 8 }}>Posted to X.</p>
          )}
        </div>
      )}

      {!generated && !generating && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "#7C7C83" }}>
          <p style={{ fontSize: 14 }}>Enter a topic above and click Generate post.</p>
        </div>
      )}
    </div>
  );
}
