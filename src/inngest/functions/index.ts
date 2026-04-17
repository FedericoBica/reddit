import { backfillNewProject } from "./backfill-new-project";
import { generateLeadReplies } from "./generate-lead-replies";
import { searchboxWeeklyScan } from "./searchbox-weekly";
import { sendLeadPushNotification } from "./send-lead-push-notification";
import { scrapeGlobalProjects } from "./scrape-global";

export const functions = [scrapeGlobalProjects, generateLeadReplies, sendLeadPushNotification, backfillNewProject, searchboxWeeklyScan];
