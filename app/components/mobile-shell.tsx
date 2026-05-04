"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function MobileShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <div className="ds-shell">
      {open && (
        <div className="ds-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`ds-sidebar${open ? " is-open" : ""}`}>
        <button
          className="ds-sidebar-close"
          onClick={() => setOpen(false)}
          aria-label={t("closeMenu")}
        >
          ✕
        </button>
        {sidebar}
      </aside>

      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <div className="ds-mobile-topbar">
          <button
            className="ds-hamburger"
            onClick={() => setOpen(true)}
            aria-label={t("openMenu")}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
