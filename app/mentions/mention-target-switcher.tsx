"use client";

import Link from "next/link";
import { useState } from "react";

export type MentionTargetOption = {
  id: string;
  label: string;
  description: string;
  href: string;
  active: boolean;
};

export function MentionTargetSwitcher({
  options,
}: {
  options: MentionTargetOption[];
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((option) => option.active) ?? options[0];

  return (
    <div style={{ position: "relative", minWidth: 240 }}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        type="button"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 11px",
          border: "1px solid #EEEEED",
          borderRadius: 8,
          background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          color: "#1A1A1B",
          fontSize: 13,
          fontWeight: 800,
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: active.id === "company" ? "#FF4500" : "#1A1A1B",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {active.label}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "#FFFFFF",
            border: "1px solid #EEEEED",
            borderRadius: 8,
            boxShadow: "0 16px 42px rgba(0,0,0,0.12)",
            padding: 6,
          }}
        >
          {options.map((option) => (
            <Link
              className="project-menu-item"
              href={option.href}
              key={option.id}
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{
                display: "grid",
                gap: 2,
                padding: "8px 9px",
                borderRadius: 7,
                textDecoration: "none",
                background: option.active ? "#FFF3EC" : "transparent",
              }}
            >
              <span
                style={{
                  color: option.active ? "#1A1A1B" : "#7C7C83",
                  fontSize: 12,
                  fontWeight: option.active ? 800 : 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {option.label}
              </span>
              <span style={{ color: "#7C7C83", fontSize: 11, lineHeight: 1.35 }}>
                {option.description}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}
      viewBox="0 0 14 14"
      width="14"
    >
      <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="#7C7C83" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}
