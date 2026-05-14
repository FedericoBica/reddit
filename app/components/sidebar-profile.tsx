"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function SidebarProfile({
  email,
  isAdmin,
  planLabel,
  onSignOut,
  signOutLabel,
  settingsLabel,
  adminLabel,
}: {
  email: string;
  isAdmin: boolean;
  planLabel: string;
  onSignOut: () => void;
  signOutLabel: string;
  settingsLabel: string;
  adminLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const initial = (email?.[0] ?? "?").toUpperCase();
  const shortEmail =
    email.length > 22 ? `${email.slice(0, 10)}…${email.slice(email.lastIndexOf("@"))}` : email;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Panel */}
      {open && (
        <div className="sp-panel">
          {/* Header */}
          <div className="sp-panel-header">
            <div className="sp-avatar sp-avatar-lg">{initial}</div>
            <div style={{ minWidth: 0 }}>
              <p className="sp-email-full">{email}</p>
              <span className="sp-plan-badge">{planLabel}</span>
            </div>
          </div>

          <div className="sp-divider" />

          {/* Actions */}
          <div className="sp-panel-actions">
            <Link
              href="/settings"
              className="sp-action-item"
              onClick={() => setOpen(false)}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6.5 1h3l.5 1.5a5 5 0 0 1 1.2.7l1.5-.4 1.5 2.6-1.1 1.1a5 5 0 0 1 0 1.2l1.1 1.1-1.5 2.6-1.5-.4a5 5 0 0 1-1.2.7L9.5 13h-3l-.5-1.5A5 5 0 0 1 4.8 11l-1.5.4-1.5-2.6L2.9 7.7a5 5 0 0 1 0-1.2L1.8 5.3l1.5-2.6 1.5.4A5 5 0 0 1 6 2.5L6.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              {settingsLabel}
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="sp-action-item sp-action-admin"
                onClick={() => setOpen(false)}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1L2 5.6l4.2-.9L8 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
                {adminLabel}
              </Link>
            )}
          </div>

          <div className="sp-divider" />

          <form action={onSignOut} style={{ padding: "6px 10px 8px" }}>
            <button type="submit" className="sp-signout-btn">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {signOutLabel}
            </button>
          </form>
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        className={`sp-trigger${open ? " sp-trigger-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="sp-avatar">{initial}</div>
        <span className="sp-trigger-email">{shortEmail}</span>
        <svg
          className="sp-chevron"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M2 4l3-3 3 3M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
