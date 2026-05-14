"use client";

import { useActionState, useState } from "react";
import { useLocale } from "next-intl";
import { generatePostAction, saveDraftAction, postNowAction } from "@/modules/x/post-actions";
const CHAR_LIMIT = 280;

export function AIWriterTab({ projectId, hasProfile }: { projectId: string; hasProfile: boolean }) {
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        generationFailed: "Falló la generación. Probá de nuevo.",
        setupTitle: "Primero configurá tu contexto de X",
        setupBody: "AI Writer usa tus intereses, tu voz y tus reglas del perfil de contexto de X para escribir posts que suenen como vos.",
        setupCta: "Configurar mi contexto →",
        topic: "Tema / sobre qué publicar",
        topicPlaceholder: "ej: lanzamos un nuevo onboarding y bajamos churn 20%",
        angle: "Ángulo (opcional)",
        anglePlaceholder: "ej: postura contraria, insight con datos, historia personal",
        generating: "Generando...",
        generate: "Generar post",
        contentPlaceholder: "Contenido de tu post...",
        regenerate: "Regenerar",
        hook: "Hook:",
        saving: "Guardando...",
        saveToQueue: "Guardar en cola",
        savedToQueue: "Guardado en cola.",
        posting: "Publicando...",
        postNow: "Publicar ahora",
        postedToX: "Publicado en X.",
        empty: "Ingresá un tema arriba y hacé clic en Generar post.",
      }
    : locale.startsWith("pt")
    ? {
        generationFailed: "Falha ao gerar. Tente novamente.",
        setupTitle: "Configure primeiro seu contexto do X",
        setupBody: "O AI Writer usa seus interesses, sua voz e suas regras do perfil de contexto do X para escrever posts com a sua cara.",
        setupCta: "Configurar meu contexto →",
        topic: "Tópico / sobre o que postar",
        topicPlaceholder: "ex: lançamos um novo onboarding e reduzimos churn em 20%",
        angle: "Ângulo (opcional)",
        anglePlaceholder: "ex: visão contrária, insight orientado por dados, história pessoal",
        generating: "Gerando...",
        generate: "Gerar post",
        contentPlaceholder: "Conteúdo do seu post...",
        regenerate: "Gerar novamente",
        hook: "Gancho:",
        saving: "Salvando...",
        saveToQueue: "Salvar na fila",
        savedToQueue: "Salvo na fila.",
        posting: "Publicando...",
        postNow: "Publicar agora",
        postedToX: "Publicado no X.",
        empty: "Digite um tópico acima e clique em Gerar post.",
      }
    : {
        generationFailed: "Generation failed. Try again.",
        setupTitle: "Set up your X Context first",
        setupBody: "The AI Writer uses your interests, voice, and rules from your X Context profile to write posts that sound like you.",
        setupCta: "Set up My Context →",
        topic: "Topic / What to post about",
        topicPlaceholder: "e.g. Just shipped a new onboarding flow, reduced churn by 20%",
        angle: "Angle (optional)",
        anglePlaceholder: "e.g. Contrarian take, data-driven insight, personal story",
        generating: "Generating...",
        generate: "Generate post",
        contentPlaceholder: "Your post content...",
        regenerate: "Regenerate",
        hook: "Hook:",
        saving: "Saving...",
        saveToQueue: "Save to Queue",
        savedToQueue: "Saved to queue.",
        posting: "Posting...",
        postNow: "Post Now",
        postedToX: "Posted to X.",
        empty: "Enter a topic above and click Generate post.",
      };
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
      setGenerateError(copy.generationFailed);
    } finally {
      setGenerating(false);
    }
  }

  if (!hasProfile) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>✍️</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>{copy.setupTitle}</p>
        <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 420, margin: "0 auto 20px" }}>
          {copy.setupBody}
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
          {copy.setupCta}
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
              {copy.topic}
            </label>
            <input
              className="settings-input"
              name="topic"
              placeholder={copy.topicPlaceholder}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {copy.angle}
            </label>
            <input
              className="settings-input"
              name="angle"
              placeholder={copy.anglePlaceholder}
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
              {generating ? copy.generating : copy.generate}
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
              placeholder={copy.contentPlaceholder}
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
                {copy.regenerate}
              </button>
            </div>
          </div>

          {generated.hookExplanation && (
            <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 8, padding: "0 2px" }}>
              <strong style={{ color: "#1A1A1B" }}>{copy.hook}</strong> {generated.hookExplanation}
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
                {savePending ? copy.saving : copy.saveToQueue}
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
                {postPending ? copy.posting : copy.postNow}
              </button>
            </form>
          </div>

          {saveResult && !saveResult.ok && (
            <p style={{ fontSize: 13, color: "#D93025", marginTop: 8 }}>{saveResult.error}</p>
          )}
          {saveResult?.ok && (
            <p style={{ fontSize: 13, color: "#2D6A3F", marginTop: 8 }}>{copy.savedToQueue}</p>
          )}
          {postResult && !postResult.ok && (
            <p style={{ fontSize: 13, color: "#D93025", marginTop: 8 }}>{postResult.error}</p>
          )}
          {postResult?.ok && (
            <p style={{ fontSize: 13, color: "#2D6A3F", marginTop: 8 }}>{copy.postedToX}</p>
          )}
        </div>
      )}

      {!generated && !generating && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "#7C7C83" }}>
          <p style={{ fontSize: 14 }}>{copy.empty}</p>
        </div>
      )}
    </div>
  );
}
