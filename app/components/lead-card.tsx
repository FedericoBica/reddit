import Link from "next/link";
import type { LeadDTO } from "@/db/schemas/domain";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  new:       { label: "Nuevo",       bg: "#FFF3EC", color: "#E03D00" },
  replied:   { label: "Respondido",  bg: "#DEF2E2", color: "#46A758" },
  irrelevant:{ label: "Irrelevante", bg: "#EDEFF1", color: "#7C7C83" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function scoreColor(score: number | null): string {
  if (!score) return "#B0B0B5";
  if (score >= 80) return "#FF4500";
  if (score >= 60) return "#FFB000";
  return "#B0B0B5";
}

export function LeadCard({
  lead,
  projectId,
}: {
  lead: LeadDTO;
  projectId: string;
}) {
  const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const score = lead.intent_score ?? 0;

  return (
    <Link
      href={`/leads/${lead.id}?projectId=${projectId}`}
      className="lead-card"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1A1A1B",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
        >
          {lead.title}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#B0B0B5",
          }}
        >
          <span>r/{lead.subreddit}</span>
          <span>·</span>
          <span>{timeAgo(lead.created_at)}</span>
          {lead.keywords_matched.length > 0 && (
            <>
              <span>·</span>
              <span style={{ color: "#FF4500", fontWeight: 500 }}>
                {lead.keywords_matched[0]}
              </span>
            </>
          )}
          {lead.sentiment && (
            <>
              <span>·</span>
              <span
                style={{
                  color:
                    lead.sentiment === "positive"
                      ? "#059669"
                      : lead.sentiment === "negative"
                        ? "#DC2626"
                        : "#7C7C83",
                }}
              >
                {lead.sentiment === "positive"
                  ? "positivo"
                  : lead.sentiment === "negative"
                    ? "negativo"
                    : "neutral"}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          className="badge"
          style={{
            background: status.bg,
            color: status.color,
          }}
        >
          {status.label}
        </span>
        {lead.intent_score !== null && (
          <span
            style={{
              background: scoreColor(score),
              color: "#FFF",
              fontSize: 13,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 8,
              minWidth: 36,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            {score}
          </span>
        )}
      </div>
    </Link>
  );
}
