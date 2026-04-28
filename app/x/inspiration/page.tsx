import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "Inspiration" };

const FILTER_TYPES = ["All", "Product", "Trending", "Media", "Viral"] as const;

export default async function XInspirationPage({ searchParams }: { searchParams?: Promise<{ projectId?: string; filter?: string }> }) {
  const user = await requireUser("/x/inspiration");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · Inspiration</p>
            <h1 className="page-title">Today&apos;s Suggestions</h1>
            <p className="page-copy">Custom-generated posts tailored to your profile. Use as inspiration or post directly.</p>
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {FILTER_TYPES.map((f) => (
              <span
                key={f}
                className={`filter-pill${f === "All" ? " filter-pill-active" : ""}`}
              >
                {f}
              </span>
            ))}
          </div>

          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>✨</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Coming soon</p>
            <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto" }}>
              Daily post ideas generated in your voice — combining your writing style with what&apos;s trending in your niche. Set up your context profile to get started.
            </p>
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}
