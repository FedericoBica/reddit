"use client";

import { useEffect, useState } from "react";

export function RefreshCountdowns({
  lastOpportunitiesAt,
  lastMentionsAt,
  cycleHours,
}: {
  lastOpportunitiesAt: string | null;
  lastMentionsAt: string | null;
  cycleHours: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  function computeBar(lastAt: string | null) {
    if (!lastAt) return { pct: 0, label: "Pending", color: "#B0B0B5" };
    const hoursSince = (now - new Date(lastAt).getTime()) / 3_600_000;
    const hoursLeft = Math.max(0, cycleHours - hoursSince);
    const pct = Math.max(0, Math.min(100, (hoursLeft / cycleHours) * 100));
    let label: string;
    if (hoursLeft < 0.5) label = "Soon";
    else if (hoursLeft < 1) label = "< 1h";
    else if (hoursLeft < 24) label = `${Math.round(hoursLeft)}h`;
    else label = `${Math.round(hoursLeft / 24)}d`;
    const color = pct > 50 ? "#46A758" : pct > 20 ? "#FF4500" : "#B0B0B5";
    return { pct, label, color };
  }

  const opp = computeBar(lastOpportunitiesAt);
  const men = computeBar(lastMentionsAt);

  return (
    <div className="ds-refresh-block">
      <p className="ds-refresh-label">Next refresh</p>
      <RefreshBar label="Opportunities" bar={opp} />
      <RefreshBar label="Mentions" bar={men} />
    </div>
  );
}

function RefreshBar({
  label,
  bar,
}: {
  label: string;
  bar: { pct: number; label: string; color: string };
}) {
  return (
    <div>
      <div className="ds-refresh-bar-row">
        <span style={{ fontSize: 10, fontWeight: 600, color: "#7C7C83" }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: bar.color }}>{bar.label}</span>
      </div>
      <div className="ds-refresh-bar-track">
        <div
          className="ds-refresh-bar-fill"
          style={{ width: `${bar.pct}%`, background: bar.color }}
        />
      </div>
    </div>
  );
}
