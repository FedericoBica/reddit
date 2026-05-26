import type { ExtensionTokenDTO, KeywordDTO, XKeywordDTO } from "@/db/schemas/domain";
import {
  addKeywordFromForm,
  addCompetitorFromForm,
  updateKeywordFromForm,
  removeKeywordFromForm,
  toggleKeywordFromForm,
  addXKeywordFromForm,
  updateXKeywordFromForm,
  toggleXKeywordFromForm,
  removeXKeywordFromForm,
} from "@/modules/projects/settings-actions";
import {
  generateConnectTokenFromForm,
  revokeExtensionTokenFromForm,
} from "@/modules/outbound/extension-token-actions";
import { ExtensionConnectTokenNotice } from "./extension-connect-token-notice";
import type { SettingsCopy } from "./settings-copy";
import { EmptyHint, SettingsSection, formatRelativeDate } from "./settings-ui";

export function KeywordGroup({
  title,
  keywords,
  projectId,
  editable = false,
  copy,
}: {
  title: string;
  keywords: KeywordDTO[];
  projectId: string;
  editable?: boolean;
  copy: SettingsCopy;
}) {
  return (
    <div style={{ marginTop: title === "Suggested by AI" ? 0 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#1A1A1B" }}>{title}</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83" }}>{keywords.length}</span>
      </div>
      <div style={{ display: "grid", gap: 0 }}>
        {keywords.length === 0 ? (
          <EmptyHint>{copy.keywordGroup.empty(title)}</EmptyHint>
        ) : (
          keywords.map((keyword) => (
            <KeywordRow key={keyword.id} keyword={keyword} projectId={projectId} editable={editable} copy={copy} />
          ))
        )}
      </div>
    </div>
  );
}

export function KeywordRow({
  keyword,
  projectId,
  editable = false,
  copy,
}: {
  keyword: KeywordDTO;
  projectId: string;
  editable?: boolean;
  copy: SettingsCopy;
}) {
  const typeBadgeColor = keyword.type === "ai_suggested" ? "#7C7C83" : "#1A1A1B";
  const typeLabel = keyword.type === "ai_suggested" ? copy.keywordRow.typeAi : keyword.type === "competitor" ? copy.keywordRow.typeComp : copy.keywordRow.typeCustom;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #EDEFF1",
      }}
    >
      {/* Toggle */}
      <form action={toggleKeywordFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input type="hidden" name="isActive" value={String(!keyword.is_active)} />
        <button
          type="submit"
          title={keyword.is_active ? copy.keywordRow.pause : copy.keywordRow.enable}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: keyword.is_active ? "#FF4500" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: keyword.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
              transition: "left 0.15s",
            }}
          />
        </button>
      </form>

      {/* Term */}
      {editable ? (
        <form action={updateKeywordFromForm} style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="keywordId" value={keyword.id} />
          <input
            className="settings-input"
            name="term"
            defaultValue={keyword.term}
            required
            style={{ opacity: keyword.is_active ? 1 : 0.58 }}
          />
          <button type="submit" className="settings-btn-secondary">{copy.keywordRow.save}</button>
        </form>
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: keyword.is_active ? "#1A1A1B" : "#B0B0B5",
          }}
        >
          {keyword.term}
        </span>
      )}

      {/* Type badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: typeBadgeColor,
          background: "#EDEFF1",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.02em",
        }}
      >
        {typeLabel}
      </span>

      {/* Intent */}
      {keyword.intent_category && (
        <span
          style={{
            fontSize: 10,
            color: "#7C7C83",
            background: "#EDEFF1",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          {keyword.intent_category}
        </span>
      )}

      {/* Remove */}
      <form action={removeKeywordFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <button
          type="submit"
          title={copy.keywordRow.remove}
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

export function XKeywordRow({
  keyword,
  projectId,
  copy,
}: {
  keyword: XKeywordDTO;
  projectId: string;
  copy: SettingsCopy;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #EDEFF1",
      }}
    >
      <form action={toggleXKeywordFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input type="hidden" name="isActive" value={String(!keyword.is_active)} />
        <button
          type="submit"
          title={keyword.is_active ? copy.xKeywordRow.pause : copy.xKeywordRow.enable}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: keyword.is_active ? "#111827" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: keyword.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
            }}
          />
        </button>
      </form>

      <form action={updateXKeywordFromForm} style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input
          className="settings-input"
          name="query"
          defaultValue={keyword.query}
          required
          style={{ opacity: keyword.is_active ? 1 : 0.58, fontFamily: "monospace" }}
        />
        <button type="submit" className="settings-btn-secondary">{copy.xKeywordRow.save}</button>
      </form>

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#111827",
          background: "#F3F4F6",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.02em",
        }}
      >
        {copy.xKeywordRow.rule}
      </span>

      <form action={removeXKeywordFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <button
          type="submit"
          title={copy.xKeywordRow.remove}
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

export function XQuerySyntaxGuide({ copy }: { copy: SettingsCopy }) {
  return (
    <details style={{ marginTop: 18 }}>
      <summary style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83", cursor: "pointer", userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10 }}>▶</span> {copy.xGuide.title}
      </summary>
      <div style={{ marginTop: 12, borderRadius: 8, border: "1px solid #EDEFF1", overflow: "hidden" }}>
        {copy.xGuide.operators.map(({ op, desc }, i) => (
          <div key={op} style={{ display: "flex", gap: 12, padding: "8px 12px", background: i % 2 === 0 ? "#FAFAFA" : "#FFF", borderTop: i > 0 ? "1px solid #F0F0F0" : undefined }}>
            <code style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "#FF4500", whiteSpace: "nowrap", flexShrink: 0 }}>{op}</code>
            <span style={{ fontSize: 12, color: "#7C7C83" }}>{desc}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#B0B0B5", marginTop: 8 }}>
        {copy.xGuide.combine} <code style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>crm lang:en -is:retweet min_faves:5</code>
      </p>
    </details>
  );
}

export function ExtensionSection({
  projectId,
  tokens,
  copy,
}: {
  projectId: string;
  tokens: ExtensionTokenDTO[];
  copy: SettingsCopy;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ExtensionConnectTokenNotice />

      <SettingsSection
        title={copy.extension.title}
        description={copy.extension.description}
      >
        <form action={generateConnectTokenFromForm}>
          <input type="hidden" name="projectId" value={projectId} />
          <button type="submit" className="settings-btn-primary">
            {copy.extension.generate}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection
        title={copy.extension.sessionsTitle}
        description={copy.extension.sessionsDescription}
        badge={tokens.length > 0 ? copy.extension.activeBadge(tokens.length) : undefined}
      >
        {tokens.length === 0 ? (
          <p style={{ fontSize: 12, color: "#B0B0B5", padding: "8px 0" }}>
            {copy.extension.empty}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 0 }}>
            {tokens.map((token) => (
              <div
                key={token.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid #EDEFF1",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1B" }}>
                    {token.label ?? copy.extension.defaultLabel}
                  </p>
                  <p style={{ fontSize: 11, color: "#7C7C83", marginTop: 2 }}>
                    {copy.extension.connected(formatRelativeDate(token.created_at, copy))}
                    {token.last_used_at && ` · ${copy.extension.lastUsed(formatRelativeDate(token.last_used_at, copy))}`}
                  </p>
                </div>
                <form action={revokeExtensionTokenFromForm}>
                  <input type="hidden" name="tokenId" value={token.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button
                    type="submit"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#DC2626",
                      background: "none",
                      border: "1px solid #FECACA",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {copy.extension.revoke}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

