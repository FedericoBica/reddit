import { inngest } from "@/inngest/client";
import { fetchBackfillPosts, classifyAndSaveBackfillPosts } from "@/modules/discovery/scraping/run-global-scrape";

export const backfillNewProject = inngest.createFunction(
  {
    id: "backfill-new-project",
    name: "Initial backfill for new project",
    retries: 1,
    timeouts: { finish: "10m" },
    triggers: [{ event: "project/backfill.requested" }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { projectId: string } };
    step: { run: <T>(name: string, fn: () => T) => T };
  }) => {
    const { projectId } = event.data;

    const fetchResult = await step.run("fetch-posts-from-apify", () =>
      fetchBackfillPosts(projectId),
    );

    if (fetchResult.status === "skipped") {
      return { projectId, ...fetchResult };
    }

    return step.run("classify-and-save-leads", () =>
      classifyAndSaveBackfillPosts(fetchResult),
    );
  },
);
