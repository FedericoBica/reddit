import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo, Wordmark } from "@/app/components/logo";
import { requireAdmin } from "@/modules/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([
    requireAdmin(),
    getTranslations("admin.nav"),
  ]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FAFAF8" }}>
      <aside
        style={{
          width: 200,
          background: "#F7F7F5",
          borderRight: "1px solid #EEEEED",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "16px 14px 14px", borderBottom: "1px solid #EEEEED" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Logo size={22} />
            <Wordmark size={14} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#E07000", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Admin
          </span>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { href: "/admin",          label: t("stats")   },
            { href: "/admin/users",    label: t("users")   },
            { href: "/admin/scraping", label: t("scraping") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
              style={{ fontWeight: 500, color: "#6B6B6E" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: "1px solid #EEEEED", background: "#F2F2F0" }}>
          <p style={{ fontSize: 11, color: "#AEAEB2", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
          <Link href="/dashboard" style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textDecoration: "underline", textUnderlineOffset: 2 }}>
            {t("backToDashboard")}
          </Link>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
