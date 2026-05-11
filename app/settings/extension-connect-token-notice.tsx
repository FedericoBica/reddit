"use client";

import { useEffect, useState } from "react";

export function ExtensionConnectTokenNotice() {
  const [connectToken, setConnectToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("connectToken");

    if (!token) {
      return;
    }

    setConnectToken(token);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  if (!connectToken) {
    return null;
  }

  return (
    <div style={{
      background: "#F0FAF4",
      border: "1px solid #BBF1CE",
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#46A758", marginBottom: 6 }}>
        Connect token generated — copy it now, it won&apos;t be shown again.
      </p>
      <p style={{ fontSize: 11, color: "#7C7C83", marginBottom: 10 }}>
        Expires in 15 minutes. Paste it in the Chrome Extension to connect.
      </p>
      <code style={{
        display: "block",
        background: "#FFFFFF",
        border: "1px solid #D1FAE5",
        borderRadius: 7,
        padding: "10px 12px",
        fontSize: 12,
        fontFamily: "monospace",
        color: "#1A1A1B",
        wordBreak: "break-all",
        userSelect: "all",
      }}>
        {connectToken}
      </code>
    </div>
  );
}
