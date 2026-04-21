"use client";

import { useState } from "react";

type Comment = {
  id: string;
  author: string;
  body: string;
  score: number;
};

export function RedditComments({ permalink }: { permalink: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reddit-comments?permalink=${encodeURIComponent(permalink)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar comentarios");
      setComments(data.comments);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) {
    return (
      <button
        type="button"
        onClick={load}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          fontSize: 12,
          fontWeight: 700,
          color: loading ? "#AEAEB2" : "#6B6B6E",
          background: "none",
          border: "1px solid #E5E5EA",
          borderRadius: 7,
          padding: "6px 12px",
          cursor: loading ? "default" : "pointer",
          transition: "border-color 120ms ease, color 120ms ease",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? "Cargando comentarios…" : "Fetch Comments"}
      </button>
    );
  }

  if (error) {
    return (
      <p style={{ marginTop: 12, fontSize: 12, color: "#991B1B", fontWeight: 600 }}>
        {error}
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p style={{ marginTop: 12, fontSize: 12, color: "#AEAEB2", fontWeight: 600 }}>
        Sin comentarios disponibles.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        Top Comments
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "#F5F5F3",
              border: "1px solid #EBEBEA",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6E" }}>u/{c.author}</span>
              <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>▲ {c.score}</span>
            </div>
            <p style={{ fontSize: 12, color: "#1C1C1E", lineHeight: 1.55, margin: 0 }}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
