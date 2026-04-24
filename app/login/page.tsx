import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  signInWithGoogle,
  signInWithMagicLink,
  verifyLoginCode,
} from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/server";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    email?: string;
    error?: string;
    sent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations("auth"),
  ]);
  const params = await searchParams;
  const next = sanitizeNext(params?.next);
  const email = String(params?.email ?? "").trim().toLowerCase();
  const isCodeStep = params?.sent === "1" && email.length > 0;

  if (user) {
    redirect(next);
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="ReddProwl">
        <BrandLink logoSize={30} wordmarkSize={20} />

        <div style={{ maxWidth: 660 }}>
          <span className="eyebrow">Reddit leads on autopilot</span>
          <h1
            style={{
              fontSize: "clamp(42px, 7vw, 76px)",
              lineHeight: 0.96,
              letterSpacing: "-0.055em",
              fontWeight: 900,
              marginTop: 24,
              maxWidth: 720,
            }}
          >
            Find customers where they&apos;re already asking for your product.
          </h1>
          <p className="page-copy" style={{ fontSize: 18, marginTop: 24 }}>
            ReddProwl detects buying intent, prioritizes opportunities and helps
            you reply without sounding like spam.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            maxWidth: 700,
          }}
        >
          {[
            ["92%", "expected relevance"],
            ["60s", "first setup"],
            ["3x", "faster than manual"],
          ].map(([value, label]) => (
            <div className="metric" key={label}>
              <div className="metric-value">{value}</div>
              <div className="metric-note">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <p className="page-kicker">{t("kicker")}</p>
          <h2 className="page-title" style={{ fontSize: 38 }}>
            {t("title")}
          </h2>

          {params?.sent === "1" && (
            <Card className="mt-[22px] gap-0 rounded-[8px] border-[#D1FAE5] bg-[#F0FDF4] py-0 text-[#065F46] shadow-none ring-0">
              <CardContent className="p-5 text-sm leading-6">
                {t("checkEmail")}
              </CardContent>
            </Card>
          )}

          {params?.error && (
            <Card className="mt-[22px] gap-0 rounded-[8px] border-[#FEE2E2] bg-[#FEF2F2] py-0 text-[#991B1B] shadow-none ring-0">
              <CardContent className="p-5 text-sm leading-6">{params.error}</CardContent>
            </Card>
          )}

          {isCodeStep ? (
            <form action={verifyLoginCode} style={{ display: "grid", gap: 18, marginTop: 26 }}>
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="next" value={next} />
              <label className="field-group">
                <span className="field-label">Access code</span>
                <Input
                  className="h-11 rounded-[8px] bg-white px-3 text-sm"
                  name="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                />
                <span className="field-hint">
                  Local Mailpit: http://127.0.0.1:54324
                </span>
              </label>
              <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                Enter dashboard
                <ArrowRightIcon />
              </Button>
            </form>
          ) : (
            <>
              <form action={signInWithGoogle} style={{ display: "grid", gap: 18, marginTop: 26 }}>
                <input type="hidden" name="next" value={next} />
                <Button
                  className="h-11 rounded-[8px] border-[#E5E5EA] bg-white font-extrabold text-[#1C1C1E] hover:bg-[#F7F7F5]"
                  type="submit"
                  variant="outline"
                >
                  <GoogleIcon />
                  {t("signInWithGoogle")}
                </Button>
              </form>

              <div className="signup-auth-divider">
                <span>{t("orContinueWith")}</span>
              </div>

              <form action={signInWithMagicLink} style={{ display: "grid", gap: 18, marginTop: 22 }}>
                <input type="hidden" name="next" value={next} />
                <label className="field-group">
                  <span className="field-label">{t("emailLabel")}</span>
                  <Input
                    className="h-11 rounded-[8px] bg-white px-3 text-sm"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                  {t("submit")}
                  <ArrowRightIcon />
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function sanitizeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.44z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.33l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.11H3.08v2.59A10 10 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.41 14a6 6 0 0 1 0-3.82V7.59H3.08a10 10 0 0 0 0 8.82L6.41 14z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a10 10 0 0 0-8.92 5.59l3.33 2.59C7.2 7.73 9.4 5.98 12 5.98z"
        fill="#EA4335"
      />
    </svg>
  );
}
