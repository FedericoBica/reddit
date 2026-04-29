"use client";

import { useState, useActionState } from "react";
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
        title="X Account"
        description="Connect your X account to post directly from the Content Studio and Queue."
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
                {disconnectPending ? "Disconnecting…" : "Disconnect"}
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
            Connect X account
          </a>
        )}
      </Section>

      <form action={saveDispatch}>
        <input type="hidden" name="projectId" value={projectId} />

        {/* ── Interests ── */}
        <Section
          title="Your Interests"
          description="Select the topics most relevant to your work. These focus AI suggestions on your niche."
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
          title="Favorite Creators"
          description="Up to 3 X accounts whose writing style you admire. The AI studies their tone and format."
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
          title="Voice Examples"
          description="Include your best-performing tweets to help the AI match your writing style."
        >
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              name="useOwnTweets"
              defaultChecked={profile?.use_own_tweets ?? false}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#FF4500" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1B" }}>
              Use my own tweets as voice examples
            </span>
          </label>
          <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 6, marginLeft: 26 }}>
            Includes your best-performing tweets to help match your writing style.
          </p>
        </Section>

        {/* ── Structure Types ── */}
        <Section
          title="Preferred Structure Types"
          description="Choose up to 3 post formats for daily suggestions."
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
            <p style={{ fontSize: 12, color: "#7C7C83", marginTop: 8 }}>Max 3 selected.</p>
          )}
        </Section>

        {/* ── Products ── */}
        <Section
          title="Your Products"
          description="Add links to products you want to promote. Up to 5."
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
          title="X Rules"
          description="Custom instructions included in every AI generation. Tone, topics to avoid, CTAs, etc."
        >
          <textarea
            className="settings-input"
            name="xRules"
            defaultValue={profile?.x_rules ?? ""}
            placeholder="Example: Always write in first person. Never use hashtags. Mention the product only when it naturally fits. Keep replies under 200 chars."
            rows={5}
            style={{ resize: "vertical" }}
          />
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 8 }}>
          {saveResult?.ok && (
            <span style={{ fontSize: 13, color: "#2D6A3F", fontWeight: 600 }}>Saved.</span>
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
            {savePending ? "Saving…" : "Save context"}
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
