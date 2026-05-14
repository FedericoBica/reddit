import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { detectLocale, normalizeLocale } from "@/i18n/request";
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
    locale?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = sanitizeNext(params?.next);
  const locale = normalizeLocale(params?.locale) ?? await detectLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const auth = messages.auth as {
    kicker: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signInWithGoogle: string;
    orContinueWithEmail: string;
    signInWithPassword: string;
    termsPrefix: string;
    terms: string;
    privacy: string;
    noAccount: string;
    startFree: string;
  };
  const authHref = `/login?locale=${locale}`;
  const signupHref = `/signup?locale=${locale}`;

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
          {auth.kicker}
        </div>
        <h1 className="login-form-title">
          {auth.title.replace("Prowlit", "").trim()} <em>Prowlit</em>
        </h1>
        <p className="login-form-sub">
          {auth.subtitle}
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
            {auth.signInWithGoogle}
          </button>
        </form>

        <div className="login-divider">{auth.orContinueWithEmail}</div>

        {/* Email + password */}
        <form action={signInWithPassword} style={{ display: "grid", gap: 12 }}>
          <input type="hidden" name="next" value={next} />

          <div className="login-field">
            <label className="login-field-label" htmlFor="email">
              {auth.emailLabel}
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><MailIcon /></span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={auth.emailPlaceholder}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field" style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <label className="login-field-label" htmlFor="password" style={{ marginBottom: 0 }}>
                {auth.passwordLabel}
              </label>
              <a
                href={authHref}
                style={{
                  fontSize: 12.5,
                  color: "var(--li-ink-3)",
                  textDecoration: "underline",
                  textDecorationColor: "var(--li-line)",
                  textUnderlineOffset: 3,
                }}
              >
                {auth.forgotPassword}
              </a>
            </div>
            <div className="login-input-wrap">
              <span className="login-input-icon"><LockIcon /></span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={auth.passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button className="login-btn-submit" type="submit">
            {auth.signInWithPassword}
            <span className="login-arrow">→</span>
          </button>
        </form>

        {/* Fine print */}
        <p className="login-fine">
          {auth.termsPrefix}{" "}
          <Link href="/terms">{auth.terms}</Link> y{" "}
          <Link href="/privacy">{auth.privacy}</Link>.
        </p>

        {/* Sign-up link */}
        <p className="login-fine" style={{ marginTop: 10 }}>
          {auth.noAccount}{" "}
          <Link href={signupHref} style={{ color: "var(--li-ink)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--li-line)" }}>
            {auth.startFree} →
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
