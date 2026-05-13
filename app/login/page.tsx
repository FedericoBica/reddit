import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  signInWithGoogle,
  signInWithPassword,
} from "@/modules/auth/actions";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";
import { getCurrentUser } from "@/modules/auth/server";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = sanitizeNext(params?.next);

  if (user) redirect(await resolvePostAuthPath(next));

  return (
    <div className="login-shell">
      <div className="login-form-wrap">

        {/* Brand */}
        <a href="/" className="login-brand" style={{ marginBottom: 32 }}>
          <span className="login-brand-mark">
            <BrandIcon />
          </span>
          <span style={{ color: "var(--li-ink)", fontWeight: 700 }}>Prowlit</span>
        </a>

        {/* Title */}
        <div className="login-form-eyebrow">
          <span className="login-form-eyebrow-dot" />
          Login
        </div>
        <h1 className="login-form-title">
          Ingresá a <em>Prowlit</em>
        </h1>
        <p className="login-form-sub">
          Usá tu cuenta de Google o tu email y contraseña.
        </p>

        {/* Error */}
        {params?.error && (
          <div className="login-error-banner">{params.error}</div>
        )}

        {/* Google */}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button className="login-btn-google" type="submit">
            <GoogleIcon />
            Continuar con Google
          </button>
        </form>

        <div className="login-divider">o con tu email</div>

        {/* Email + password */}
        <form action={signInWithPassword} style={{ display: "grid", gap: 12 }}>
          <input type="hidden" name="next" value={next} />

          <div className="login-field">
            <label className="login-field-label" htmlFor="email">
              Email
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><MailIcon /></span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="vos@empresa.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field" style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <label className="login-field-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Contraseña
              </label>
              <a
                href="#"
                style={{
                  fontSize: 12.5,
                  color: "var(--li-ink-3)",
                  textDecoration: "underline",
                  textDecorationColor: "var(--li-line)",
                  textUnderlineOffset: 3,
                }}
              >
                ¿La olvidaste?
              </a>
            </div>
            <div className="login-input-wrap">
              <span className="login-input-icon"><LockIcon /></span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button className="login-btn-submit" type="submit">
            Ingresar
            <span className="login-arrow">→</span>
          </button>
        </form>

        {/* Fine print */}
        <p className="login-fine">
          Al continuar aceptás los{" "}
          <Link href="/privacy">Términos</Link> y la{" "}
          <Link href="/privacy">Política de privacidad</Link>.
        </p>

        {/* Sign-up link */}
        <p className="login-fine" style={{ marginTop: 10 }}>
          ¿Sin cuenta?{" "}
          <Link href="/signup" style={{ color: "var(--li-ink)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--li-line)" }}>
            Empezá gratis →
          </Link>
        </p>

      </div>
    </div>
  );
}

function sanitizeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function BrandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="8" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="17" height="17" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
