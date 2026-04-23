import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "./logo";
import { ProjectSwitcher } from "./project-switcher";
import { PushNotificationToggle } from "./push-notification-toggle";
import { SidebarLinks } from "./sidebar-links";
import { signOut } from "@/modules/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectDTO } from "@/db/schemas/domain";

export function DashboardShell({
  user,
  currentProject,
  newLeadsCount,
  newSearchboxCount,
  children,
}: {
  user: User;
  currentProject: ProjectDTO;
  newLeadsCount?: number;
  newSearchboxCount?: number;
  children: React.ReactNode;
}) {
  const isAdminPromise = checkIsAdmin(user.id);

  return (
    <DashboardShellContent
      user={user}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
      newSearchboxCount={newSearchboxCount}
      isAdminPromise={isAdminPromise}
    >
      {children}
    </DashboardShellContent>
  );
}

function RefreshCountdowns({
  lastOpportunitiesAt,
  lastMentionsAt,
}: {
  lastOpportunitiesAt: string | null;
  lastMentionsAt: string | null;
}) {
  const CYCLE_HOURS = 24;
  const now = Date.now();

  function computeBar(lastAt: string | null) {
    if (!lastAt) return { pct: 0, label: "Pending", color: "#DDDDD9" };
    const hoursSince = (now - new Date(lastAt).getTime()) / 3_600_000;
    const hoursLeft = Math.max(0, CYCLE_HOURS - hoursSince);
    const pct = Math.max(0, Math.min(100, (hoursLeft / CYCLE_HOURS) * 100));
    let label: string;
    if (hoursLeft < 0.5) label = "Soon";
    else if (hoursLeft < 1) label = "< 1h";
    else label = `${Math.round(hoursLeft)}h`;
    const color = pct > 50 ? "#16A34A" : pct > 20 ? "#E07000" : "#AEAEB2";
    return { pct, label, color };
  }

  const opp = computeBar(lastOpportunitiesAt);
  const men = computeBar(lastMentionsAt);

  return (
    <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #EEEEED", display: "grid", gap: 8 }}>
      <p style={{ fontSize: 9, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
        Next refresh
      </p>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#6B6B6E" }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: bar.color }}>{bar.label}</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: "#E8E8E6", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${bar.pct}%`,
          borderRadius: 99,
          background: bar.color,
          transition: "width 400ms ease",
        }} />
      </div>
    </div>
  );
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("users").select("is_admin").eq("id", userId).single();
    return data?.is_admin ?? false;
  } catch {
    return false;
  }
}

async function DashboardShellContent({
  user,
  currentProject,
  newLeadsCount,
  newSearchboxCount,
  isAdminPromise,
  children,
}: {
  user: User;
  currentProject: ProjectDTO;
  newLeadsCount?: number;
  newSearchboxCount?: number;
  isAdminPromise: Promise<boolean>;
  children: React.ReactNode;
}) {
  const [isAdmin, t] = await Promise.all([
    isAdminPromise,
    getTranslations("nav"),
  ]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#FAFAF8",
      }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: 224,
          background: "#F7F7F5",
          borderRight: "1px solid #EEEEED",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* Logo + project selector */}
        <div
          style={{
            padding: "16px 14px 14px",
            borderBottom: "1px solid #EEEEED",
          }}
        >
          <BrandLink
            logoSize={22}
            wordmarkSize={14}
            style={{ gap: 6, marginBottom: 12, padding: "0 3px" }}
          />

          <ProjectSwitcher currentProject={currentProject} />
        </div>

        {/* Nav links */}
        <SidebarLinks
          currentProjectId={currentProject.id}
          newLeadsCount={newLeadsCount}
          newSearchboxCount={newSearchboxCount}
        />

        {/* Footer */}
        <div style={{ borderTop: "1px solid #EEEEED", background: "#F2F2F0" }}>
          {/* Refresh countdown bars */}
          <RefreshCountdowns
            lastOpportunitiesAt={currentProject.last_scraped_at}
            lastMentionsAt={currentProject.last_mentions_scraped_at}
          />

          {/* User profile row */}
          <div style={{ padding: "10px 14px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999,
                background: "#E07000", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#FFF" }}>
                  {(user.email?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#6B6B6E",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
              }}>
                {user.email}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <form action={signOut} style={{ flex: 1 }}>
                <button
                  type="submit"
                  style={{
                    fontSize: 10, fontWeight: 700, color: "#8E8E93",
                    background: "none", border: "1px solid #DDDDD9", borderRadius: 5,
                    cursor: "pointer", padding: "3px 8px", width: "100%",
                    transition: "border-color 150ms ease, color 150ms ease",
                  }}
                >
                  Sign out
                </button>
              </form>
              {isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    fontSize: 10, fontWeight: 700, color: "#E07000",
                    textDecoration: "none", padding: "3px 8px", borderRadius: 5,
                    background: "#FFF4E6", border: "1px solid rgba(224,112,0,0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Admin
                </Link>
              )}
            </div>
            <PushNotificationToggle publicKey={process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
