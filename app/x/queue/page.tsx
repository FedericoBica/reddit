import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
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
  const locale = await getLocale();
  const copy = locale.startsWith("es")
    ? {
        kicker: "X · Mi cola",
        title: "Cola de posts",
        description: "Programá posts para publicarlos automáticamente el día y la hora que elijas.",
        newPost: "+ Nuevo post",
      }
    : locale.startsWith("pt")
    ? {
        kicker: "X · Minha fila",
        title: "Fila de posts",
        description: "Agende posts para publicar automaticamente no dia e horário que você escolher.",
        newPost: "+ Novo post",
      }
    : {
        kicker: "X · My Queue",
        title: "Posts Queue",
        description: "Schedule posts to publish automatically at the day and time you choose.",
        newPost: "+ New post",
      };

  const posts = await listScheduledPosts(currentProject.id);

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">{copy.kicker}</p>
            <h1 className="page-title">{copy.title}</h1>
            <p className="page-copy">{copy.description}</p>
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
              {copy.newPost}
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
