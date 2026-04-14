# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Reddit Lead Radar is a multi-tenant SaaS that monitors Reddit for buyer-intent posts, classifies them with AI, and helps users craft human-like replies. It is NOT a scraper — it is a full lead acquisition system.

## Commands

```bash
# Development
npm run dev              # Next.js dev server (port 3000)
npm run inngest:dev      # Inngest background-job dev server (points at /api/inngest)

# Supabase local
npm run supabase:start   # Start local Supabase stack
npm run supabase:reset   # Apply migrations from scratch (drops all data)
npm run supabase:types   # Regenerate src/db/schemas/database.types.ts from local schema
npm run supabase:status  # Show local URLs and keys

# Verification
npm run lint
npm run typecheck
npm run build
```

Run both `npm run dev` and `npm run inngest:dev` together for full local development.

## Architecture

### Directory layout

```
app/                      Next.js App Router
  (auth)/login            Magic-link login page
  (dashboard)/            Main app — protected routes
    bootstrap/            First-project creation
    dashboard/            Lead inbox
    leads/[leadId]/       Lead detail + reply generator
    onboarding/project/   Post-creation keyword/subreddit config
  api/inngest/            Inngest webhook endpoint
  auth/callback/          Supabase auth callback

src/
  db/
    mutations/            Write operations (one file per domain entity)
    queries/              Read operations (one file per domain entity)
    schemas/
      database.types.ts   Auto-generated Supabase types — never edit manually
      domain.ts           Zod schemas + TypeScript DTOs for the business domain
  inngest/
    client.ts             Inngest singleton
    functions/            Background jobs (scrape-global, generate-lead-replies)
  lib/
    supabase/             Four Supabase client factories: admin, browser, server, proxy
    env.ts                requireEnv() helper
  modules/
    auth/                 Magic-link actions, server-side session helpers
    discovery/            Reddit API provider, keyword matcher, AI classifier
    leads/                Lead status actions, reply generator
    projects/             Project CRUD actions, onboarding actions, AI suggestion generator
```

### Data flow

```
Inngest cron (scrape-global-projects)
  → listProjectsDueForScraping()
  → RedditApiProvider.fetchNewPosts()
  → findMatchedKeywords()         ← cheap, runs first, gates AI calls
  → classifyLeadCandidate()       ← OpenAI Structured Outputs
  → createLeadForProjectWorker()  ← inserts if intent_score >= LEAD_INTENT_THRESHOLD
```

Lead replies are generated on-demand via the `generate-lead-replies` Inngest function, triggered from the lead detail page through a Server Action.

### Key design rules

- **Multi-tenant isolation**: All DB access goes through Supabase RLS. Server Actions use the user's session client; background workers use the admin client.
- **`server-only` at the top of every module file**: Prevents accidental client-side imports of secrets.
- **Domain types vs. DB types**: Use `src/db/schemas/domain.ts` types (`LeadDTO`, `ProjectDTO`, etc.) throughout the app. `database.types.ts` is for raw Supabase types only.
- **Keyword match before AI**: `findMatchedKeywords()` is always called before `classifyLeadCandidate()` to avoid paying for AI on irrelevant posts.
- **Scrape backoff**: Failed scrape runs increment `scrape_fail_count`; `failProjectScrapeRun()` sets `scrape_backoff_until` automatically.
- **Human-in-the-loop**: The system never posts to Reddit automatically. All generated replies require explicit user action.

### AI usage

| Task | Model env var | Default |
|------|--------------|---------|
| Onboarding suggestions | `OPENAI_MODEL` | `gpt-4o-mini` |
| Lead classification | `OPENAI_LEAD_CLASSIFIER_MODEL` | `gpt-4o-mini` |
| Reply generation | `OPENAI_REPLY_MODEL` → `OPENAI_MODEL` | `gpt-4o-mini` |

All AI calls use OpenAI Structured Outputs via `zodTextFormat` for type-safe parsed responses.

### Supabase clients

| File | When to use |
|------|-------------|
| `lib/supabase/server.ts` | Server Components, Server Actions (user session) |
| `lib/supabase/admin.ts` | Inngest functions, background workers (bypasses RLS) |
| `lib/supabase/browser.ts` | Client Components |
| `lib/supabase/proxy.ts` | Used by `proxy.ts` in the project root |

After running `supabase:reset` or adding migrations, always run `supabase:types` to keep `database.types.ts` in sync.
