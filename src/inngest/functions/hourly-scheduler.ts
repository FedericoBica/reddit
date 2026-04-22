import { inngest } from "@/inngest/client";
import { getScheduleSettings } from "@/db/queries/admin";

export const hourlyScheduler = inngest.createFunction(
  {
    id: "hourly-scheduler",
    name: "Hourly job scheduler",
    retries: 0,
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDate();

    const settings = await step.run("read-schedule-settings", () =>
      getScheduleSettings(),
    );

    const events: { name: string; data: object }[] = [];

    if (currentHour === settings.opportunities_hour) {
      events.push({ name: "scrape/opportunities.requested", data: {} });
    }

    if (currentHour === settings.mentions_hour) {
      events.push({ name: "scrape/mentions.requested", data: {} });
    }

    if (
      currentHour === settings.searchbox_hour &&
      settings.searchbox_days.includes(currentDay)
    ) {
      events.push({ name: "scrape/searchbox.requested", data: {} });
    }

    if (events.length === 0) {
      return { dispatched: [] };
    }

    await step.sendEvent("dispatch-scheduled-jobs", events);

    return { dispatched: events.map((e) => e.name) };
  },
);
