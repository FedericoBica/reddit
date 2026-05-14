"use client";

import { useState, useActionState } from "react";
import { useLocale } from "next-intl";
import { saveXContextFromForm } from "@/modules/x/context-actions";
import { disconnectXAccountAction } from "@/modules/x/post-actions";
import type { XProfileDTO, XConnectedAccountDTO } from "@/db/schemas/domain";

const TOPICS = [
  "SaaS", "Startups", "Indie Hacking", "Product Management", "Growth Hacking",
  "Marketing", "Sales", "Developer Tools", "AI / ML", "No-Code",
  "Venture Capital", "Bootstrapping", "B2B", "Content Marketing", "SEO",
  "Email Marketing", "Social Media", "Automation", "Productivity", "Remote Work",
  "Entrepreneurship", "Leadership", "Design", "Data Analytics", "E-commerce",
];

const STRUCTURE_TYPES = [
  { id: "one-liner", label: "One-liner" },
  { id: "paragraph", label: "Paragraph" },
  { id: "question",  label: "Question" },
  { id: "list",      label: "List" },
  { id: "story-arc", label: "Story Arc" },
];

export function XContextForm({
  profile,
  connectedAccount,
  projectId,
}: {
  profile: XProfileDTO | null;
  connectedAccount: XConnectedAccountDTO | null;
  projectId: string;
}) {
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        xAccount: "Cuenta de X",
        xAccountDescription: "Conectá tu cuenta de X para publicar directamente desde Content Studio y Queue.",
        disconnecting: "Desconectando…",
        disconnect: "Desconectar",
        connectAccount: "Conectar cuenta de X",
        interests: "Tus intereses",
        interestsDescription: "Seleccioná los temas más relevantes para tu trabajo. Así la IA enfoca las sugerencias en tu nicho.",
        favoriteCreators: "Creadores favoritos",
        favoriteCreatorsDescription: "Hasta 3 cuentas de X cuyo estilo de escritura te guste. La IA estudia su tono y formato.",
        voiceExamples: "Ejemplos de voz",
        voiceExamplesDescription: "Incluí tus tweets con mejor rendimiento para ayudar a la IA a imitar tu estilo.",
        useOwnTweets: "Usar mis propios tweets como ejemplos de voz",
        useOwnTweetsHint: "Incluye tus tweets con mejor rendimiento para ayudar a igualar tu estilo de escritura.",
        structureTypes: "Tipos de estructura preferidos",
        structureTypesDescription: "Elegí hasta 3 formatos de post para las sugerencias diarias.",
        maxSelected: "Máximo 3 seleccionados.",
        products: "Tus productos",
        productsDescription: "Agregá links a los productos que querés promocionar. Hasta 5.",
        rules: "Reglas de X",
        rulesDescription: "Instrucciones personalizadas incluidas en cada generación de IA. Tono, temas a evitar, CTAs, etc.",
        rulesPlaceholder: "Ejemplo: escribir siempre en primera persona. Nunca usar hashtags. Mencionar el producto solo cuando encaje naturalmente. Mantener las respuestas por debajo de 200 caracteres.",
        saved: "Guardado.",
        saving: "Guardando…",
        save: "Guardar contexto",
      }
    : locale.startsWith("pt")
    ? {
        xAccount: "Conta do X",
        xAccountDescription: "Conecte sua conta do X para publicar diretamente do Content Studio e da fila.",
        disconnecting: "Desconectando…",
        disconnect: "Desconectar",
        connectAccount: "Conectar conta do X",
        interests: "Seus interesses",
        interestsDescription: "Selecione os tópicos mais relevantes para o seu trabalho. Isso foca as sugestões da IA no seu nicho.",
        favoriteCreators: "Criadores favoritos",
        favoriteCreatorsDescription: "Até 3 contas do X cujo estilo de escrita você admira. A IA estuda seu tom e formato.",
        voiceExamples: "Exemplos de voz",
        voiceExamplesDescription: "Inclua seus tweets de melhor desempenho para ajudar a IA a reproduzir seu estilo.",
        useOwnTweets: "Usar meus próprios tweets como exemplos de voz",
        useOwnTweetsHint: "Inclui seus tweets com melhor desempenho para ajudar a combinar com seu estilo de escrita.",
        structureTypes: "Tipos de estrutura preferidos",
        structureTypesDescription: "Escolha até 3 formatos de post para as sugestões diárias.",
        maxSelected: "Máximo de 3 selecionados.",
        products: "Seus produtos",
        productsDescription: "Adicione links dos produtos que deseja promover. Até 5.",
        rules: "Regras do X",
        rulesDescription: "Instruções personalizadas incluídas em toda geração da IA. Tom, tópicos a evitar, CTAs etc.",
        rulesPlaceholder: "Exemplo: escrever sempre em primeira pessoa. Nunca usar hashtags. Mencionar o produto apenas quando encaixar naturalmente. Manter respostas abaixo de 200 caracteres.",
        saved: "Salvo.",
        saving: "Salvando…",
        save: "Salvar contexto",
      }
    : {
        xAccount: "X Account",
        xAccountDescription: "Connect your X account to post directly from the Content Studio and Queue.",
        disconnecting: "Disconnecting…",
        disconnect: "Disconnect",
        connectAccount: "Connect X account",
        interests: "Your Interests",
        interestsDescription: "Select the topics most relevant to your work. These focus AI suggestions on your niche.",
        favoriteCreators: "Favorite Creators",
        favoriteCreatorsDescription: "Up to 3 X accounts whose writing style you admire. The AI studies their tone and format.",
        voiceExamples: "Voice Examples",
        voiceExamplesDescription: "Include your best-performing tweets to help the AI match your writing style.",
        useOwnTweets: "Use my own tweets as voice examples",
        useOwnTweetsHint: "Includes your best-performing tweets to help match your writing style.",
        structureTypes: "Preferred Structure Types",
        structureTypesDescription: "Choose up to 3 post formats for daily suggestions.",
        maxSelected: "Max 3 selected.",
        products: "Your Products",
        productsDescription: "Add links to products you want to promote. Up to 5.",
        rules: "X Rules",
        rulesDescription: "Custom instructions included in every AI generation. Tone, topics to avoid, CTAs, etc.",
        rulesPlaceholder: "Example: Always write in first person. Never use hashtags. Mention the product only when it naturally fits. Keep replies under 200 chars.",
        saved: "Saved.",
        saving: "Saving…",
        save: "Save context",
      };
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [structureTypes, setStructureTypes] = useState<string[]>(profile?.structure_types ?? []);

  const [saveResult, saveDispatch, savePending] = useActionState(saveXContextFromForm, undefined);
  const [, disconnectDispatch, disconnectPending] = useActionState(disconnectXAccountAction, undefined);

  function toggleInterest(topic: string) {
    setInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }

  function toggleStructure(id: string) {
    setStructureTypes((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev,
    );
  }

  return (
    <div>
      {/* ── X Account Connection ── */}
      <Section
        title={copy.xAccount}
        description={copy.xAccountDescription}
      >
        {connectedAccount ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: "1px solid #E5E5E5", background: "#FAFAFA" }}>
            {connectedAccount.x_profile_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={connectedAccount.x_profile_image_url} alt="" width={36} height={36} style={{ borderRadius: "50%" }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1B" }}>{connectedAccount.x_name}</p>
              <p style={{ fontSize: 12, color: "#7C7C83" }}>@{connectedAccount.x_username}</p>
            </div>
            <form action={disconnectDispatch}>
              <input type="hidden" name="projectId" value={projectId} />
              <button
                type="submit"
                disabled={disconnectPending}
                style={{ fontSize: 12, color: "#D93025", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
              >
                {disconnectPending ? copy.disconnecting : copy.disconnect}
              </button>
            </form>
          </div>
        ) : (
          <a
            href={`/api/x/oauth/authorize?projectId=${projectId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 8,
              background: "#000",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
            </svg>
            {copy.connectAccount}
          </a>
        )}
      </Section>

      <form action={saveDispatch}>
        <input type="hidden" name="projectId" value={projectId} />

        {/* ── Interests ── */}
        <Section
          title={copy.interests}
          description={copy.interestsDescription}
        >
          {/* hidden inputs carry the selected values on submit */}
          {interests.map((t) => (
            <input key={t} type="hidden" name="interests" value={t} />
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TOPICS.map((topic) => {
              const active = interests.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleInterest(topic)}
                  className={`filter-pill${active ? " filter-pill-active" : ""}`}
                  style={{ cursor: "pointer", border: "none" }}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Favorite Creators ── */}
        <Section
          title={copy.favoriteCreators}
          description={copy.favoriteCreatorsDescription}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#7C7C83", width: 16, textAlign: "center" }}>@</span>
              <input
                className="settings-input"
                name="favoriteCreators"
                defaultValue={profile?.favorite_creators[i] ?? ""}
                placeholder="username"
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </Section>

        {/* ── Voice Examples ── */}
        <Section
          title={copy.voiceExamples}
          description={copy.voiceExamplesDescription}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              name="useOwnTweets"
              defaultChecked={profile?.use_own_tweets ?? false}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#FF4500" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1B" }}>
              {copy.useOwnTweets}
            </span>
          </label>
          <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 6, marginLeft: 26 }}>
            {copy.useOwnTweetsHint}
          </p>
        </Section>

        {/* ── Structure Types ── */}
        <Section
          title={copy.structureTypes}
          description={copy.structureTypesDescription}
        >
          {structureTypes.map((s) => (
            <input key={s} type="hidden" name="structureTypes" value={s} />
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STRUCTURE_TYPES.map(({ id, label }) => {
              const active = structureTypes.includes(id);
              const atLimit = structureTypes.length >= 3 && !active;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleStructure(id)}
                  disabled={atLimit}
                  className={`filter-pill${active ? " filter-pill-active" : ""}`}
                  style={{ cursor: atLimit ? "not-allowed" : "pointer", border: "none", opacity: atLimit ? 0.45 : 1 }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {structureTypes.length >= 3 && (
            <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 8 }}>{copy.maxSelected}</p>
          )}
        </Section>

        {/* ── Products ── */}
        <Section
          title={copy.products}
          description={copy.productsDescription}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <input
                className="settings-input"
                name="products"
                defaultValue={profile?.products[i] ?? ""}
                placeholder={`https://product${i + 1}.com`}
                type="url"
              />
            </div>
          ))}
        </Section>

        {/* ── X Rules ── */}
        <Section
          title={copy.rules}
          description={copy.rulesDescription}
        >
          <textarea
            className="settings-input"
            name="xRules"
            defaultValue={profile?.x_rules ?? ""}
            placeholder={copy.rulesPlaceholder}
            rows={5}
            style={{ resize: "vertical" }}
          />
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 8 }}>
          {saveResult?.ok && (
            <span style={{ fontSize: 13, color: "#2D6A3F", fontWeight: 600 }}>{copy.saved}</span>
          )}
          {saveResult?.ok === false && (
            <span style={{ fontSize: 13, color: "#D93025" }}>{saveResult.error}</span>
          )}
          <button
            type="submit"
            disabled={savePending}
            className="settings-btn-primary"
            style={{ padding: "9px 24px", fontSize: 14 }}
          >
            {savePending ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1B", marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "#7C7C83" }}>{description}</p>
      </div>
      {children}
    </section>
  );
}
