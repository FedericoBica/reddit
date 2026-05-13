import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "./logo";
import { MobileShell } from "./mobile-shell";
import { ProjectSwitcher } from "./project-switcher";
import { SidebarLinks } from "./sidebar-links";
import { RefreshCountdowns } from "./refresh-countdowns";
import { signOut } from "@/modules/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNewItemsCount } from "@/db/queries/leads";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
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
  const [isAdmin, newCounts, billingPlan, projects] = await Promise.all([
    isAdminPromise,
    getNewItemsCount(currentProject.id),
    getCurrentBillingPlan(),
    listProjectsForCurrentUser(),
  ]);
  const tNav = await getTranslations("nav");

  const sidebarContent = (
    <>
      {/* Logo + project selector */}
      <div className="ds-sidebar-head">
        <BrandLink
          logoSize={22}
          wordmarkSize={14}
          style={{ gap: 6, marginBottom: 12, padding: "0 3px" }}
        />
        <ProjectSwitcher currentProject={currentProject} projects={projects} />
      </div>

      {/* Nav links */}
      <Suspense fallback={null}>
        <SidebarLinks
          currentProjectId={currentProject.id}
          newOpportunitiesCount={newCounts.opportunities}
          newMentionsCount={newCounts.mentions}
          newSearchboxCount={newSearchboxCount}
        />
      </Suspense>

      {/* Footer */}
      <div className="ds-sidebar-foot">
        <RefreshCountdowns
          lastOpportunitiesAt={currentProject.last_scraped_at}
          lastMentionsAt={currentProject.last_mentions_scraped_at}
          cycleHours={billingPlan.scrapeIntervalHours}
          opportunitiesBackoffUntil={currentProject.scrape_backoff_until}
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
                {tNav("signOut")}
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
                {tNav("admin")}
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
