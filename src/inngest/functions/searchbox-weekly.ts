import { inngest } from "@/inngest/client";
import { runSearchboxScrape } from "@/modules/searchbox/scraping/run-searchbox-scrape";

export const searchboxWeeklyScan = inngest.createFunction(
  {
    id: "searchbox-biweekly-scan",
    name: "Searchbox biweekly Google scan",
    retries: 0,
    concurrency: 1,
    timeouts: {
      finish: "15m",
    },
    triggers: [
      { event: "scrape/searchbox.requested" },
    ],
  },
  async ({ step }) => {
    return step.run("run searchbox scrape", () => runSearchboxScrape());
  },
);
