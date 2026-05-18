import type { Metadata } from "next";
import Link from "next/link";
import { detectLocale, normalizeLocale } from "@/i18n/request";
import { requestPasswordReset } from "@/modules/auth/actions";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

type Props = {
  searchParams?: Promise<{
    sent?: string;
    error?: string;
    locale?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.locale) ?? await detectLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = messages.forgotPassword as {
    kicker: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    sent: string;
    backToLogin: string;
  };
  const loginHref = `/login?locale=${locale}`;

  return (
    <div className="login-shell">
      <div className="login-form-wrap">

        <a href="/" className="login-brand" style={{ marginBottom: 32 }}>
          <span className="login-brand-mark">
            <BrandIcon />
          </span>
          <span style={{ color: "var(--li-ink)", fontWeight: 700 }}>Prowlit</span>
        </a>

        <div className="login-form-eyebrow">
          <span className="login-form-eyebrow-dot" />
          {t.kicker}
        </div>
        <h1 className="login-form-title">{t.title}</h1>
        <p className="login-form-sub">{t.subtitle}</p>

        {params?.error && (
          <div className="login-error-banner">{params.error}</div>
        )}

        {params?.sent ? (
          <div style={{ padding: "16px 18px", background: "var(--li-surface-2, #f5f5f5)", borderRadius: 10, fontSize: 14, lineHeight: 1.5, color: "var(--li-ink-2)" }}>
            {t.sent}
          </div>
        ) : (
          <form action={requestPasswordReset} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="locale" value={locale} />

            <div className="login-field">
              <label className="login-field-label" htmlFor="email">
                {t.emailLabel}
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><MailIcon /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button className="login-btn-submit" type="submit">
              {t.submit}
              <span className="login-arrow">→</span>
            </button>
          </form>
        )}

        <p className="login-fine" style={{ marginTop: 16 }}>
          <Link href={loginHref} style={{ color: "var(--li-ink)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--li-line)" }}>
            ← {t.backToLogin}
          </Link>
        </p>

      </div>
    </div>
  );
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
