# Reddit Lead Radar

Foundation for a multi-tenant, event-driven SaaS built with Next.js, Supabase, Inngest, and AI providers.

## Getting Started

Install dependencies:

```bash
npm install
```

Start Supabase local development:

```bash
npm run supabase:start
```

Copy the local keys from:

```bash
npm run supabase:status
```

Then create `.env.local` from `.env.example` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local publishable key>
SUPABASE_SERVICE_ROLE_KEY=<local secret key>
OPENAI_API_KEY=<optional for assisted onboarding>
OPENAI_MODEL=gpt-4o-mini
OPENAI_SUGGESTIONS_TEMPERATURE=0.2
OPENAI_SUGGESTIONS_TIMEOUT_MS=25000
OPENAI_LEAD_CLASSIFIER_MODEL=gpt-4o-mini
OPENAI_LEAD_CLASSIFIER_TEMPERATURE=0.2
OPENAI_LEAD_CLASSIFIER_TIMEOUT_MS=25000
LEAD_INTENT_THRESHOLD=70
REDDIT_PROVIDER=apify
APIFY_API_TOKEN=<apify api token>
APIFY_REDDIT_ACTOR_ID=harshmaur/reddit-scraper
APIFY_REDDIT_TIMEOUT_SECS=90
REDDIT_CLIENT_ID=<optional reddit app client id if REDDIT_PROVIDER=oauth>
REDDIT_CLIENT_SECRET=<optional reddit app client secret if REDDIT_PROVIDER=oauth>
REDDIT_USER_AGENT=web:reddprowl:0.1.0 (contact: your-email-or-domain)
SCRAPE_GLOBAL_CRON=*/30 * * * *
SCRAPE_MAX_PROJECTS_PER_RUN=10
SCRAPE_MAX_SUBREDDITS_PER_PROJECT=5
SCRAPE_MAX_POSTS_PER_SUBREDDIT=25
```

`REDDIT_PROVIDER=apify` runs the Apify actor `harshmaur/reddit-scraper` and does not require an official Reddit app. Use `REDDIT_PROVIDER=oauth` only if you already have official Reddit API credentials, or `REDDIT_PROVIDER=public` for Reddit's public JSON listings.

Start the Next.js dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Local

Useful commands:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:types
npm run supabase:stop
```

Local URLs after `npm run supabase:start`:

```text
API:    http://127.0.0.1:54321
DB:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio: http://127.0.0.1:54323
Mailpit: http://127.0.0.1:54324
```

Migration flow:

```bash
npm run supabase:reset
```

Type generation flow:

```bash
npm run supabase:types
```

This writes the generated schema to `src/db/schemas/database.types.ts`.

## Auth And Project Bootstrap

Minimal local flow:

```bash
npm run supabase:start
npm run dev
```

Then:

```text
1. Open http://127.0.0.1:3000/dashboard
2. You should be redirected to /login.
3. Enter an email and submit the magic link form.
4. Open Mailpit at http://127.0.0.1:54324.
5. Click the magic link.
6. If the user has no project, the app redirects to /bootstrap.
7. Create the first project.
8. The app redirects to `/onboarding/project` and starts AI suggestions without blocking the project.
9. Confirm suggested keywords/subreddits or add manual entries.
10. The app redirects to `/dashboard` with the created project as current.
```

The first project is created through the `create_project_with_owner` RPC so the
project and owner membership are created in one transaction.

## Discovery Scraping

The phase 1 scraper is a global Inngest job exposed at `/api/inngest`. It scans
active projects with completed onboarding and active subreddits, records one
`project_scrape_runs` row per project, and updates project-level scrape state.

Local development:

```bash
npm run dev
npm run inngest:dev
```

The Inngest dev server should point at:

```text
http://localhost:3000/api/inngest
```

The scraper fetches Reddit posts, applies a cheap keyword match first, classifies
only matched candidates with OpenAI Structured Outputs, and inserts leads that
meet `LEAD_INTENT_THRESHOLD`. Discarded posts are not persisted in phase 1.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run build
```
# reddit
