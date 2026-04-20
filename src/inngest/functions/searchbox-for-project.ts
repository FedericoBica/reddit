import { inngest } from "@/inngest/client";
import { runSearchboxScrapeForProject } from "@/modules/searchbox/scraping/run-searchbox-scrape";

export const searchboxForProject = inngest.createFunction(
  {
    id: "searchbox-for-project",
    name: "Initial searchbox scan for new project",
    retries: 1,
    timeouts: { finish: "15m" },
    triggers: [{ event: "project/searchbox.requested" }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { projectId: string } };
    step: { run: <T>(name: string, fn: () => T) => T };
  }) => {
    return step.run("run searchbox scrape", () =>
      runSearchboxScrapeForProject(event.data.projectId),
    );
  },
);
