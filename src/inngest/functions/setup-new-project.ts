import { inngest } from "@/inngest/client";
import { logOpenAIUsage } from "@/db/mutations/api-usage";
import {
  replaceProjectSuggestions,
  saveProjectOnboarding,
} from "@/db/mutations/projects";
import {
  listProjectKeywordSuggestions,
  listProjectSubredditSuggestions,
  getProjectById,
} from "@/db/queries/projects";
import { generateProjectSuggestions } from "@/modules/projects/suggestion-generator";

export const setupNewProject = inngest.createFunction(
  {
    id: "setup-new-project",
    name: "Generate suggestions and backfill for new project",
    retries: 2,
    timeouts: { finish: "5m" },
    triggers: [{ event: "project/setup.requested" }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { projectId: string; userId: string } };
    step: { run: <T>(name: string, fn: () => T) => T };
  }) => {
    const { projectId, userId } = event.data;

    const project = await step.run("load-project", () => getProjectById(projectId));

    if (!project) {
      return { status: "skipped", reason: "Project not found" };
    }

    await step.run("generate-and-accept-suggestions", async () => {
      try {
        const suggestions = await generateProjectSuggestions(project);
        await replaceProjectSuggestions({
          projectId,
          keywords: suggestions.keywords,
          subreddits: suggestions.subreddits,
        });

        try {
          await logOpenAIUsage({
            projectId,
            userId,
            operation: "project_onboarding_suggestions",
            model: suggestions.usage.model,
            inputTokens: suggestions.usage.inputTokens,
            outputTokens: suggestions.usage.outputTokens,
            metadata: {
              keyword_count: suggestions.keywords.length,
              subreddit_count: suggestions.subreddits.length,
            },
          });
        } catch {
          // non-critical
        }

        const [keywordSuggestions, subredditSuggestions] = await Promise.all([
          listProjectKeywordSuggestions(projectId),
          listProjectSubredditSuggestions(projectId),
        ]);

        await saveProjectOnboarding({
          projectId,
          acceptedKeywordSuggestionIds: keywordSuggestions.map((k) => k.id),
          acceptedSubredditSuggestionIds: subredditSuggestions.map((s) => s.id),
          customKeywords: [],
          customSubreddits: [],
        });
      } catch (err) {
        // Suggestions failed — project is still marked completed, backfill will skip (no keywords)
        console.error("setup-new-project: suggestion generation failed", err);
      }
    });

    await step.run("trigger-backfill-and-searchbox", () =>
      inngest.send([
        { name: "project/backfill.requested", data: { projectId } },
        { name: "project/searchbox.requested", data: { projectId } },
      ]),
    );

    return { status: "ok", projectId };
  },
);
