import Link from "next/link";
import type { CSSProperties } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M40 12 C52 22, 58 35, 58 48"
        stroke="#E07000"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
      />
      <path
        d="M40 12 C60 26, 68 42, 66 58"
        stroke="#E07000"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.08"
      />
      <path
        d="M40 12 C48 18, 52 28, 52 40"
        stroke="#E07000"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M40 16 L54 36 L46 36 L46 62 L34 62 L34 36 L26 36 Z"
        fill="#E07000"
      />
      <circle cx="56" cy="30" r="3" fill="#E07000" opacity="0.7" />
    </svg>
  );
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", lineHeight: 1 }}>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          color: "#1C1C1E",
          letterSpacing: "-0.03em",
        }}
      >
        Redd
      </span>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          color: "#E07000",
          letterSpacing: "-0.03em",
        }}
      >
        Prowl
      </span>
    </span>
  );
}

export function BrandLink({
  href = "/dashboard",
  logoSize = 28,
  wordmarkSize = 18,
  style,
  className,
}: {
  href?: string;
  logoSize?: number;
  wordmarkSize?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Ir al dashboard"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: "inherit",
        textDecoration: "none",
        ...style,
      }}
    >
      <Logo size={logoSize} />
      <Wordmark size={wordmarkSize} />
    </Link>
  );
}
