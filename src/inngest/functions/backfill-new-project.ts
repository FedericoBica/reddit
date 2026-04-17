import { inngest } from "@/inngest/client";
import { runProjectBackfill } from "@/modules/discovery/scraping/run-global-scrape";

export const backfillNewProject = inngest.createFunction(
  {
    id: "backfill-new-project",
    name: "Initial backfill for new project",
    retries: 1,
    timeouts: {
      finish: "10m",
    },
    triggers: [{ event: "project/backfill.requested" }],
  },
  async ({ event, step }: { event: { data: { projectId: string } }; step: { run: <T>(name: string, fn: () => T) => T } }) => {
    return step.run("run project backfill", () => runProjectBackfill(event.data.projectId));
  },
);
