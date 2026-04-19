import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listAdminUsers } from "@/db/queries/admin";
import { updateUserBillingPlan } from "@/modules/admin/actions";
import { parseBillingPlan } from "@/modules/billing/limits";

export const metadata: Metadata = { title: "Admin — Usuarios" };

const PLAN_LABELS: Record<string, string> = {
  startup: "Startup",
  growth: "Growth",
  professional: "Professional",
};

const PLAN_COLORS: Record<string, string> = {
  startup: "#6B6B6E",
  growth: "#2563EB",
  professional: "#E07000",
};

export default async function AdminUsersPage() {
  const [users, t] = await Promise.all([
    listAdminUsers(),
    getTranslations("admin.users"),
  ]);

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">{t("kicker")}</p>
        <h1 className="page-title">Users ({users.length})</h1>
      </header>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #F0F0EE",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0F0EE", background: "#FAFAF8" }}>
                {[t("email"), t("plan"), t("projects"), t("leads"), t("registered"), t("changePlan")].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8E8E93",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const billingPlan = parseBillingPlan(user.billing_plan) ?? "startup";

                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: i < users.length - 1 ? "1px solid #F5F5F3" : "none" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>
                        {user.email}
                      </div>
                      {user.full_name && (
                        <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
                          {user.full_name}
                        </div>
                      )}
                      {user.is_admin && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#fff",
                            background: "#E07000",
                            padding: "1px 5px",
                            borderRadius: 3,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            marginTop: 4,
                            display: "inline-block",
                          }}
                        >
                          admin
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: PLAN_COLORS[billingPlan] ?? "#6B6B6E",
                        }}
                      >
                        {PLAN_LABELS[billingPlan] ?? billingPlan}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#1C1C1E", fontWeight: 600 }}>
                      {user.projects_count}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#1C1C1E", fontWeight: 600 }}>
                      {user.leads_count}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#8E8E93" }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <form action={updateUserBillingPlan} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="plan"
                          defaultValue={billingPlan}
                          style={{
                            fontSize: 12,
                            border: "1px solid #E5E5E3",
                            borderRadius: 6,
                            padding: "4px 8px",
                            background: "#fff",
                            color: "#1C1C1E",
                            cursor: "pointer",
                          }}
                        >
                          <option value="startup">Startup</option>
                          <option value="growth">Growth</option>
                          <option value="professional">Professional</option>
                        </select>
                        <button
                          type="submit"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: "#1C1C1E",
                            border: "none",
                            borderRadius: 6,
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          {t("save")}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <p style={{ padding: 24, fontSize: 13, color: "#8E8E93", textAlign: "center" }}>
              {t("noUsers")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
