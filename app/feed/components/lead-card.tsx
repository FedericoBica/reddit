import Link from "next/link";
import type { LeadDTO } from "@/db/schemas/domain";
import { formatAge } from "../feed-utils";
import { TypeDot, StatusPill } from "./feed-ui";

export function LeadCard({ lead, active, href, copy }: { lead: LeadDTO; active: boolean; href: string; copy: Record<string, string> }) {
  const ageMs = lead.created_utc ? Date.now() - new Date(lead.created_utc).getTime() : null;
  const ageMinutes = ageMs !== null ? Math.floor(ageMs / 60_000) : null;
  const isUnread = lead.opened_at === null;

  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { borderLeftColor: "#FF4500" } : undefined}
    >
      <div className="opportunity-meta">
        <TypeDot kind="opportunity" />
        <span>r/{lead.subreddit}</span>
        {ageMinutes !== null && <span>{formatAge(ageMinutes, copy)}</span>}
        {lead.num_comments != null && <span>{lead.num_comments} {copy.comments}</span>}
      </div>

      <h2 className="opportunity-heading">{lead.title}</h2>

      {lead.classification_reason && (
        <div style={{ marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#46A758" }}>
            {copy.relevance}: {lead.intent_score ?? "–"}
          </span>
          <p style={{ fontSize: 11, color: "#46A758", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
            {lead.classification_reason.slice(0, 120)}
          </p>
        </div>
      )}

      {(lead.status !== "new" || (lead.score ?? 0) > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {lead.status !== "new" ? <StatusPill status={lead.status} copy={copy} /> : <span />}
          {(lead.score ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#B0B0B5", fontWeight: 700 }}>▲ {lead.score}</span>
          )}
        </div>
      )}
    </Link>
  );
}
