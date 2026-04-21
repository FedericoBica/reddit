"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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

  const NAV = [
    { href: "/dashboard",     label: t("searchbox"),  icon: InboxIcon    },
    { href: "/opportunities", label: t("new"),         icon: FlashIcon    },
    { href: "/mentions",      label: t("mentions"),    icon: SignalIcon   },
    { href: "/analytics",     label: t("analytics"),   icon: ChartIcon    },
    { href: "/settings",      label: t("settings"),    icon: GearIcon     },
  ];

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
            {item.href === "/dashboard" && newSearchboxCount > 0 && (
              <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, lineHeight: 1.4 }}>
                {newSearchboxCount}
              </span>
            )}
            {item.href === "/opportunities" && newLeadsCount > 0 && (
              <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, lineHeight: 1.4 }}>
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
