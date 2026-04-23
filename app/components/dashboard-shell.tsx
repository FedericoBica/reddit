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
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid #EEEEED",
            background: "#F2F2F0",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#AEAEB2",
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8E8E93",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  transition: "color 160ms ease",
                }}
              >
                {t("signOut")}
              </button>
            </form>
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#E07000",
                  textDecoration: "none",
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#FFF4E6",
                  letterSpacing: "0.02em",
                }}
              >
                {t("admin")}
              </Link>
            )}
          </div>
          <PushNotificationToggle publicKey={process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY} />
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
