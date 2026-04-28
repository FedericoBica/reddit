import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { BrandLink } from "./logo";
import { MobileShell } from "./mobile-shell";
import { ProjectSwitcher } from "./project-switcher";
import { SidebarLinks } from "./sidebar-links";
import { signOut } from "@/modules/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNewItemsCount } from "@/db/queries/leads";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import type { ProjectDTO } from "@/db/schemas/domain";

export function DashboardShell({
  user,
  currentProject,
  newSearchboxCount,
  children,
}: {
  user: User;
  currentProject: ProjectDTO;
  newSearchboxCount?: number;
  children: React.ReactNode;
}) {
  const isAdminPromise = checkIsAdmin(user.id);

  return (
    <DashboardShellContent
      user={user}
      currentProject={currentProject}
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
  nowMs,
}: {
  lastOpportunitiesAt: string | null;
  lastMentionsAt: string | null;
  nowMs: number;
}) {
  const CYCLE_HOURS = 24;

  function computeBar(lastAt: string | null) {
    if (!lastAt) return { pct: 0, label: "Pending", color: "#B0B0B5" };
    const hoursSince = (nowMs - new Date(lastAt).getTime()) / 3_600_000;
    const hoursLeft = Math.max(0, CYCLE_HOURS - hoursSince);
    const pct = Math.max(0, Math.min(100, (hoursLeft / CYCLE_HOURS) * 100));
    let label: string;
    if (hoursLeft < 0.5) label = "Soon";
    else if (hoursLeft < 1) label = "< 1h";
    else label = `${Math.round(hoursLeft)}h`;
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
          style={{
            width: `${bar.pct}%`,
            background: bar.color,
          }}
        />
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
  newSearchboxCount,
  isAdminPromise,
  children,
}: {
  user: User;
  currentProject: ProjectDTO;
  newSearchboxCount?: number;
  isAdminPromise: Promise<boolean>;
  children: React.ReactNode;
}) {
  const [isAdmin, newLeadsCount, billingPlan] = await Promise.all([
    isAdminPromise,
    getNewItemsCount(currentProject.id),
    getCurrentBillingPlan(),
  ]);
  const refreshNowMs = Number(new Date());

  const sidebarContent = (
    <>
      {/* Logo + project selector */}
      <div className="ds-sidebar-head">
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
        xEnabled={billingPlan.xEnabled}
      />

      {/* Footer */}
      <div className="ds-sidebar-foot">
        <RefreshCountdowns
          lastOpportunitiesAt={currentProject.last_scraped_at}
          lastMentionsAt={currentProject.last_mentions_scraped_at}
          nowMs={refreshNowMs}
        />

        <div className="ds-user-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 999,
              background: "#FF4500", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>
                {(user.email?.[0] ?? "?").toUpperCase()}
              </span>
            </div>
            <p style={{
              fontSize: 11, fontWeight: 500, color: "#7C7C83",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
            }}>
              {user.email}
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <form action={signOut} style={{ flex: 1 }}>
              <button type="submit" className="ds-btn-quiet">
                Sign out
              </button>
            </form>
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  fontSize: 10, fontWeight: 700, color: "#FF4500",
                  textDecoration: "none", padding: "3px 10px", borderRadius: 99,
                  background: "#FFF3EC", border: "1px solid rgba(255,69,0,0.2)",
                  whiteSpace: "nowrap",
                }}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <MobileShell sidebar={sidebarContent}>
      {children}
    </MobileShell>
  );
}
