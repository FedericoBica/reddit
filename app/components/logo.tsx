import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/icono-colors.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: "contain",
        display: "block",
      }}
    />
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
        Red
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
