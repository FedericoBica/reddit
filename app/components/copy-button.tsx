"use client";

import { useState } from "react";
import { toRedditUrl } from "@/lib/utils";

export function CopyButton({
  text,
  permalink,
}: {
  text: string;
  permalink?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (permalink) {
      window.open(toRedditUrl(permalink), "_blank");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`composer-btn composer-btn-accent${copied ? " composer-btn-copied" : ""}`}
      type="button"
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : permalink ? (
        "Copy & open Reddit ↗"
      ) : (
        "Copy"
      )}
    </button>
  );
}
