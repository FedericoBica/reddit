import { inngest } from "@/inngest/client";
import { completeXPostReplyGeneration, failXPostReplyGeneration } from "@/db/mutations/x";
import { generateXReplyVariant, getXReplyGenerationContext, X_REPLY_STYLES } from "@/modules/x/x-reply-generator";

export const generateXReply = inngest.createFunction(
  {
    id: "generate-x-reply",
    name: "Generate X reply",
    retries: 2,
    concurrency: {
      limit: 5,
      key: "event.data.projectId",
    },
    timeouts: {
      finish: "2m",
    },
    triggers: [{ event: "x/reply.generate.requested" }],
    onFailure: async ({ event, error, step }) => {
      const data = event.data.event.data as { projectId?: string; xPostId?: string };
      if (!data.projectId || !data.xPostId) return;
      await step.run("mark reply generation failed", async () =>
        failXPostReplyGeneration(data.projectId!, data.xPostId!, error.message),
      );
    },
  },
  async ({ event, step }) => {
    const { projectId, xPostId, userId } = event.data;

    const context = await step.run("load context", async () =>
      getXReplyGenerationContext(projectId, xPostId),
    );

    const replies = await Promise.all(
      X_REPLY_STYLES.map((style) =>
        step.run(`generate ${style} reply`, async () =>
          generateXReplyVariant(context, style),
        ),
      ),
    );

    await step.run("save replies", async () =>
      completeXPostReplyGeneration({ projectId, xPostId, userId, replies }),
    );

    return { generated: replies.length };
  },
);
