import { generateLeadReplies } from "./generate-lead-replies";
import { scrapeGlobalProjects } from "./scrape-global";

export const functions = [scrapeGlobalProjects, generateLeadReplies];
