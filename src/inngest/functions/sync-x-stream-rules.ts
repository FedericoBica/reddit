import { inngest } from "@/inngest/client";
import { syncAllXStreamRules } from "@/modules/x/x-stream-rules";

export const syncXStreamRules = inngest.createFunction(
  {
    id: "sync-x-stream-rules",
    name: "Sync X filtered stream rules",
    retries: 1,
    concurrency: 1,
    triggers: [{ event: "x/rules.sync.requested" }],
  },
  async ({ step }) => {
    return step.run("sync x stream rules", async () => syncAllXStreamRules());
  },
);
