import { backfillNewProject } from "./backfill-new-project";
import { generateLeadReplies } from "./generate-lead-replies";
import { searchboxForProject } from "./searchbox-for-project";
import { searchboxWeeklyScan } from "./searchbox-weekly";
import { sendLeadPushNotification } from "./send-lead-push-notification";
import { scrapeGlobalProjects } from "./scrape-global";
import { setupNewProject } from "./setup-new-project";

export const functions = [scrapeGlobalProjects, generateLeadReplies, sendLeadPushNotification, backfillNewProject, searchboxWeeklyScan, setupNewProject, searchboxForProject];
