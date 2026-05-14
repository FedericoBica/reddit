"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { updateProjectFromForm } from "@/modules/projects/settings-actions";

type ReplyLength = "short" | "medium" | "long";

const COPY = {
  en: {
    title: "Prompts",
    description: "Shape the tone and behavior of the AI reply generator for this project.",
    replyLength: "Reply length",
    replyLengthLabels: {
      short: "Short — 1-2 sentences",
      medium: "Medium — 3-5 sentences",
      long: "Long — full reply",
    } satisfies Record<ReplyLength, string>,
    toneLabel: "Reply generator tone",
    tonePlaceholder:
      "Example: concise, founder-led, helpful but not salesy. Avoid hype. Mention product only when it naturally solves the user's problem.",
    save: "Save prompt settings",
    personasTitle: "Example personas",
    personasDescription:
      "Here are some example personas to inspire your own. Click one to load it into the tone field above, then customize and save.",
    applied: "APPLIED",
    personas: [
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
    ],
  },
  es: {
    title: "Prompts",
    description: "Definí el tono y el comportamiento del generador de respuestas con IA para este proyecto.",
    replyLength: "Largo de la respuesta",
    replyLengthLabels: {
      short: "Corta — 1-2 oraciones",
      medium: "Media — 3-5 oraciones",
      long: "Larga — respuesta completa",
    } satisfies Record<ReplyLength, string>,
    toneLabel: "Tono del generador de respuestas",
    tonePlaceholder:
      "Ejemplo: conciso, tono founder-led, útil pero no vendedor. Evitar hype. Mencionar el producto solo cuando resuelva naturalmente el problema del usuario.",
    save: "Guardar configuración de prompts",
    personasTitle: "Personas de ejemplo",
    personasDescription:
      "Acá tenés algunas personas de ejemplo para inspirarte. Hacé clic en una para cargarla en el campo de tono de arriba, después personalizala y guardala.",
    applied: "APLICADA",
    personas: [
      {
        name: "Experiencia personal",
        description:
          "Respondé como alguien que atravesó un desafío o situación similar. Compartí una experiencia breve o una historia relacionada con el post y, si aplica, mencioná cómo tu producto ayudó a resolver el problema. Mantené un tono conversacional y auténtico.",
      },
      {
        name: "Transparencia del CEO",
        description:
          "Escribí este comentario como el CEO de la empresa, con total transparencia. Ofrecé consejos o insights realmente útiles relacionados con el post y, si el producto es relevante, mencionarlo abierta y honestamente desde la perspectiva del fundador. Priorizá ser útil y auténtico antes que promocional, y alineate con el tono del autor original.",
      },
      {
        name: "Resolución de problemas",
        description:
          "Analizá el problema o la pregunta específica del post y ofrecé una solución completa. Desglosá la respuesta paso a paso, con consejos prácticos. Enfocate en resolver el problema central con profundidad y claridad, evitando respuestas vagas o genéricas. Si corresponde, incorporá tu producto como una de las soluciones posibles, explicando exactamente cómo y por qué ayuda en ese contexto, sin que suene demasiado promocional. Mantené un tono útil, seguro y orientado a resolver.",
      },
    ],
  },
  pt: {
    title: "Prompts",
    description: "Defina o tom e o comportamento do gerador de respostas com IA para este projeto.",
    replyLength: "Tamanho da resposta",
    replyLengthLabels: {
      short: "Curta — 1-2 frases",
      medium: "Média — 3-5 frases",
      long: "Longa — resposta completa",
    } satisfies Record<ReplyLength, string>,
    toneLabel: "Tom do gerador de respostas",
    tonePlaceholder:
      "Exemplo: conciso, estilo founder-led, útil mas sem soar vendedor. Evite hype. Mencione o produto apenas quando ele resolver naturalmente o problema do usuário.",
    save: "Salvar configuração dos prompts",
    personasTitle: "Personas de exemplo",
    personasDescription:
      "Aqui estão algumas personas de exemplo para inspirar a sua. Clique em uma para carregá-la no campo de tom acima, depois personalize e salve.",
    applied: "APLICADA",
    personas: [
      {
        name: "Experiência pessoal",
        description:
          "Responda como alguém que já enfrentou um desafio ou situação parecida. Compartilhe uma experiência pessoal breve ou uma história relacionada ao post e, se fizer sentido, mencione como seu produto ajudou a resolver o problema. Mantenha um tom conversacional e autêntico.",
      },
      {
        name: "Transparência do CEO",
        description:
          "Escreva este comentário como o CEO da empresa, com total transparência. Ofereça conselhos ou insights realmente úteis relacionados ao post e, se o produto for relevante, mencione-o de forma aberta e honesta a partir da perspectiva do fundador. Priorize ser útil e autêntico em vez de promocional e acompanhe o tom do autor original.",
      },
      {
        name: "Resolvedor de problemas",
        description:
          "Analise o problema ou a pergunta específica do post e ofereça uma solução completa. Estruture a resposta passo a passo com conselhos práticos. Foque em resolver o problema principal com profundidade e clareza, evitando respostas vagas ou genéricas. Se fizer sentido, incorpore seu produto como uma das soluções possíveis, explicando exatamente como e por que ele ajuda nesse contexto, sem soar promocional demais. Mantenha um tom útil, confiante e orientado à solução.",
      },
    ],
  },
} as const;

export function PromptsTab({
  projectId,
  defaultReplyLength,
  defaultTone,
}: {
  projectId: string;
  defaultReplyLength: ReplyLength;
  defaultTone: string;
}) {
  const locale = useLocale();
  const copy = COPY[(locale.startsWith("es") ? "es" : locale.startsWith("pt") ? "pt" : "en") as keyof typeof COPY];
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
            {copy.title}
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
            {copy.description}
          </p>
        </div>

        <form action={updateProjectFromForm}>
          <input type="hidden" name="projectId" value={projectId} />

          {/* Reply length */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7C7C83" }}>{copy.replyLength}</label>
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
                    {copy.replyLengthLabels[opt]}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tone textarea */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7C7C83" }}>
              {copy.toneLabel}
            </label>
            <textarea
              className="settings-input"
              name="tone"
              value={tone}
              onChange={(e) => {
                setTone(e.target.value);
                setActivePersona(null);
              }}
              placeholder={copy.tonePlaceholder}
              rows={8}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="submit" className="settings-btn-primary">
              {copy.save}
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
            {copy.personasTitle}
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
            {copy.personasDescription}
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {copy.personas.map((persona) => {
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
                      {copy.applied}
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
