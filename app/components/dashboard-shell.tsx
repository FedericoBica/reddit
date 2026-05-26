import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "./logo";
import { MobileShell } from "./mobile-shell";
import { ProjectSwitcher } from "./project-switcher";
import { SidebarLinks } from "./sidebar-links";
import { RefreshCountdowns } from "./refresh-countdowns";
import { SidebarProfile } from "./sidebar-profile";
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
          cycleHours={billingPlan?.scrapeIntervalHours ?? 168}
          opportunitiesBackoffUntil={currentProject.scrape_backoff_until}
        />

        <div className="ds-user-row">
          <SidebarProfile
            email={user.email ?? ""}
            isAdmin={isAdmin}
            planLabel={billingPlan ? planDisplayName(billingPlan.plan) : "No Plan"}
            onSignOut={signOut}
            signOutLabel={tNav("signOut")}
            settingsLabel={tNav("settings")}
            adminLabel={tNav("admin")}
          />
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

function planDisplayName(plan: string): string {
  if (plan === "startup") return "Startup";
  if (plan === "growth") return "Growth";
  if (plan === "professional") return "Professional";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
