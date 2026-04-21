"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <Button
      onClick={handleCopy}
      className="h-9 rounded-[8px] px-4 font-extrabold"
      style={{ background: copied ? "#059669" : undefined }}
      type="button"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7L5.5 10L11.5 4"
              stroke="#FFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ¡Copiado!
        </>
      ) : permalink ? (
        "Copiar y abrir Reddit →"
      ) : (
        "Copiar"
      )}
    </Button>
  );
}
