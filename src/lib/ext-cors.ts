const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

export function buildExtCorsHeaders(origin: string | null) {
  if (!origin || !isAllowedExtOrigin(origin)) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": CORS_HEADERS["Access-Control-Allow-Methods"],
    "Access-Control-Allow-Headers": CORS_HEADERS["Access-Control-Allow-Headers"],
    "Access-Control-Max-Age": CORS_HEADERS["Access-Control-Max-Age"],
    Vary: "Origin",
  };
}

export function isAllowedExtOrigin(origin: string) {
  if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) {
    return true;
  }

  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return (
      url.hostname === "localhost"
      || url.hostname === "127.0.0.1"
      || url.hostname === "prowlit.com"
      || url.hostname.endsWith(".prowlit.com")
    );
  } catch {
    return false;
  }
}
