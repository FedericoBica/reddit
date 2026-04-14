"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ProjectDTO } from "@/db/schemas/domain";

const NAV = [
  { href: "/dashboard", label: "Searchbox", icon: InboxIcon },
  { href: "/threads", label: "Threads", icon: ThreadsIcon, soon: true },
  { href: "/mentions", label: "Mentions", icon: SignalIcon, soon: true },
  { href: "/analytics", label: "Analytics", icon: ChartIcon, soon: true },
];

export function SidebarLinks({
  projects,
  currentProjectId,
  newLeadsCount = 0,
}: {
  projects: ProjectDTO[];
  currentProjectId: string;
  newLeadsCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isSearchboxActive =
    pathname === "/dashboard" || pathname.startsWith("/leads/");

  return (
    <nav
      style={{
        flex: 1,
        padding: "10px 8px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Project switcher — only shown when multiple projects */}
      {projects.length > 1 && (
        <select
          value={currentProjectId}
          onChange={(e) =>
            router.push(`/dashboard?projectId=${e.target.value}`)
          }
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #F0F0EE",
            background: "#FFF",
            fontSize: 12,
            fontWeight: 600,
            color: "#1C1C1E",
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {NAV.map((item) => {
        const isActive =
          item.href === "/dashboard" ? isSearchboxActive : false;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.soon ? "#" : item.href}
            className="sidebar-link"
            aria-disabled={item.soon}
            style={{
              fontWeight: isActive ? 700 : 500,
              color: item.soon ? "#AEAEB2" : isActive ? "#1C1C1E" : "#6B6B6E",
              background: isActive ? "#EAEAE8" : "transparent",
              pointerEvents: item.soon ? "none" : "auto",
            }}
          >
            <Icon className="sidebar-icon" />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.href === "/dashboard" && newLeadsCount > 0 && (
              <span
                style={{
                  background: "#E07000",
                  color: "#FFF",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 5,
                  lineHeight: 1.4,
                }}
              >
                {newLeadsCount}
              </span>
            )}
            {item.soon && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#AEAEB2",
                  background: "#F0F0EE",
                  padding: "2px 5px",
                  borderRadius: 4,
                }}
              >
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v12.5A2.75 2.75 0 0 1 17.25 21H6.75A2.75 2.75 0 0 1 4 18.25V5.75Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 13h4.1c.6 0 .9.35 1.15.88L10.2 15h3.6l.45-1.12c.25-.53.55-.88 1.15-.88h4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v3A3.5 3.5 0 0 1 15.5 14H12l-4 3v-3.1A3.5 3.5 0 0 1 5 10.5v-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19.5v-15M7.25 16.5a7 7 0 0 1 0-9M16.75 7.5a7 7 0 0 1 0 9M4.15 20a12 12 0 0 1 0-16M19.85 4a12 12 0 0 1 0 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.25h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 17V11M12 17V6M17.5 17v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
