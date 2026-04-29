import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { XScheduledPostDTO } from "@/db/schemas/domain";
import { QueueList } from "./queue-list";

export const metadata: Metadata = { title: "My Queue" };

async function listScheduledPosts(projectId: string): Promise<XScheduledPostDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("x_scheduled_posts")
    .select("id, project_id, created_by, connected_account_id, content, scheduled_for, status, published_at, x_tweet_id, error, source, created_at, updated_at")
    .eq("project_id", projectId)
    .not("status", "eq", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as XScheduledPostDTO[]) ?? [];
}

export default async function XQueuePage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  const user = await requireUser("/x/queue");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const posts = await listScheduledPosts(currentProject.id);

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · My Queue</p>
            <h1 className="page-title">Posts Queue</h1>
            <p className="page-copy">Schedule posts to publish automatically at the day and time you choose.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href="/x/studio"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#FF4500",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              + New post
            </a>
          </div>
        </header>
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 60px" }}>
          <QueueList posts={posts} projectId={currentProject.id} />
        </main>
      </div>
    </DashboardShell>
  );
}
