import { inngest } from "@/inngest/client";
import { sendHighIntentLeadPush } from "@/modules/notifications/push";

export const sendLeadPushNotification = inngest.createFunction(
  {
    id: "send-lead-push-notification",
    name: "Send lead push notification",
    retries: 2,
    concurrency: {
      limit: 10,
      key: "event.data.projectId",
    },
    triggers: [{ event: "leads/high_intent.created" }],
  },
  async ({ event, step }) => {
    const { projectId, leadId } = event.data;

    return step.run("send web push", async () =>
      sendHighIntentLeadPush({
        projectId,
        leadId,
      }),
    );
  },
);
