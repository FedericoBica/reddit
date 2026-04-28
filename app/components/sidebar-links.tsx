"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function SidebarLinks({
  currentProjectId,
  newLeadsCount = 0,
  newSearchboxCount = 0,
  xEnabled = false,
}: {
  currentProjectId: string;
  newLeadsCount?: number;
  newSearchboxCount?: number;
  xEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [archiveOpen, setArchiveOpen] = useState(
    pathname.startsWith("/archive"),
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/leads/");
    if (href === "/feed") return pathname === "/feed" || pathname === "/opportunities" || pathname === "/mentions";
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  };

  const REDDIT_NAV = [
    { href: "/dashboard",  label: "Search Box", icon: InboxIcon,  badge: newSearchboxCount },
    { href: "/feed",       label: "Leads",      icon: FlashIcon,  badge: newLeadsCount     },
    { href: "/analytics",  label: "Analytics",  icon: ChartIcon,  badge: 0                 },
  ];

  const X_NAV = [
    { href: "/x/queue",        label: "My Queue",       icon: QueueIcon },
    { href: "/x/inspiration",  label: "Inspiration",    icon: SparkIcon },
    { href: "/x/studio",       label: "Content Studio", icon: PenIcon   },
    { href: "/x/engage",       label: "Engage",         icon: EngageIcon },
    { href: "/x/context",      label: "My Context",     icon: ProfileIcon },
  ];

  const inArchive = pathname.startsWith("/archive");
  const archiveIsOpen = archiveOpen || inArchive;

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
      {/* ── REDDIT ── */}
      <GroupLabel>Reddit</GroupLabel>

      {REDDIT_NAV.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={`${item.href}?projectId=${currentProjectId}`}
            className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
          >
            <Icon className="sidebar-icon" />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span className="ds-nav-badge">{item.badge}</span>
            )}
          </Link>
        );
      })}

      {/* Archive sub-group */}
      <button
        type="button"
        onClick={() => setArchiveOpen((v) => !v)}
        className={`sidebar-link${inArchive ? " sidebar-link-active" : ""}`}
        style={{ width: "100%", background: inArchive ? undefined : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <ArchiveIcon className="sidebar-icon" />
        <span style={{ flex: 1 }}>Archive</span>
        <ChevronIcon open={archiveIsOpen} />
      </button>

      {archiveIsOpen && (
        <>
          <Link
            href={`/archive/replied?projectId=${currentProjectId}`}
            className={`sidebar-link${pathname === "/archive/replied" ? " sidebar-link-active" : ""}`}
            style={{ paddingLeft: 32 }}
          >
            Replied
          </Link>
          <Link
            href={`/archive/rejected?projectId=${currentProjectId}`}
            className={`sidebar-link${pathname === "/archive/rejected" ? " sidebar-link-active" : ""}`}
            style={{ paddingLeft: 32 }}
          >
            Dismissed
          </Link>
        </>
      )}

      {/* ── X ── */}
      {xEnabled && (
        <>
          <GroupLabel style={{ marginTop: 10 }}>X</GroupLabel>
          {X_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${item.href}?projectId=${currentProjectId}`}
                className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
              >
                <Icon className="sidebar-icon" />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            );
          })}
        </>
      )}

      {/* ── Settings ── */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Link
          href={`/settings?projectId=${currentProjectId}`}
          className={`sidebar-link${isActive("/settings") ? " sidebar-link-active" : ""}`}
        >
          <GearIcon className="sidebar-icon" />
          <span style={{ flex: 1 }}>Settings</span>
        </Link>
      </div>
    </nav>
  );
}

function GroupLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p className="ds-nav-group" style={style}>{children}</p>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transition: "transform 160ms ease", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v.5A2.75 2.75 0 0 1 18.25 10H5.75A2.75 2.75 0 0 1 3 7.25v-.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10v7.25A2.75 2.75 0 0 0 7.75 20h8.5A2.75 2.75 0 0 0 19 17.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EngageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
