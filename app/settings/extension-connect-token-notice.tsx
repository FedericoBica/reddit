"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

const COPY = {
  en: {
    title: "Connect token generated — copy it now, it won't be shown again.",
    description: "Expires in 15 minutes. Paste it in the Chrome Extension to connect.",
  },
  es: {
    title: "Token de conexión generado: copialo ahora, no se volverá a mostrar.",
    description: "Expira en 15 minutos. Pegalo en la extensión de Chrome para conectar.",
  },
  pt: {
    title: "Token de conexão gerado: copie agora, ele não será exibido novamente.",
    description: "Expira em 15 minutos. Cole na extensão do Chrome para conectar.",
  },
} as const;

export function ExtensionConnectTokenNotice() {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const locale = useLocale();
  const copy = COPY[(locale.startsWith("es") ? "es" : locale.startsWith("pt") ? "pt" : "en") as keyof typeof COPY];

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
        {copy.title}
      </p>
      <p style={{ fontSize: 11, color: "#7C7C83", marginBottom: 10 }}>
        {copy.description}
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
