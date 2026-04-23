import { inngest } from "@/inngest/client";
import { runMentionsScrapeWithCompetitors } from "@/modules/mentions/run-mentions-scrape";
import { getBillingPlanForUser } from "@/modules/billing/current";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const scrapeBrandMentions = inngest.createFunction(
  {
    id: "scrape-brand-mentions",
    name: "Scrape brand & competitor mentions",
    retries: 1,
    concurrency: 1,
    timeouts: {
      finish: "8m",
    },
    triggers: [
      { event: "scrape/mentions.requested" },
    ],
  },
  async ({ step }) => {
    const dueProjects = await step.run("resolve-due-projects", async () => {
      const supabase = createSupabaseAdminClient();
      const now = Date.now();

      const { data: projects, error } = await supabase
        .from("projects")
        .select("id, owner_id, last_mentions_scraped_at")
        .eq("status", "active")
        .eq("onboarding_status", "completed");

      if (error) throw new Error(`Failed to list projects: ${error.message}`);
      if (!projects?.length) return [];

      const resolved = await Promise.all(
        projects.map(async (project) => {
            const plan = await getBillingPlanForUser(project.owner_id);
            const intervalMs = plan.scrapeIntervalHours * 60 * 60 * 1000;
            const lastMs = project.last_mentions_scraped_at
              ? new Date(project.last_mentions_scraped_at).getTime()
              : 0;

            // Due if at least one full interval has elapsed since last attempted scrape.
            // last_mentions_scraped_at is written at the START of each run regardless of
            // results, so zero-match projects don't get treated as perpetually overdue.
            return now - lastMs >= intervalMs ? project.id : null;
          },
        ),
      );

      return resolved.filter((id): id is string => id !== null);
    });

    if (!dueProjects.length) {
      return { projectsProcessed: 0, mentionsSaved: 0 };
    }

    const results = await Promise.all(
      dueProjects.map((projectId) =>
        step.run(`scrape-mentions-${projectId}`, () =>
          runMentionsScrapeWithCompetitors(projectId),
        ),
      ),
    );

    const totalSaved = results.reduce((sum, n) => sum + n, 0);
    return { projectsProcessed: dueProjects.length, mentionsSaved: totalSaved };
  },
);
