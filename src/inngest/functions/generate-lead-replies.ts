import { inngest } from "@/inngest/client";
import {
  completeLeadReplyGeneration,
  failLeadReplyGeneration,
} from "@/db/mutations/lead-replies";
import {
  generateLeadReplyVariant,
  getReplyGenerationContext,
} from "@/modules/leads/reply-generator";
import type { ReplyStyle } from "@/db/schemas/domain";

const replyStyles = ["engaging", "direct", "balanced"] satisfies ReplyStyle[];

export const generateLeadReplies = inngest.createFunction(
  {
    id: "generate-lead-replies",
    name: "Generate lead replies",
    retries: 2,
    concurrency: {
      limit: 5,
      key: "event.data.projectId",
    },
    timeouts: {
      finish: "2m",
    },
    triggers: [{ event: "leads/replies.requested" }],
    onFailure: async ({ event, error, step }) => {
      const data = event.data.event.data as { projectId?: string; leadId?: string };

      if (!data.projectId || !data.leadId) {
        return;
      }

      const { projectId, leadId } = data;

      await step.run("mark reply generation failed", async () =>
        failLeadReplyGeneration(projectId, leadId, error.message),
      );
    },
  },
  async ({ event, step }) => {
    const { projectId, leadId, userId } = event.data;

    const context = await step.run("load reply context", async () =>
      getReplyGenerationContext(projectId, leadId),
    );
    const replies = await Promise.all(
      replyStyles.map((style) =>
        step.run(`generate ${style} reply`, async () => generateLeadReplyVariant(context, style)),
      ),
    );

    await step.run("save generated replies", async () =>
      completeLeadReplyGeneration({
        projectId,
        leadId,
        userId,
        replies,
      }),
    );

    return { generated: replies.length };
  },
);
