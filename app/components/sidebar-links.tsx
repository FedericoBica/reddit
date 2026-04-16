"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",     label: "Searchbox",      icon: InboxIcon       },
  { href: "/opportunities", label: "New",             icon: FlashIcon       },
  { href: "/threads",       label: "Threads",         icon: ThreadsIcon     },
  { href: "/mentions",      label: "Mentions",        icon: SignalIcon      },
  { href: "/analytics",     label: "Analytics",       icon: ChartIcon       },
  { href: "/content-lab",   label: "Content Lab",     icon: BeakerIcon      },
  { href: "/calendar",      label: "Calendar",        icon: CalendarIcon    },
  { href: "/settings",      label: "Settings",        icon: GearIcon        },
];

export function SidebarLinks({
  currentProjectId,
  newLeadsCount = 0,
}: {
  currentProjectId: string;
  newLeadsCount?: number;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/leads/");
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  };

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
      {NAV.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={`${item.href}?projectId=${currentProjectId}`}
            className="sidebar-link"
            style={{
              fontWeight: active ? 700 : 500,
              color: active ? "#1C1C1E" : "#6B6B6E",
              background: active ? "#EAEAE8" : "transparent",
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

function PipelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="4" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="10" y="8" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3v8.5L4.5 18A2 2 0 0 0 6.32 21h11.36a2 2 0 0 0 1.82-3L15 11.5V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 16.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
