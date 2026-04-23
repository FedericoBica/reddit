import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectLeads, listRepliedProjectLeads } from "@/db/queries/leads";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Posting Calendar",
};

type CalendarPageProps = {
  searchParams?: Promise<{ projectId?: string; month?: string }>;
};

// ── Types ─────────────────────────────────────────────────────

type DayEntry = {
  date: string; // YYYY-MM-DD
  subreddits: { name: string; leads: LeadDTO[] }[];
};

type SubredditHealth = {
  subreddit: string;
  lastRepliedAt: string; // ISO
  daysSince: number;
  status: "safe" | "caution" | "wait";
};

// ── Helpers ───────────────────────────────────────────────────

function toDateKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

function buildCalendarDays(year: number, month: number): (string | null)[] {
  // month is 1-based
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = [];
  // leading empty cells (Mon-based: shift Sunday to end)
  const startOffset = (firstDay + 6) % 7; // Mon=0 … Sun=6
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  return cells;
}

function buildDayEntries(leads: LeadDTO[]): Record<string, DayEntry> {
  const map: Record<string, Record<string, LeadDTO[]>> = {};
  for (const lead of leads) {
    if (!lead.replied_at) continue;
    const day = toDateKey(lead.replied_at);
    if (!map[day]) map[day] = {};
    if (!map[day][lead.subreddit]) map[day][lead.subreddit] = [];
    map[day][lead.subreddit].push(lead);
  }
  const result: Record<string, DayEntry> = {};
  for (const [date, subs] of Object.entries(map)) {
    result[date] = {
      date,
      subreddits: Object.entries(subs).map(([name, ls]) => ({ name, leads: ls })),
    };
  }
  return result;
}

function buildSubredditHealth(leads: LeadDTO[]): SubredditHealth[] {
  const latestBySubreddit = new Map<string, string>();
  for (const lead of leads) {
    if (!lead.replied_at) continue;
    const existing = latestBySubreddit.get(lead.subreddit);
    if (!existing || lead.replied_at > existing) {
      latestBySubreddit.set(lead.subreddit, lead.replied_at);
    }
  }
  const now = Date.now();
  return Array.from(latestBySubreddit.entries())
    .map(([subreddit, lastRepliedAt]) => {
      const daysSince = Math.floor((now - new Date(lastRepliedAt).getTime()) / 86_400_000);
      const status: SubredditHealth["status"] =
        daysSince >= 7 ? "safe" : daysSince >= 4 ? "caution" : "wait";
      return { subreddit, lastRepliedAt, daysSince, status };
    })
    .sort((a, b) => a.daysSince - b.daysSince);
}


// ── Page ──────────────────────────────────────────────────────

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireUser("/calendar");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;


  // Parse month param: "2026-04" or default to current
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (params?.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    if (y >= 2020 && y <= 2100 && m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  const todayKey = toDateKey(new Date().toISOString());

  const [repliedLeads, allLeads, t] = await Promise.all([
    listRepliedProjectLeads(currentProject.id, 500),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
    getTranslations("calendar"),
  ]);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;
  const dayEntries = buildDayEntries(repliedLeads);
  const health = buildSubredditHealth(repliedLeads);
  const cells = buildCalendarDays(year, month);

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const STATUS_CONFIG = {
    safe:    { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", label: t("safe")    },
    caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: t("caution") },
    wait:    { color: "#DC2626", bg: "#FEF2F2", border: "#FEE2E2", label: t("wait")    },
  };

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">{t("kicker")}</p>
            <h1 className="page-title">{t("title")}</h1>
            <p className="page-copy">{t("description")}</p>
          </div>
        </header>

        <div className="content-flow">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

            {/* ── Calendar ── */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #F0F0EE",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Month nav */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid #F0F0EE",
                }}
              >
                <Link
                  href={`/calendar?projectId=${currentProject.id}&month=${prevKey}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #E5E5EA",
                    background: "#FAFAF8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B6B6E",
                    textDecoration: "none",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                <p style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E" }}>
                  {MONTH_NAMES[month - 1]} {year}
                </p>

                <Link
                  href={`/calendar?projectId=${currentProject.id}&month=${nextKey}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #E5E5EA",
                    background: "#FAFAF8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B6B6E",
                    textDecoration: "none",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Day-of-week headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  borderBottom: "1px solid #F0F0EE",
                }}
              >
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    style={{
                      padding: "8px 0",
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#AEAEB2",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                }}
              >
                {cells.map((dateKey, idx) => {
                  if (!dateKey) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        style={{
                          minHeight: 80,
                          background: "#FAFAF8",
                          borderRight: "1px solid #F0F0EE",
                          borderBottom: "1px solid #F0F0EE",
                        }}
                      />
                    );
                  }

                  const entry = dayEntries[dateKey];
                  const isToday = dateKey === todayKey;
                  const isCurrentMonth = dateKey.startsWith(monthKey);
                  const dayNum = parseInt(dateKey.slice(8), 10);

                  return (
                    <div
                      key={dateKey}
                      style={{
                        minHeight: 80,
                        padding: "8px 10px",
                        borderRight: "1px solid #F0F0EE",
                        borderBottom: "1px solid #F0F0EE",
                        background: isToday ? "#FFFDFB" : "#FFFFFF",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: isToday ? 900 : 600,
                          color: isToday ? "#FFFFFF" : isCurrentMonth ? "#1C1C1E" : "#AEAEB2",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: isToday ? "#E07000" : "transparent",
                          marginBottom: 5,
                        }}
                      >
                        {dayNum}
                      </span>

                      {entry && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {entry.subreddits.map((sub) => (
                            <div
                              key={sub.name}
                              title={`r/${sub.name} — ${sub.leads.length} ${sub.leads.length === 1 ? "reply" : "replies"}`}
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: subredditColor(sub.name),
                                flexShrink: 0,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              {health.length > 0 && (
                <div
                  style={{
                    padding: "12px 20px",
                    borderTop: "1px solid #F0F0EE",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 14px",
                  }}
                >
                  {Array.from(new Set(repliedLeads.map((l) => l.subreddit))).map((sub) => (
                    <div key={sub} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: subredditColor(sub),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, color: "#6B6B6E", fontWeight: 600 }}>
                        r/{sub}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Subreddit Health Panel ── */}
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F0F0EE",
                  borderRadius: 12,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#AEAEB2",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 14,
                  }}
                >
                  {t("cooldown")}
                </p>

                {health.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#AEAEB2" }}>
                    {t("empty")}
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {health.map((h) => (
                      <SubredditHealthRow
                        key={h.subreddit}
                        health={h}
                        statusConfig={STATUS_CONFIG}
                        postedToday={t("postedToday")}
                        daysAgo={t("daysAgo", { days: h.daysSince })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F0F0EE",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#AEAEB2",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 12,
                  }}
                >
                  {t("statusLabel")}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  <StatusLegendRow status="safe"    label={t("safe")}    detail={t("safeDetail")}    statusConfig={STATUS_CONFIG} />
                  <StatusLegendRow status="caution" label={t("caution")} detail={t("cautionDetail")} statusConfig={STATUS_CONFIG} />
                  <StatusLegendRow status="wait"    label={t("wait")}    detail={t("waitDetail")}    statusConfig={STATUS_CONFIG} />
                </div>
              </div>

              <Link
                href={`/content-lab?projectId=${currentProject.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "11px 16px",
                  borderRadius: 10,
                  background: "#E07000",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                {t("createDraft")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────

type StatusConfig = Record<SubredditHealth["status"], { color: string; bg: string; border: string; label: string }>;

function SubredditHealthRow({ health: h, statusConfig, postedToday, daysAgo }: { health: SubredditHealth; statusConfig: StatusConfig; postedToday: string; daysAgo: string }) {
  const cfg = statusConfig[h.status];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "9px 12px",
        borderRadius: 8,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: subredditColor(h.subreddit),
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1C1C1E",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            r/{h.subreddit}
          </p>
          <p style={{ fontSize: 10, color: "#6B6B6E", fontWeight: 600 }}>
            {h.daysSince === 0 ? postedToday : daysAgo}
          </p>
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: cfg.color,
          background: "#FFFFFF",
          border: `1px solid ${cfg.border}`,
          padding: "2px 7px",
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Color helper (module-level, used by all components) ───────

function subredditColor(name: string): string {
  const COLORS = [
    "#E07000", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444",
    "#F59E0B", "#06B6D4", "#EC4899", "#84CC16", "#F97316",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xfffff;
  return COLORS[hash % COLORS.length];
}

function StatusLegendRow({
  status,
  label,
  detail,
  statusConfig,
}: {
  status: SubredditHealth["status"];
  label: string;
  detail: string;
  statusConfig: StatusConfig;
}) {
  const cfg = statusConfig[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#AEAEB2", marginLeft: "auto" }}>{detail}</span>
    </div>
  );
}
