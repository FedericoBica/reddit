import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Prowlit — Find Buyers on Reddit & X";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#1A1A1B",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#FF4500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <span style={{ color: "#fff", fontSize: 36, fontWeight: 900 }}>R</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 24,
          }}
        >
          Find Buyers
          <br />
          <span style={{ color: "#FF4500" }}>on Reddit & X</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 28,
            color: "#9B9BA2",
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: 800,
          }}
        >
          Score buyer intent. Draft human replies. Ship in 2 minutes.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 100,
            right: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#FF4500", fontSize: 22, fontWeight: 800 }}>Prowlit</span>
          <span style={{ color: "#4A4A4F", fontSize: 18 }}>prowlit.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
