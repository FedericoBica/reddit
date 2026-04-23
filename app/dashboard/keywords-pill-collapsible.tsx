"use client";

export function KeywordsPillCollapsible({ keywords }: { keywords: string[] }) {
  const first = keywords[0];
  const rest = keywords.length - 1;

  return (
    <details style={{ display: "inline-block" }} onClick={(e) => e.preventDefault()}>
      <summary
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 800,
          background: "#F5F5F3",
          color: "#6B6B6E",
          cursor: "pointer",
          listStyle: "none",
        }}
      >
        {first}
        {rest > 0 && (
          <span
            style={{
              background: "#E07000",
              color: "#FFF",
              borderRadius: 4,
              padding: "0 4px",
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            +{rest}
          </span>
        )}
      </summary>
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          marginTop: 4,
          background: "#FFF",
          border: "1px solid #EEEEED",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 180,
        }}
      >
        {keywords.map((kw) => (
          <span key={kw} style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1E" }}>
            {kw}
          </span>
        ))}
      </div>
    </details>
  );
}
