"use client";

import { useActionState } from "react";
import { updateScheduleSettings } from "./actions";
import type { ScheduleSettings } from "@/db/queries/admin";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hourLabel(h: number) {
  return `${pad(h)}:00 UTC`;
}

export function ScheduleForm({ settings }: { settings: ScheduleSettings }) {
  const [state, action, pending] = useActionState(updateScheduleSettings, null);

  return (
    <form action={action}>
      <div style={{ display: "grid", gap: 28 }}>
        {state?.error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 13, fontWeight: 600 }}>
            {state.error}
          </div>
        )}

        {state && !state.error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#065F46", fontSize: 13, fontWeight: 600 }}>
            Schedule saved.
          </div>
        )}

        <ScheduleRow
          label="Opportunities"
          description="Reddit keyword + subreddit scrape that fills the lead inbox."
          name="opportunities_hour"
          currentHour={settings.opportunities_hour}
        />
        <ScheduleRow
          label="Mentions"
          description="Brand name and competitor mention tracking."
          name="mentions_hour"
          currentHour={settings.mentions_hour}
        />
        <ScheduleRow
          label="Searchbox"
          description="Google index scan for Reddit posts. Runs on selected days of the month."
          name="searchbox_hour"
          currentHour={settings.searchbox_hour}
        />

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
            Searchbox days of month
          </label>
          <p style={{ fontSize: 12, color: "#8E8E93", marginBottom: 2 }}>
            Comma-separated day numbers, e.g. <code>1,15</code>
          </p>
          <input
            name="searchbox_days"
            defaultValue={settings.searchbox_days.join(",")}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E5EA", borderRadius: 8, fontSize: 13, fontFamily: "monospace", color: "#1C1C1E", background: "#FFFFFF", outline: "none" }}
          />
        </div>

        <div style={{ paddingTop: 4, borderTop: "1px solid #F0F0EE" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
            Current schedule (UTC)
          </p>
          {[
            { label: "Opportunities", hour: settings.opportunities_hour, note: "daily (per plan interval)" },
            { label: "Mentions",      hour: settings.mentions_hour,      note: "daily (per plan interval)" },
            { label: "Searchbox",     hour: settings.searchbox_hour,     note: `days ${settings.searchbox_days.join(", ")} of each month` },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "#6B6B6E" }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: "#1C1C1E" }}>{pad(row.hour)}:00 UTC · {row.note}</span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={pending}
          style={{ height: 44, borderRadius: 8, background: pending ? "#8E8E93" : "#1C1C1E", color: "#FFFFFF", fontSize: 14, fontWeight: 800, border: "none", cursor: pending ? "not-allowed" : "pointer", width: "100%" }}
        >
          {pending ? "Saving…" : "Save schedule"}
        </button>
      </div>
    </form>
  );
}

function ScheduleRow({ label, description, name, currentHour }: { label: string; description: string; name: string; currentHour: number }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <label htmlFor={name} style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{label}</label>
          <p style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>{description}</p>
        </div>
        <select
          id={name}
          name={name}
          defaultValue={currentHour}
          style={{ flexShrink: 0, padding: "7px 10px", border: "1.5px solid #E5E5EA", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#1C1C1E", background: "#FFFFFF", cursor: "pointer", outline: "none" }}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{hourLabel(h)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
