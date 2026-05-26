import { inngest } from "@/inngest/client";
import { sendTelegramMessage } from "@/modules/notifications/telegram";

type OrphanedWebhookEvent = {
  name: "billing/webhook.orphaned";
  data: { subscriptionId: string; eventName: string; customerId: string | null };
};

export const alertOrphanedBillingWebhook = inngest.createFunction(
  {
    id: "alert-orphaned-billing-webhook",
    name: "Alert on orphaned billing webhook",
    retries: 2,
    triggers: [{ event: "billing/webhook.orphaned" }],
  },
  async ({ event }: { event: OrphanedWebhookEvent }) => {
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (!adminChatId) return { skipped: true, reason: "ADMIN_TELEGRAM_CHAT_ID not configured" };

    const { subscriptionId, eventName, customerId } = event.data;
    const msg = [
      "⚠️ <b>Billing webhook orphaned</b>",
      "",
      `Event: <code>${eventName}</code>`,
      `Subscription: <code>${subscriptionId}</code>`,
      `Customer: <code>${customerId ?? "unknown"}</code>`,
      "",
      "No matching user found. Manual investigation required.",
    ].join("\n");

    await sendTelegramMessage(adminChatId, msg);
    return { alerted: true, subscriptionId };
  },
);
