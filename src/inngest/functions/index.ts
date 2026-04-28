import { backfillNewProject } from "./backfill-new-project";
import { generateLeadReplies } from "./generate-lead-replies";
import { hourlyScheduler } from "./hourly-scheduler";
import { searchboxForProject } from "./searchbox-for-project";
import { searchboxWeeklyScan } from "./searchbox-weekly";
import { sendLeadPushNotification } from "./send-lead-push-notification";
import { sendScrapeNotifications } from "./send-scrape-notifications";
import { scrapeGlobalProjects } from "./scrape-global";
import { scrapeBrandMentions } from "./scrape-brand-mentions";
import { setupNewProject } from "./setup-new-project";
import { processXPost } from "./process-x-post";
import { syncXStreamRules } from "./sync-x-stream-rules";
import { generateXReply } from "./generate-x-reply";

export const functions = [hourlyScheduler, scrapeGlobalProjects, generateLeadReplies, sendLeadPushNotification, sendScrapeNotifications, backfillNewProject, searchboxWeeklyScan, setupNewProject, searchboxForProject, scrapeBrandMentions, processXPost, syncXStreamRules, generateXReply];
