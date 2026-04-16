import { generateLeadReplies } from "./generate-lead-replies";
import { sendLeadPushNotification } from "./send-lead-push-notification";
import { scrapeGlobalProjects } from "./scrape-global";

export const functions = [scrapeGlobalProjects, generateLeadReplies, sendLeadPushNotification];
