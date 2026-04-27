import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBillingPlanForUser } from "@/modules/billing/current";
import { sendTelegramMessage } from "@/modules/notifications/telegram";
import { sendScrapeNotificationEmail } from "@/modules/notifications/email";

type ScrapeEvent =
  | { name: "leads/scrape.completed";     data: { projectId: string; newLeadsCount: number } }
  | { name: "searchbox/scrape.completed"; data: { projectId: string; newResultsCount: number } }
  | { name: "mentions/scrape.completed";  data: { projectId: string; newMentionsCount: number } };

export const sendScrapeNotifications = inngest.createFunction(
  {
    id: "send-scrape-notifications",
    name: "Send scrape notifications (email + Telegram)",
    retries: 2,
    concurrency: { limit: 5, key: "event.data.projectId" },
    triggers: [
      { event: "leads/scrape.completed" },
      { event: "searchbox/scrape.completed" },
      { event: "mentions/scrape.completed" },
    ],
  },
  async ({ event }: { event: ScrapeEvent }) => {
    const { projectId } = event.data;

    const count =
      event.name === "leads/scrape.completed"     ? event.data.newLeadsCount :
      event.name === "searchbox/scrape.completed" ? event.data.newResultsCount :
      event.data.newMentionsCount;

    const type =
      event.name === "leads/scrape.completed"     ? "leads" :
      event.name === "searchbox/scrape.completed" ? "searchbox" :
      "mentions";

    if (count <= 0) return { skipped: true, reason: "no new items" };

    const supabase = createSupabaseAdminClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, owner_id, telegram_chat_id")
      .eq("id", projectId)
      .single();

    if (!project) return { skipped: true, reason: "project not found" };

    const { data: owner } = await supabase
      .from("users")
      .select("email")
      .eq("id", project.owner_id)
      .single();

    if (!owner?.email) return { skipped: true, reason: "owner email not found" };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reddprowl.com";
    const projectUrl = `${appUrl}?projectId=${projectId}`;

    const results: { email?: string; telegram?: string } = {};

    // Email — always send if Resend is configured.
    if (process.env.RESEND_API_KEY) {
      try {
        await sendScrapeNotificationEmail({
          to: owner.email,
          projectName: project.name,
          type,
          count,
          projectUrl,
        });
        results.email = "sent";
      } catch (err) {
        results.email = `failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    // Telegram — only if chat ID configured and plan allows it.
    if (project.telegram_chat_id) {
      const plan = await getBillingPlanForUser(project.owner_id);
      if (plan.integrations.telegram) {
        const noun = type === "leads" ? "opportunities" : type === "searchbox" ? "Google results" : "mentions";
        const msg = `<b>${project.name}</b> — ${count} new ${noun} found.\n\n<a href="${projectUrl}">View in ReddProwl</a>`;
        try {
          await sendTelegramMessage(project.telegram_chat_id, msg);
          results.telegram = "sent";
        } catch (err) {
          results.telegram = `failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else {
        results.telegram = "skipped: plan does not include Telegram";
      }
    }

    return { projectId, type, count, results };
  },
);
