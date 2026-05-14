"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

export function RefreshCountdowns({
  lastOpportunitiesAt,
  lastMentionsAt,
  cycleHours,
  opportunitiesBackoffUntil,
}: {
  lastOpportunitiesAt: string | null;
  lastMentionsAt: string | null;
  cycleHours: number;
  opportunitiesBackoffUntil?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  const locale = useLocale();
  const copy = locale.startsWith("es")
    ? {
        pending: "Pendiente",
        dueNow: "Ahora",
        soon: "Pronto",
        nextRefresh: "Próxima actualización",
        opportunities: "Oportunidades",
        mentions: "Menciones",
      }
    : locale.startsWith("pt")
    ? {
        pending: "Pendente",
        dueNow: "Agora",
        soon: "Em breve",
        nextRefresh: "Próxima atualização",
        opportunities: "Oportunidades",
        mentions: "Menções",
      }
    : {
        pending: "Pending",
        dueNow: "Due now",
        soon: "Soon",
        nextRefresh: "Next refresh",
        opportunities: "Opportunities",
        mentions: "Mentions",
      };

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  function computeBar(lastAt: string | null, nextRunOverride?: string | null) {
    if (!lastAt) return { pct: 0, label: copy.pending, hasData: false };

    const normalNext = new Date(lastAt).getTime() + cycleHours * 3_600_000;
    const overrideNext = nextRunOverride ? new Date(nextRunOverride).getTime() : null;
    const nextRun = overrideNext && overrideNext > normalNext ? overrideNext : normalNext;

    const msLeft = nextRun - now;
    const hoursLeft = msLeft / 3_600_000;

    if (msLeft <= 0) {
      const hoursOver = Math.abs(hoursLeft);
      let label: string;
      if (hoursOver < 1) label = copy.dueNow;
      else if (hoursOver < 24) label = `+${Math.round(hoursOver)}h`;
      else label = `+${Math.round(hoursOver / 24)}d`;
      return { pct: 0, label, hasData: true };
    }

    const pct = Math.min(100, (hoursLeft / cycleHours) * 100);
    let label: string;
    if (hoursLeft < 0.5) label = copy.soon;
    else if (hoursLeft < 1) label = "< 1h";
    else if (hoursLeft < 24) label = `${Math.round(hoursLeft)}h`;
    else label = `${Math.round(hoursLeft / 24)}d`;
    return { pct, label, hasData: true };
  }

  const opp = computeBar(lastOpportunitiesAt, opportunitiesBackoffUntil);
  const men = computeBar(lastMentionsAt);

  // Shared color: driven by the worst (lowest pct) among bars that have data
  const validPcts = [opp, men].filter((b) => b.hasData).map((b) => b.pct);
  const minPct = validPcts.length > 0 ? Math.min(...validPcts) : null;
  const sharedColor =
    minPct === null ? "#B0B0B5" : minPct > 50 ? "#46A758" : minPct > 20 ? "#FF4500" : "#B0B0B5";

  return (
    <div className="ds-refresh-block">
      <p className="ds-refresh-label">{copy.nextRefresh}</p>
      <RefreshBar label={copy.opportunities} bar={{ ...opp, color: sharedColor }} />
      <RefreshBar label={copy.mentions} bar={{ ...men, color: sharedColor }} />
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
