import { inngest } from "@/inngest/client";
import { runGlobalScrape } from "@/modules/discovery/scraping/run-global-scrape";

export const scrapeGlobalProjects = inngest.createFunction(
  {
    id: "scrape-global-projects",
    name: "Scrape active projects",
    // Project-level try/catch/backoff handles failures; retrying the whole global job can duplicate work.
    retries: 0,
    concurrency: 1,
    timeouts: {
      finish: "5m",
    },
    triggers: [
      {
        cron: process.env.SCRAPE_GLOBAL_CRON ?? "*/30 * * * *",
      },
    ],
  },
  async ({ step }) => {
    return step.run("run global scrape", async () => runGlobalScrape());
  },
);
