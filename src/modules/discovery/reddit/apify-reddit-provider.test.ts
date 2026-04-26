import test from "node:test";
import assert from "node:assert/strict";
import { mapApifyItemsForTesting } from "./apify-reddit-provider";

test("maps flat Apify post items into Reddit posts", () => {
  const posts = mapApifyItemsForTesting([
    {
      title: "Need a better CRM for our startup",
      postId: "1abc123",
      subreddit: "saas",
      author: "founder42",
      postUrl: "https://www.reddit.com/r/saas/comments/1abc123/need_a_better_crm/",
      createdAt: "2026-04-26T06:00:00.000Z",
      upVotes: 14,
      commentsCount: 3,
      text: "HubSpot is too expensive for us.",
      type: "post",
    },
  ]);

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.id, "1abc123");
  assert.equal(posts[0]?.title, "Need a better CRM for our startup");
  assert.equal(posts[0]?.subreddit, "saas");
  assert.equal(posts[0]?.numComments, 3);
});

test("maps nested aggregated Apify search output into Reddit posts", () => {
  const posts = mapApifyItemsForTesting([
    {
      type: "search",
      query: "crm",
      posts: [
        {
          title: "Best CRM for a small B2B team?",
          id: "1def456",
          subreddit: "sales",
          author: "revops_user",
          permalink: "https://reddit.com/r/sales/comments/1def456/best_crm_for_a_small_b2b_team/",
          created_utc: 1777186800,
          score: 27,
          num_comments: 11,
          selftext: "Looking at Pipedrive and HubSpot.",
        },
      ],
    },
  ]);

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.id, "1def456");
  assert.equal(posts[0]?.subreddit, "sales");
  assert.equal(posts[0]?.score, 27);
  assert.equal(posts[0]?.body, "Looking at Pipedrive and HubSpot.");
});

test("maps deeply nested summary data and ignores non-post items", () => {
  const posts = mapApifyItemsForTesting([
    {
      type: "summary",
      data: {
        search: [
          {
            type: "search",
            posts: [
              {
                title: "ClickUp alternative for agencies",
                postUrl: "https://www.reddit.com/r/agency/comments/1ghi789/clickup_alternative/",
                communityName: "agency",
                authorName: "ops_agency",
                createdAt: "2026-04-26T07:00:00.000Z",
                commentsCount: 9,
              },
            ],
          },
        ],
        comments: [
          {
            type: "comment",
            body: "not a post",
          },
        ],
      },
    },
  ]);

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.id, "1ghi789");
  assert.equal(posts[0]?.subreddit, "agency");
  assert.equal(posts[0]?.author, "ops_agency");
});

test("uses fallback subreddit when nested item omits subreddit fields", () => {
  const posts = mapApifyItemsForTesting(
    [
      {
        type: "post",
        post: {
          title: "How are you managing client projects?",
          id: "1jkl012",
          permalink: "https://reddit.com/r/projectmanagement/comments/1jkl012/how_are_you_managing_client_projects/",
          selftext: "We outgrew spreadsheets.",
        },
      },
    ],
    "projectmanagement",
  );

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.subreddit, "projectmanagement");
});
