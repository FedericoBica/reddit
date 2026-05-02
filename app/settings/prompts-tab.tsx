"use client";

import { useState } from "react";
import { updateProjectFromForm } from "@/modules/projects/settings-actions";

type ReplyLength = "short" | "medium" | "long";

const PERSONAS = [
  {
    name: "Personal Experience",
    description:
      "Respond as someone who has faced a similar challenge or situation. Share a brief personal experience or story that relates to the post and, if appropriate, mention how your product helped solve the problem. Keep it conversational and authentic.",
  },
  {
    name: "CEO Transparency",
    description:
      "Write this comment as the CEO of the company, being fully transparent. Offer genuinely helpful advice or insights related to the post, and if the product is relevant, mention it openly and honestly from the perspective of the founder. Prioritize being helpful and authentic over being promotional, and match the tone of the original poster.",
  },
  {
    name: "Problem Solver",
    description:
      "Analyze the specific problem or question in the post and provide a comprehensive solution. Break down the answer step by step, offering practical advice. Focus on solving the core issue with depth and clarity, avoiding vague or generic responses. If relevant, naturally incorporate your product as one of the possible solutions—explaining exactly how and why it helps in that context—without making the response feel overly promotional. Maintain a helpful, confident, and solution-oriented tone aligned with the original post.",
  },
];

const REPLY_LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "Short — 1-2 sentences",
  medium: "Medium — 3-5 sentences",
  long: "Long — full reply",
};

export function PromptsTab({
  projectId,
  defaultReplyLength,
  defaultTone,
}: {
  projectId: string;
  defaultReplyLength: ReplyLength;
  defaultTone: string;
}) {
  const [tone, setTone] = useState(defaultTone);
  const [replyLength, setReplyLength] = useState<ReplyLength>(defaultReplyLength);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  function applyPersona(description: string, name: string) {
    setTone(description);
    setActivePersona(name);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Main form */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #EEEEED",
          borderRadius: 12,
          padding: "22px 24px",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1B", marginBottom: 3 }}>
            Prompts
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
            Shape the tone and behavior of the AI reply generator for this project.
          </p>
        </div>

        <form action={updateProjectFromForm}>
          <input type="hidden" name="projectId" value={projectId} />

          {/* Reply length */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7C7C83" }}>Reply length</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["short", "medium", "long"] as ReplyLength[]).map((opt) => {
                const selected = replyLength === opt;
                return (
                  <label
                    key={opt}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${selected ? "#FF4500" : "#E5E7EB"}`,
                      background: selected ? "#FFF3EC" : "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500,
                      color: selected ? "#E03D00" : "#4B5563",
                      transition: "all 0.1s",
                    }}
                  >
                    <input
                      type="radio"
                      name="replyLength"
                      value={opt}
                      checked={selected}
                      onChange={() => setReplyLength(opt)}
                      style={{ display: "none" }}
                    />
                    {REPLY_LENGTH_LABELS[opt]}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tone textarea */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7C7C83" }}>
              Reply generator tone
            </label>
            <textarea
              className="settings-input"
              name="tone"
              value={tone}
              onChange={(e) => {
                setTone(e.target.value);
                setActivePersona(null);
              }}
              placeholder="Example: concise, founder-led, helpful but not salesy. Avoid hype. Mention product only when it naturally solves the user's problem."
              rows={8}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="submit" className="settings-btn-primary">
              Save prompt settings
            </button>
          </div>
        </form>
      </section>

      {/* Persona inspiration */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #EEEEED",
          borderRadius: 12,
          padding: "22px 24px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1B", marginBottom: 3 }}>
            Example personas
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
            Here are some example personas to inspire your own. Click one to load it into the tone
            field above, then customize and save.
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {PERSONAS.map((persona) => {
            const isActive = activePersona === persona.name;
            return (
              <button
                key={persona.name}
                type="button"
                onClick={() => applyPersona(persona.description, persona.name)}
                style={{
                  textAlign: "left",
                  background: isActive ? "#FFF3EC" : "#FAFAF8",
                  border: `1.5px solid ${isActive ? "#FF4500" : "#EEEEED"}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isActive ? "#E03D00" : "#1A1A1B",
                    }}
                  >
                    {persona.name}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#E03D00",
                        background: "#FFE8D6",
                        borderRadius: 4,
                        padding: "2px 7px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      APPLIED
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.6, margin: 0 }}>
                  {persona.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
