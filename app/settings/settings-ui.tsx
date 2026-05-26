import Link from "next/link";
import { deleteProjectFromForm } from "@/modules/projects/delete-actions";
import type { SettingsCopy, SettingsTab } from "./settings-copy";
import { SETTINGS_TABS } from "./settings-copy";

export function SettingsTabs({
  projectId,
  selectedTab,
  copy,
}: {
  projectId: string;
  selectedTab: SettingsTab;
  copy: SettingsCopy;
}) {
  return (
    <nav
      aria-label={copy.tabsAriaLabel}
      className="panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: 6,
        marginBottom: 18,
      }}
    >
      {SETTINGS_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/settings?projectId=${projectId}&tab=${tab.id}`}
          className={`filter-pill${selectedTab === tab.id ? " filter-pill-active" : ""}`}
        >
          {copy.tabs[tab.id]}
        </Link>
      ))}
    </nav>
  );
}

export function SettingsSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEEEED",
        borderRadius: 12,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1A1A1B",
              marginBottom: 3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>{description}</p>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#FF4500",
              background: "#FFF3EC",
              border: "1px solid #FFD9AD",
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function FormFooter({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
      <button type="submit" className="settings-btn-primary">
        {label}
      </button>
    </div>
  );
}

export function DangerZone({
  projectId,
  projectName,
  copy,
}: {
  projectId: string;
  projectName: string;
  copy: SettingsCopy;
}) {
  return (
    <div
      style={{
        border: "1px solid #FFD1D1",
        background: "#FFF8F8",
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#8F1D1D", marginBottom: 4 }}>
          {copy.dangerZone.title}
        </h3>
        <p style={{ fontSize: 12, color: "#7A3A3A", lineHeight: 1.5 }}>
          {copy.dangerZone.description}
        </p>
      </div>

      <form action={deleteProjectFromForm} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7A3A3A" }}>
            {renderDeleteConfirmation(copy.dangerZone.confirm(projectName))}
          </span>
          <input
            className="settings-input"
            name="confirmation"
            placeholder="DELETE"
            required
            autoComplete="off"
          />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            style={{
              border: "1px solid #DC2626",
              background: "#DC2626",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {copy.dangerZone.delete}
          </button>
        </div>
      </form>
    </div>
  );
}

function renderDeleteConfirmation(message: string) {
  const [before, ...rest] = message.split("DELETE");
  const after = rest.join("DELETE");
  return (
    <>
      {before}
      <strong>DELETE</strong>
      {after}
    </>
  );
}

export function FieldRow({
  label,
  vertical,
  children,
}: {
  label: string;
  vertical?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={vertical ? undefined : "settings-field-row"}
      style={
        vertical
          ? { display: "flex", flexDirection: "column", gap: 6 }
          : {
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              alignItems: "center",
              gap: 12,
            }
      }
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#7C7C83",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#B0B0B5",
        padding: "12px 0",
        marginBottom: 4,
      }}
    >
      {children}
    </p>
  );
}

export function NotificationChannel({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 18, color: enabled ? "#46A758" : "#7C7C83" }}>
        {enabled ? "Enabled" : "Locked"}
      </div>
    </div>
  );
}

export function FrequencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #EDEFF1" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1B" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#FF4500" }}>{value}</span>
    </div>
  );
}

export function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 22 }}>{value}</div>
    </div>
  );
}

export function PlanLimit({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #EDEFF1" }}>
      <span style={{ fontSize: 13, color: "#7C7C83", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1A1A1B", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

export function formatRelativeDate(iso: string, copy: SettingsCopy): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return copy.relativeDate.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return copy.relativeDate.hoursAgo(hours);
  return copy.relativeDate.daysAgo(Math.floor(hours / 24));
}
