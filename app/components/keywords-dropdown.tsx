"use client";

import { useEffect, useRef, useState } from "react";

export function KeywordsDropdown({ keywords }: { keywords: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!keywords?.length) return null;

  const label =
    keywords.length === 1
      ? keywords[0]
      : `${keywords[0]} +${keywords.length - 1}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-reject"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <TagIcon />
        {label}
      </button>

      {open && (
        <div className="kw-dropdown-panel">
          {keywords.map((kw) => (
            <span key={kw} className="kw-tag">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function TagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1h6l7 7-6 6-7-7V1z" />
      <circle cx="4.5" cy="4.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
