"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generatePostDraft, type PostDraft } from "@/modules/content-lab/actions";
import type { SubredditCooldown } from "./page";

const STYLES = [
  { value: "tutorial", label: "Tutorial" },
  { value: "case_study", label: "Caso de estudio" },
  { value: "controversial", label: "Opinión controversial" },
];

const COOLDOWN_CONFIG = {
  safe:    { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", label: "Seguro postear" },
  caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Precaución"     },
  wait:    { color: "#DC2626", bg: "#FEF2F2", border: "#FEE2E2", label: "Esperá"         },
};

export function PostDraftGenerator({
  subreddits,
  valueProposition,
  cooldowns = {},
}: {
  subreddits: string[];
  valueProposition: string;
  cooldowns?: Record<string, SubredditCooldown>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<number>(0);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDraft(null);
    setSelectedTitle(0);
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await generatePostDraft(data);
      if (result.success) {
        setDraft(result.draft);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Form */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #F0F0EE",
          borderRadius: 12,
          padding: "22px 24px",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 800, color: "#1C1C1E", marginBottom: 4 }}>
          Generar borrador de post
        </p>
        <p style={{ fontSize: 12, color: "#6B6B6E", marginBottom: 20 }}>
          Elegí subreddit y estilo. La IA genera 3 títulos y un draft completo.
        </p>

        <form ref={formRef} onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <input type="hidden" name="valueProposition" value={valueProposition} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <span className="field-label">Subreddit</span>
              {subreddits.length > 0 ? (
                <select
                  className="select"
                  name="subreddit"
                  required
                  value={selectedSubreddit}
                  onChange={(e) => setSelectedSubreddit(e.target.value)}
                >
                  <option value="">Elegir...</option>
                  {subreddits.map((s) => (
                    <option key={s} value={s}>r/{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="settings-input"
                  name="subreddit"
                  placeholder="ej: startups"
                  required
                  style={{ height: 42, borderRadius: 8 }}
                  onChange={(e) => setSelectedSubreddit(e.target.value)}
                />
              )}
              {selectedSubreddit && cooldowns[selectedSubreddit] && (() => {
                const cd = cooldowns[selectedSubreddit];
                const cfg = COOLDOWN_CONFIG[cd.status];
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4,
                      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#8E8E93" }}>
                      {cd.daysSince === 0 ? "posteaste hoy" : `hace ${cd.daysSince}d`}
                    </span>
                  </div>
                );
              })()}
            </div>

            <label className="field-group">
              <span className="field-label">Estilo</span>
              <select className="select" name="style">
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field-group">
            <span className="field-label">Tema / ángulo (opcional)</span>
            <input
              className="settings-input"
              name="topic"
              placeholder="ej: 'Cómo reducimos churn 40% en 3 meses'"
              style={{ height: 42, borderRadius: 8 }}
            />
            <span className="field-hint">
              Dejalo vacío y la IA elige el ángulo más relevante para el subreddit.
            </span>
          </label>

          <Button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-[8px] font-extrabold"
          >
            {isPending ? "Generando..." : "Generar borrador"}
          </Button>
        </form>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 13px",
              background: "#FEF2F2",
              border: "1px solid #FEE2E2",
              borderRadius: 8,
              fontSize: 13,
              color: "#991B1B",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isPending && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #F0F0EE",
            borderRadius: 12,
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2px solid #FFF3E8",
                borderTopColor: "#E07000",
                animation: "signup-spin 0.75s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6B6B6E" }}>
              La IA está escribiendo tu borrador...
            </span>
          </div>
          {[80, 60, 90, 70, 50].map((w, i) => (
            <div
              key={i}
              style={{
                height: 12,
                borderRadius: 6,
                background: "#F0F0EE",
                width: `${w}%`,
                marginBottom: 10,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Result */}
      {draft && !isPending && (
        <div style={{ display: "grid", gap: 14 }}>
          {/* Title picker */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #F0F0EE",
              borderRadius: 12,
              padding: "20px 22px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#AEAEB2",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 12,
              }}
            >
              3 opciones de título — elegí una
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {draft.titles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedTitle(i)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 13px",
                    borderRadius: 8,
                    border: `1px solid ${selectedTitle === i ? "#E07000" : "#EBEBEA"}`,
                    background: selectedTitle === i ? "#FFFDFB" : "#FFFFFF",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border-color 150ms ease, background 150ms ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: selectedTitle === i ? "#FFFFFF" : "#AEAEB2",
                      background: selectedTitle === i ? "#E07000" : "#F0F0EE",
                      borderRadius: 4,
                      padding: "2px 6px",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    0{i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1C1C1E",
                      lineHeight: 1.45,
                    }}
                  >
                    {title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Draft body */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #F0F0EE",
              borderRadius: 12,
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#AEAEB2",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 3,
                  }}
                >
                  Borrador — r/{draft.subreddit}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
                  {draft.titles[selectedTitle]}
                </p>
              </div>
              <CopyDraftButton
                title={draft.titles[selectedTitle]}
                body={draft.body}
              />
            </div>

            <div
              style={{
                background: "#FAFAF8",
                border: "1px solid #F0F0EE",
                borderRadius: 8,
                padding: "16px 18px",
                maxHeight: 420,
                overflowY: "auto",
              }}
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#333336",
                  margin: 0,
                }}
              >
                {draft.body}
              </pre>
            </div>

            {draft.linkPlacementTip && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 13px",
                  background: "#FFF3E8",
                  border: "1px solid rgba(224,112,0,0.2)",
                  borderRadius: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                  <strong>Link tip:</strong> {draft.linkPlacementTip}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyDraftButton({ title, body }: { title: string; body: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `${title}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        height: 32,
        padding: "0 14px",
        borderRadius: 8,
        border: "1px solid #E5E5EA",
        background: "#FFFFFF",
        fontSize: 12,
        fontWeight: 700,
        color: copied ? "#16A34A" : "#6B6B6E",
        cursor: "pointer",
        flexShrink: 0,
        transition: "color 150ms ease",
      }}
    >
      {copied ? "Copiado ✓" : "Copiar todo"}
    </button>
  );
}
