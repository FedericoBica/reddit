import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { postTweet, refreshXToken } from "@/modules/x/x-oauth";

export const publishXScheduledPosts = inngest.createFunction(
  {
    id: "publish-x-scheduled-posts",
    name: "Publish X scheduled posts",
    retries: 0,
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    const supabase = createSupabaseAdminClient();

    const duePosts = await step.run("fetch-due-posts", async () => {
      const { data } = await supabase
        .from("x_scheduled_posts")
        .select("id, project_id, content")
        .eq("status", "scheduled")
        .lte("scheduled_for", new Date().toISOString())
        .limit(50);
      return data ?? [];
    });

    if (duePosts.length === 0) return { published: 0, failed: 0 };

    const results = await Promise.all(
      duePosts.map((post) =>
        step.run(`publish-${post.id}`, async () => {
          const { data: account } = await supabase
            .from("x_connected_accounts")
            .select("id, access_token, refresh_token, token_expires_at")
            .eq("project_id", post.project_id)
            .maybeSingle();

          if (!account) {
            await supabase
              .from("x_scheduled_posts")
              .update({ status: "failed", error: "No X account connected", updated_at: new Date().toISOString() })
              .eq("id", post.id);
            return { ok: false };
          }

          let accessToken = account.access_token;

          if (account.token_expires_at && account.refresh_token && new Date(account.token_expires_at) <= new Date()) {
            try {
              const refreshed = await refreshXToken(account.refresh_token);
              accessToken = refreshed.access_token;
              await supabase
                .from("x_connected_accounts")
                .update({
                  access_token: refreshed.access_token,
                  refresh_token: refreshed.refresh_token ?? account.refresh_token,
                  token_expires_at: refreshed.expires_in
                    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
                    : null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", account.id);
            } catch {
              await supabase
                .from("x_scheduled_posts")
                .update({ status: "failed", error: "Token refresh failed. Reconnect your X account.", updated_at: new Date().toISOString() })
                .eq("id", post.id);
              return { ok: false };
            }
          }

          await supabase
            .from("x_scheduled_posts")
            .update({ status: "publishing", updated_at: new Date().toISOString() })
            .eq("id", post.id);

          try {
            const tweet = await postTweet(accessToken, post.content);
            await supabase
              .from("x_scheduled_posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                x_tweet_id: tweet.id,
                connected_account_id: account.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", post.id);
            return { ok: true };
          } catch (err) {
            await supabase
              .from("x_scheduled_posts")
              .update({
                status: "failed",
                error: err instanceof Error ? err.message : "Unknown error",
                updated_at: new Date().toISOString(),
              })
              .eq("id", post.id);
            return { ok: false };
          }
        }),
      ),
    );

    const published = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    return { published, failed };
  },
);
