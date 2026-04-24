"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function SidebarLinks({
  currentProjectId,
  newLeadsCount = 0,
  newSearchboxCount = 0,
}: {
  currentProjectId: string;
  newLeadsCount?: number;
  newSearchboxCount?: number;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const inArchive = pathname.startsWith("/archive");
  const [archiveOpen, setArchiveOpen] = useState(inArchive);

  const INBOUND_NAV = [
    { href: "/dashboard",     label: t("searchbox"),  icon: InboxIcon,  badge: newSearchboxCount },
    { href: "/opportunities", label: t("new"),         icon: FlashIcon,  badge: newLeadsCount     },
    { href: "/mentions",      label: t("mentions"),    icon: SignalIcon,  badge: 0                },
    { href: "/analytics",     label: t("analytics"),   icon: ChartIcon,  badge: 0                },
  ];

  const OUTBOUND_NAV = [
    { href: "/outbound/crm",  label: "Lead CRM",       icon: CrmIcon,    badge: 0                },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/leads/");
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  };

  const isOpen = archiveOpen || inArchive;

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
      {/* ── INBOUND ── */}
      <GroupLabel>Inbound</GroupLabel>

      {INBOUND_NAV.map((item) => {
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
            {item.badge > 0 && (
              <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, lineHeight: 1.4 }}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Archive sub-group */}
      <button
        type="button"
        onClick={() => setArchiveOpen((v) => !v)}
        className="sidebar-link"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          fontWeight: inArchive ? 700 : 500,
          color: inArchive ? "#1C1C1E" : "#6B6B6E",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <ArchiveIcon className="sidebar-icon" />
        <span style={{ flex: 1 }}>Archivo</span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <>
          <Link
            href={`/archive/replied?projectId=${currentProjectId}`}
            className="sidebar-link"
            style={{
              paddingLeft: 34,
              fontWeight: pathname === "/archive/replied" ? 700 : 500,
              color: pathname === "/archive/replied" ? "#1C1C1E" : "#6B6B6E",
              background: pathname === "/archive/replied" ? "#EAEAE8" : "transparent",
              fontSize: 13,
            }}
          >
            Respondidos
          </Link>
          <Link
            href={`/archive/rejected?projectId=${currentProjectId}`}
            className="sidebar-link"
            style={{
              paddingLeft: 34,
              fontWeight: pathname === "/archive/rejected" ? 700 : 500,
              color: pathname === "/archive/rejected" ? "#1C1C1E" : "#6B6B6E",
              background: pathname === "/archive/rejected" ? "#EAEAE8" : "transparent",
              fontSize: 13,
            }}
          >
            Rechazados
          </Link>
        </>
      )}

      {/* ── OUTBOUND ── */}
      <GroupLabel style={{ marginTop: 10 }}>Outbound</GroupLabel>

      {OUTBOUND_NAV.map((item) => {
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
          </Link>
        );
      })}

      {/* ── Settings (global) ── */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Link
          href={`/settings?projectId=${currentProjectId}`}
          className="sidebar-link"
          style={{
            fontWeight: isActive("/settings") ? 700 : 500,
            color: isActive("/settings") ? "#1C1C1E" : "#6B6B6E",
            background: isActive("/settings") ? "#EAEAE8" : "transparent",
          }}
        >
          <GearIcon className="sidebar-icon" />
          <span style={{ flex: 1 }}>{t("settings")}</span>
        </Link>
      </div>
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

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v.5A2.75 2.75 0 0 1 18.25 10H5.75A2.75 2.75 0 0 1 3 7.25v-.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10v7.25A2.75 2.75 0 0 0 7.75 20h8.5A2.75 2.75 0 0 0 19 17.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transition: "transform 160ms ease", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GroupLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: 9,
      fontWeight: 800,
      color: "#AEAEB2",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      padding: "6px 8px 2px",
      ...style,
    }}>
      {children}
    </p>
  );
}
