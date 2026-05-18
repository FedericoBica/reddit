import type { Metadata } from "next";
import { updatePassword } from "@/modules/auth/actions";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

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
          Recuperación
        </div>
        <h1 className="login-form-title">Nueva contraseña</h1>
        <p className="login-form-sub">Elegí una contraseña nueva para tu cuenta.</p>

        {params?.error && (
          <div className="login-error-banner">{params.error}</div>
        )}

        <form action={updatePassword} style={{ display: "grid", gap: 12 }}>
          <div className="login-field">
            <label className="login-field-label" htmlFor="password">
              Nueva contraseña
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><LockIcon /></span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Al menos 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          <button className="login-btn-submit" type="submit">
            Guardar contraseña
            <span className="login-arrow">→</span>
          </button>
        </form>

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

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
