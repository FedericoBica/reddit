import type { User } from "@supabase/supabase-js";
import { Logo, Wordmark } from "./logo";
import { SidebarLinks } from "./sidebar-links";
import { signOut } from "@/modules/auth/actions";
import type { ProjectDTO } from "@/db/schemas/domain";

export function DashboardShell({
  user,
  projects,
  currentProject,
  newLeadsCount,
  children,
}: {
  user: User;
  projects: ProjectDTO[];
  currentProject: ProjectDTO;
  newLeadsCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#FAFAF8",
      }}
    >
      <aside
        style={{
          width: 220,
          background: "#F7F7F5",
          borderRight: "1px solid #F0F0EE",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* Logo + project name */}
        <div
          style={{
            padding: "16px 14px 14px",
            borderBottom: "1px solid #F0F0EE",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Logo size={22} />
            <Wordmark size={14} />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1C1C1E",
              padding: "7px 10px",
              background: "#FFF",
              borderRadius: 8,
              border: "1px solid #F0F0EE",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentProject.name}
          </div>
        </div>

        {/* Nav */}
        <SidebarLinks
          projects={projects}
          currentProjectId={currentProject.id}
          newLeadsCount={newLeadsCount}
        />

        {/* Footer */}
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid #F0F0EE",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#AEAEB2",
              marginBottom: 7,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                fontSize: 12,
                color: "#6B6B6E",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

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
