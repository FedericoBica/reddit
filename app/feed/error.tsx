"use client";

import { useEffect } from "react";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[feed] page error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 400,
        gap: 16,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#FFF0EE",
          border: "1.5px solid #FFCDC7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        ⚠
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", margin: "0 0 6px" }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, color: "#7C7C83", margin: 0, maxWidth: 340 }}>
          We couldn&apos;t load your feed. This is usually a temporary issue.
        </p>
      </div>
      <button
        onClick={reset}
        style={{
          padding: "9px 20px",
          borderRadius: 8,
          border: "1.5px solid #DAE0E6",
          background: "#fff",
          fontSize: 13,
          fontWeight: 700,
          color: "#1A1A1B",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
