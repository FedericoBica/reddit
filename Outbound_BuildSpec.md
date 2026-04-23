# ReddProwl Outbound System — Build Specification

> **Para:** Claude Code / Cursor
> **Proyecto:** ReddProwl (`reddprowl.com`)
> **Módulo:** Outbound System — Chrome Extension + Lead CRM dashboard
> **Contexto previo:** El inbound system ya está implementado. Este prompt cubre SOLO el módulo Outbound, que consta de una Chrome Extension que envía DMs automatizados y un panel "Lead CRM" en el dashboard existente para gestionar las campañas y respuestas.

---

## 0. Cómo usar este prompt

Este documento es la especificación completa de implementación. Seguí las fases en orden — cada fase produce un entregable testeable. No avances a la fase siguiente si la anterior no pasa los criterios de aceptación definidos. Si hay ambigüedad, preguntá antes de asumir. La arquitectura ya está decidida: no propongas alternativas salvo que algo sea técnicamente inviable.

---

## 1. Visión del Módulo

**Qué es:** La extensión es el brazo ejecutor del dashboard de ReddProwl. Los leads ya están clasificados por intent score (inbound), las menciones ya están rastreadas, la IA ya sabe generar respuestas. La extensión cierra el ciclo permitiendo al usuario enviar DMs directos a esos leads desde su propio navegador, usando su sesión de Reddit, sin exponer credenciales.

**Diferencial vs competidores (RedReach, etc):** Los competidores son herramientas standalone. El usuario arma campañas a mano, sin contexto. Acá la extensión consume data clasificada del dashboard:

- **Lead Campaigns**: se crean con el inbox de leads, ordenadas por intent score. La IA genera el mensaje usando el título y body del post como contexto.
- **Thread Campaigns**: pegar URL de un post, extraer comentaristas, enviar DMs.
- **Subreddit Campaigns**: buscar usuarios activos en un subreddit.
- **CRM integrado**: cada DM enviado se vincula al lead origen, se trackea respuesta, se actualiza el status en el pipeline existente.

**Qué NO es:**
- No es un bot que corre en servidores. Toda la actividad ocurre en el browser del usuario.
- No usa la API oficial de Reddit. Emula comportamiento humano vía DOM.
- No postea comentarios automáticamente en Reddit (eso ya lo maneja el inbound con Copy & Open manual). Solo DMs.

---

## 2. Arquitectura y Stack

### 2.1 Monorepo

Usar **Turborepo + pnpm workspaces**. Razón: Vercel lo mantiene, caché remoto gratis en Vercel, integración nativa con Next.js, estándar en SaaS modernos.

```
reddprowl/
├── apps/
│   ├── web/              # Next.js dashboard (existente — solo agregamos el módulo Outbound)
│   └── extension/        # Chrome Extension (MV3)
├── packages/
│   ├── database/         # Supabase client + types generados + migrations del módulo Outbound
│   ├── ui/               # Componentes shadcn/ui compartidos (ya existe)
│   ├── api-contracts/    # Tipos TypeScript + Zod schemas de los endpoints /api/ext/*
│   ├── spintax/          # Motor de spintax (parser + generator con IA)
│   └── config-eslint/    # ESLint config compartido
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### 2.2 Stack Técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Monorepo** | Turborepo + pnpm | Build caching, tasks paralelos |
| **Dashboard** | Next.js 15 (App Router), React 19 | Ya existe en el proyecto |
| **Extension UI** | React 19 + Vite + vite-plugin-crx | Build óptimo MV3, HMR en desarrollo |
| **Estilos** | Tailwind CSS 4 | Compartido web + extension |
| **UI Components** | shadcn/ui | Accesibles, reutilizables cross-app |
| **Estado extension** | Zustand | Liviano, funciona en extension context |
| **Database** | Supabase (PostgreSQL) | Ya existe, agregamos tablas |
| **Auth** | Supabase Auth | JWT del user, válido en extension y web |
| **API validation** | Zod | Schemas en `@reddprowl/api-contracts` |
| **IA (mensajes)** | OpenAI GPT-4o-mini | Generación de variantes de mensaje |
| **Orquestación** | Inngest | Ya existe — jobs de polling de respuestas |
| **Tipografía** | Outfit (Google Fonts) | Ya definido en brand kit |

### 2.3 Variables de Entorno

Cada app tiene su `.env.local`. Generar un `.env.example` en cada app con placeholders.

**apps/web/.env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
EXTENSION_JWT_SECRET=    # clave separada para tokens de extensión
```

**apps/extension/.env:**
```
VITE_API_BASE_URL=https://app.reddprowl.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 3. Design System (crítico — respetar exacto)

El dashboard ya usa estos tokens. La extensión debe seguirlos para consistencia visual total.

### 3.1 Paleta

**Dark mode (default):**
- `--bg-base: #1C1C1E`
- `--bg-sidebar: #242426`
- `--bg-card: #2A2A2C`
- `--bg-hover: #3A3A3C`
- `--text-primary: #F5F5F5`
- `--text-secondary: #9A9A9D`
- `--text-muted: #6B6B6E`
- `--accent: #F5840C`
- `--accent-light: #FFB347`
- `--success: #4CAF7D`
- `--danger: #E05252`

**Light mode:**
- `--bg-base: #FAFAF8`
- `--bg-sidebar: #F0F0EE`
- `--bg-card: #FFFFFF`
- `--bg-hover: #E5E5EA`
- `--text-primary: #1C1C1E`
- `--text-secondary: #8E8E93`
- `--text-muted: #AEAEB2`
- `--accent: #E07000`
- `--accent-light: #F5840C`
- `--success: #2D8A4E`
- `--danger: #D42B2B`

### 3.2 Reglas de uso
- **Accent naranja:** solo en CTAs primarios, logo, badges de high intent, barra activa.
- **Sin bordes 1px solid.** Separación solo con diferencias de `background-color` (+8 a +12 luminosidad).
- **Tipografía:** Outfit, weights 400/500/600/700/800/900.
- **Spacing base:** 4px. Todo múltiplo de 4.
- **Theme switch:** respetar `prefers-color-scheme` + override manual guardado en Supabase (`users.theme_preference`).

### 3.3 Logo

Archivo SVG en `packages/ui/logo.tsx`. Icono + wordmark ("Redd" en `--text-primary`, "Prowl" en `--accent`).

---

## 4. Database Schema (Supabase)

### 4.1 Tablas nuevas del módulo Outbound

Crear migration en `packages/database/migrations/YYYYMMDDHHMMSS_outbound_system.sql`.

```sql
-- 4.1.1 Campañas de outreach
CREATE TABLE dm_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('lead', 'thread', 'subreddit')),
  source_url      TEXT,
  source_config   JSONB NOT NULL DEFAULT '{}',
    -- Lead: { min_intent_score: 70, filter_competitor: true }
    -- Thread: { post_url, skip_op: true, first_level_only: true }
    -- Subreddit: { subreddit: 'saas', time_range: 'week' }
  message_template TEXT NOT NULL,
  message_variants JSONB DEFAULT '[]',
    -- Array de variantes generadas por IA
    -- [{ id, text, used_count }]
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  daily_limit     INT NOT NULL DEFAULT 25 CHECK (daily_limit BETWEEN 1 AND 100),
  delay_min_sec   INT NOT NULL DEFAULT 4 CHECK (delay_min_sec >= 2),
  delay_max_sec   INT NOT NULL DEFAULT 8 CHECK (delay_max_sec <= 30),
  skip_contacted  BOOL NOT NULL DEFAULT TRUE,
  sent_count      INT NOT NULL DEFAULT 0,
  reply_count     INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.1.2 Queue de destinatarios por campaña
CREATE TABLE dm_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  reddit_username TEXT NOT NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
    -- solo para lead campaigns
  source_context  JSONB DEFAULT '{}',
    -- { post_title, post_body_summary, subreddit, intent_score }
  priority        INT NOT NULL DEFAULT 50,
    -- Lead campaigns: intent_score directo. Thread/sub: 50 por defecto.
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  error_reason    TEXT,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, reddit_username)
);

-- 4.1.3 Log de DMs enviados (histórico)
CREATE TABLE dm_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  queue_item_id   UUID REFERENCES dm_queue(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  reddit_username TEXT NOT NULL,
  message_sent    TEXT NOT NULL,
  variant_id      TEXT,
    -- ID de la variante usada (de message_variants del campaign)
  response_received BOOL NOT NULL DEFAULT FALSE,
  response_text   TEXT,
  response_at     TIMESTAMPTZ,
  outcome         TEXT DEFAULT 'pending'
                  CHECK (outcome IN ('pending', 'replied', 'interested', 'closed_won', 'closed_lost', 'no_response')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ
);

-- 4.1.4 Lista global de usernames a ignorar (por proyecto)
CREATE TABLE dm_ignored_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reddit_username TEXT NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, reddit_username)
);

-- 4.1.5 Tokens de conexión de la extensión (JWT tokens de larga duración)
CREATE TABLE extension_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,  -- SHA-256 del token, nunca guardar el plain
  label           TEXT,                   -- "Chrome en MacBook", etc.
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.1.6 Tokens one-time para el flujo de connect (5 min TTL)
CREATE TABLE extension_connect_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  consumed_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dm_campaigns_user ON dm_campaigns(user_id, status);
CREATE INDEX idx_dm_campaigns_project ON dm_campaigns(project_id);
CREATE INDEX idx_dm_queue_campaign_status ON dm_queue(campaign_id, status);
CREATE INDEX idx_dm_queue_priority ON dm_queue(campaign_id, status, priority DESC)
  WHERE status = 'pending';
CREATE INDEX idx_dm_log_user_sent ON dm_log(user_id, sent_at DESC);
CREATE INDEX idx_dm_log_campaign ON dm_log(campaign_id);
CREATE INDEX idx_dm_log_username ON dm_log(reddit_username);
CREATE INDEX idx_dm_log_lead ON dm_log(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_dm_log_pending_sync ON dm_log(last_synced_at NULLS FIRST)
  WHERE response_received = FALSE;
CREATE INDEX idx_dm_ignored_project ON dm_ignored_users(project_id, reddit_username);
CREATE INDEX idx_ext_tokens_user ON extension_tokens(user_id) WHERE revoked_at IS NULL;
```

### 4.2 Modificaciones a tablas existentes

```sql
-- La tabla `leads` ya existe (del inbound). Agregar columnas:
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS dm_status TEXT DEFAULT 'none'
    CHECK (dm_status IN ('none', 'queued', 'sent', 'responded', 'interested', 'closed_won', 'closed_lost')),
  ADD COLUMN IF NOT EXISTS dm_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dm_campaign_id UUID REFERENCES dm_campaigns(id) ON DELETE SET NULL;

CREATE INDEX idx_leads_dm_status ON leads(project_id, dm_status) WHERE dm_status != 'none';

-- La tabla `users` ya existe. Agregar límite de DMs mensuales:
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dm_monthly_limit INT DEFAULT 0,
    -- Setea según plan: Starter=0, Growth=500, Enterprise=2000
  ADD COLUMN IF NOT EXISTS dm_monthly_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_cycle_resets_at TIMESTAMPTZ;
```

### 4.3 Row Level Security (RLS)

**Crítico.** Todas las tablas nuevas deben tener RLS habilitado. Un usuario solo puede leer/escribir sus propios datos.

```sql
ALTER TABLE dm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_ignored_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_connect_tokens ENABLE ROW LEVEL SECURITY;

-- Ejemplo para dm_campaigns (replicar pattern en todas):
CREATE POLICY "Users can view own campaigns"
  ON dm_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON dm_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON dm_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON dm_campaigns FOR DELETE
  USING (auth.uid() = user_id);
```

Para `dm_queue` y `dm_log`, la policy usa join con `dm_campaigns.user_id`. Para tablas con `project_id`, validar que el usuario es miembro del proyecto.

### 4.4 Función RPC para incrementar contadores atómicamente

```sql
CREATE OR REPLACE FUNCTION increment_dm_count(p_user_id UUID, p_campaign_id UUID)
RETURNS TABLE (allowed BOOL, remaining INT) AS $$
DECLARE
  v_monthly_used INT;
  v_monthly_limit INT;
  v_cycle_resets TIMESTAMPTZ;
BEGIN
  -- Lock row
  SELECT dm_monthly_used, dm_monthly_limit, dm_cycle_resets_at
    INTO v_monthly_used, v_monthly_limit, v_cycle_resets
    FROM users WHERE id = p_user_id
    FOR UPDATE;

  -- Reset del ciclo si ya pasó la fecha
  IF v_cycle_resets < NOW() THEN
    UPDATE users
      SET dm_monthly_used = 0,
          dm_cycle_resets_at = NOW() + INTERVAL '30 days'
      WHERE id = p_user_id;
    v_monthly_used := 0;
  END IF;

  IF v_monthly_used >= v_monthly_limit THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  UPDATE users SET dm_monthly_used = dm_monthly_used + 1
    WHERE id = p_user_id;
  UPDATE dm_campaigns SET sent_count = sent_count + 1
    WHERE id = p_campaign_id;

  RETURN QUERY SELECT TRUE, (v_monthly_limit - v_monthly_used - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Types y Contratos (packages/api-contracts)

Todos los tipos y schemas compartidos entre extension y web. Claude Code debe generar los types de Supabase automáticamente con `supabase gen types typescript`.

```typescript
// packages/api-contracts/src/campaigns.ts
import { z } from "zod";

export const campaignTypeSchema = z.enum(["lead", "thread", "subreddit"]);
export type CampaignType = z.infer<typeof campaignTypeSchema>;

export const createCampaignSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: campaignTypeSchema,
  sourceConfig: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("lead"),
      minIntentScore: z.number().min(1).max(100).default(70),
      filterCompetitor: z.boolean().default(false),
      maxLeads: z.number().min(1).max(500).default(100),
    }),
    z.object({
      type: z.literal("thread"),
      postUrl: z.string().url(),
      skipOp: z.boolean().default(true),
      firstLevelOnly: z.boolean().default(true),
    }),
    z.object({
      type: z.literal("subreddit"),
      subreddit: z.string().regex(/^[a-zA-Z0-9_]{1,21}$/),
      timeRange: z.enum(["day", "week", "month"]).default("week"),
      maxUsers: z.number().min(1).max(500).default(100),
    }),
  ]),
  messageTemplate: z.string().min(10).max(1000),
  dailyLimit: z.number().min(1).max(100).default(25),
  delayMinSec: z.number().min(2).max(30).default(4),
  delayMaxSec: z.number().min(2).max(30).default(8),
  skipContacted: z.boolean().default(true),
}).refine(data => data.delayMaxSec >= data.delayMinSec, {
  message: "delayMaxSec debe ser >= delayMinSec",
});

// ...(resto de schemas: update, dmLog, etc.)
```

**Regla:** todos los endpoints REST validan input con Zod. El output también es tipado (pattern: schema + parse en response).

---

## 6. API Endpoints (Next.js App Router)

Todos en `apps/web/app/api/ext/`. La extensión los consume con JWT en header.

### 6.1 Auth flow

Generar tokens con HMAC usando `EXTENSION_JWT_SECRET`. Payload: `{ userId, tokenId, iat, exp }`. TTL: 90 días.

**`POST /api/ext/connect`** — intercambia one-time token por JWT de larga duración.

```typescript
// Request
{ connectToken: string }

// Response 200
{
  jwt: string,
  user: { id, email, plan, dmMonthlyLimit, dmMonthlyUsed },
  project: { id, name, theme, accentColor }
}
```

Validaciones:
1. Token existe en `extension_connect_tokens`, no expirado, no consumido.
2. Marcar `consumed_at = NOW()`.
3. Generar JWT. Guardar hash en `extension_tokens`.
4. Retornar JWT + datos del usuario y proyecto activo.

**`GET /api/ext/status`** — verifica JWT, retorna estado del plan.

Middleware común: `middleware/verifyExtensionToken.ts` — parsea JWT, valida hash en `extension_tokens`, actualiza `last_used_at`, adjunta `userId` al contexto de la request.

### 6.2 Campaigns

- **`GET /api/ext/campaigns`** — lista de campañas del proyecto activo. Query params: `status`, `type`, `limit`, `offset`.
- **`POST /api/ext/campaigns`** — crear campaña. Body validado con `createCampaignSchema`. Al crear tipo `lead`, dispara job de Inngest que popula `dm_queue` con leads matching.
- **`GET /api/ext/campaigns/:id`** — detalle + stats en vivo (sent_count, reply_count, queue_pending, estimated_completion).
- **`PUT /api/ext/campaigns/:id`** — update. Solo permite cambiar `status`, `messageTemplate`, `dailyLimit`, `delayMinSec/Max`.
- **`POST /api/ext/campaigns/:id/start`** — cambia `status` a `active`, marca `started_at`.
- **`POST /api/ext/campaigns/:id/pause`** — cambia `status` a `paused`.
- **`DELETE /api/ext/campaigns/:id`** — solo si `status = 'draft'` o `'paused'`.

### 6.3 Queue

- **`GET /api/ext/campaigns/:id/queue/next`** — devuelve el próximo item `pending` con mayor priority. Marca como `sending` (optimistic lock con `UPDATE ... WHERE status = 'pending' RETURNING`). Si no hay items, devuelve 204. **Incluye** validación de daily_limit y monthly_limit.

Response:
```json
{
  "queueItemId": "...",
  "redditUsername": "user123",
  "message": "Hey user123, saw your comment about...",
  "variantId": "v2",
  "sourceContext": { "postTitle": "...", "subreddit": "saas" }
}
```

- **`POST /api/ext/queue/:id/result`** — extension reporta resultado del envío.
```json
{
  "status": "sent" | "failed" | "skipped",
  "errorReason": "rate_limited" | "account_suspended" | "user_blocks_dms" | "dom_error" | null,
  "sentAt": "2026-04-23T..."
}
```
Si `sent`: inserta en `dm_log`, actualiza `leads.dm_status`, llama a `increment_dm_count` RPC.
Si `failed/skipped`: actualiza `dm_queue.status` y `error_reason`. Si `rate_limited`, pausa la campaña 10 min con Inngest.

### 6.4 Respuestas

- **`POST /api/ext/dm-log/sync-responses`** — endpoint que la extensión llama cuando detecta respuestas al scrapear inbox. Body: `{ responses: [{ fromUsername, text, timestamp }] }`. El servidor matchea con `dm_log.reddit_username` y actualiza `response_received`, `response_text`, `response_at`. Emite evento Inngest `lead.dm.responded` para notificar al usuario en el dashboard.
- **`POST /api/ext/dm-log/:id/outcome`** — user marca outcome manualmente desde el CRM. Body: `{ outcome: "interested" | "closed_won" | ... }`. Sincroniza con `leads.dm_status`.

### 6.5 Ignored Users

- **`GET /api/ext/ignored`** — lista del proyecto activo.
- **`POST /api/ext/ignored`** — agregar.
- **`DELETE /api/ext/ignored/:id`** — remover.

### 6.6 Message Generation (IA)

- **`POST /api/ext/ai/generate-variants`** — genera 3-5 variantes de mensaje con spintax usando GPT-4o-mini.

Request:
```json
{
  "campaignType": "lead",
  "context": {
    "postTitle": "Best CRM for bootstrapped startups",
    "postBody": "...",
    "subreddit": "SaaS",
    "intentScore": 92
  },
  "productInfo": {
    "name": "...",
    "valueProposition": "..."
  },
  "tone": "engaging" | "direct" | "balanced"
}
```

Response:
```json
{
  "variants": [
    {
      "id": "v1",
      "template": "{Hey|Hi|Hola} {username}, {saw|noticed} your {post|comment} about...",
      "preview": "Hey user123, saw your post about..."
    }
  ]
}
```

Prompt del sistema (en `apps/web/app/api/ext/ai/generate-variants/prompt.ts`):
```
You are generating DM templates for Reddit outreach. CRITICAL rules:
- Must sound human, NEVER corporate.
- Length: max 3 short sentences, <300 chars.
- Include spintax {option1|option2|option3} on greeting + 1-2 key phrases.
- Reference the user's post context naturally.
- End with a soft question, NOT a pitch.
- Avoid: "solution", "innovative", "revolutionary", "leading", "platform".
- Use: "tool", "thing I built", "what I use", "saw you mentioned".
- Match the tone: {tone}.
Return JSON: { variants: [{ id, template, preview }] }
```

---

## 7. Chrome Extension (apps/extension)

### 7.1 Manifest V3

`apps/extension/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "ReddProwl Outbound",
  "description": "Reddit outreach, powered by your ReddProwl leads.",
  "version": "0.1.0",
  "action": { "default_title": "ReddProwl" },
  "side_panel": { "default_path": "sidepanel.html" },
  "permissions": ["storage", "alarms", "tabs", "scripting", "sidePanel"],
  "host_permissions": [
    "https://www.reddit.com/*",
    "https://old.reddit.com/*",
    "https://app.reddprowl.com/*"
  ],
  "background": { "service_worker": "background.js", "type": "module" },
  "content_scripts": [
    {
      "matches": ["https://www.reddit.com/*", "https://old.reddit.com/*"],
      "js": ["content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    { "resources": ["assets/*"], "matches": ["https://www.reddit.com/*"] }
  ],
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```

### 7.2 Estructura

```
apps/extension/
├── manifest.json
├── vite.config.ts
├── src/
│   ├── background/
│   │   ├── index.ts              # Service worker entry
│   │   ├── campaign-runner.ts    # Loop principal de ejecución
│   │   ├── alarms.ts             # chrome.alarms para keepalive
│   │   ├── api-client.ts         # Fetch a /api/ext/*
│   │   ├── response-poller.ts    # Polling de inbox cada 5 min
│   │   └── storage.ts            # Wrapper de chrome.storage
│   ├── content/
│   │   ├── index.ts              # Entry del content script
│   │   ├── messenger.ts          # Enviar DM emulando humano
│   │   ├── scraper.ts            # Scrape comentaristas/subreddit/inbox
│   │   └── dom-selectors.ts      # Selectores DOM de Reddit (abstraídos)
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ConnectFlow.tsx   # Pantalla "conectar a ReddProwl"
│   │   │   ├── CampaignList.tsx
│   │   │   ├── CampaignDetail.tsx
│   │   │   ├── ActiveProgress.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCampaigns.ts
│   │   │   └── useBackgroundStatus.ts
│   │   └── store.ts              # Zustand store
│   └── shared/
│       ├── messages.ts           # Tipos de chrome.runtime messages
│       └── constants.ts
├── public/
│   └── icons/
└── tsconfig.json
```

### 7.3 Flujo de conexión

1. Usuario abre el side panel. Si no hay JWT en `chrome.storage.sync`, muestra pantalla "Conectar a ReddProwl".
2. Botón "Conectar" abre `https://app.reddprowl.com/settings/extension` en nueva tab.
3. En el dashboard, el user hace click en "Generar token". El backend crea un `extension_connect_token` con TTL 5 min y lo muestra.
4. El user copia el token y lo pega en la extensión (o usa deep link `chrome-extension://.../sidepanel.html?token=XXX`).
5. La extensión llama `POST /api/ext/connect` con el connect token.
6. Recibe el JWT, lo guarda en `chrome.storage.sync` (se sincroniza entre dispositivos).
7. Muestra el dashboard de la extensión.

### 7.4 Campaign Runner (Service Worker)

**Loop principal** en `background/campaign-runner.ts`:

```typescript
// Pseudocódigo
async function runActiveCampaign() {
  const activeCampaign = await getActiveCampaign();
  if (!activeCampaign) return;

  const tab = await getActiveRedditTab();
  if (!tab) {
    // Sin tab de Reddit abierto, pausar
    notify("Abrí Reddit en una pestaña para continuar la campaña");
    return;
  }

  // Check daily limit
  const sentToday = await getSentCountToday(activeCampaign.id);
  if (sentToday >= activeCampaign.dailyLimit) {
    await pauseCampaign(activeCampaign.id, "daily_limit_reached");
    return;
  }

  // Pedir próximo destinatario al backend
  const next = await api.getNextInQueue(activeCampaign.id);
  if (!next) {
    await completeCampaign(activeCampaign.id);
    return;
  }

  // Delay random gaussiano dentro del rango
  const delay = gaussianDelay(
    activeCampaign.delayMinSec * 1000,
    activeCampaign.delayMaxSec * 1000
  );
  await sleep(delay);

  // 20% de chance de pausa larga (simulación humana)
  if (Math.random() < 0.2) {
    await sleep(delay * 2);
  }

  // Ejecutar envío en content script
  const result = await chrome.tabs.sendMessage(tab.id, {
    type: "SEND_DM",
    payload: {
      username: next.redditUsername,
      message: renderSpintax(next.message),
    },
  });

  // Reportar resultado
  await api.reportQueueResult(next.queueItemId, result);

  // Loop
  scheduleNextRun();
}

function scheduleNextRun() {
  chrome.alarms.create("campaign-runner", { when: Date.now() + 1000 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "campaign-runner") runActiveCampaign();
});
```

**Keepalive crítico MV3:** El service worker se duerme a los 30s sin actividad. Usar `chrome.alarms` (no `setTimeout`) para agendar el próximo tick. El alarm despierta el SW.

### 7.5 Content Script: Messenger

`content/messenger.ts` — envía un DM navegando al compose URL:

```typescript
async function sendDM(username: string, message: string): Promise<SendDMResult> {
  // 1. Navegar al compose URL
  const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(username)}`;
  window.location.href = composeUrl;

  // 2. Esperar que cargue el formulario (timeout 10s)
  const textarea = await waitForElement(SELECTORS.messageTextarea, 10000);
  if (!textarea) return { status: "failed", errorReason: "dom_error" };

  // 3. Detectar errores pre-envío
  if (document.querySelector(SELECTORS.userBlocksDms)) {
    return { status: "skipped", errorReason: "user_blocks_dms" };
  }
  if (document.querySelector(SELECTORS.accountSuspended)) {
    return { status: "failed", errorReason: "account_suspended" };
  }

  // 4. Escribir subject + message con eventos reales
  const subject = document.querySelector(SELECTORS.messageSubject);
  if (subject) {
    simulateTyping(subject, generateSubject());
    await randomDelay(600, 1400);
  }
  simulateTyping(textarea, message);
  await randomDelay(1000, 2500);

  // 5. Click en submit
  const submitBtn = document.querySelector(SELECTORS.sendButton);
  if (!submitBtn) return { status: "failed", errorReason: "dom_error" };
  submitBtn.click();

  // 6. Detectar success vs rate limit
  const result = await Promise.race([
    waitForElement(SELECTORS.successIndicator, 8000).then(() => "sent"),
    waitForElement(SELECTORS.rateLimitedIndicator, 8000).then(() => "rate_limited"),
  ]);

  return result === "sent"
    ? { status: "sent" }
    : { status: "failed", errorReason: "rate_limited" };
}

function simulateTyping(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el), "value"
  )?.set;
  nativeSetter?.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}
```

**Selectores centralizados** en `content/dom-selectors.ts`. Los selectores de Reddit cambian — mantenerlos en un solo archivo facilita updates.

### 7.6 Content Script: Scraper

Tres modos según tipo de campaña:

- **Thread:** navega al post URL, scrolea hasta el final para cargar todos los comentarios, extrae `author` de cada `.Comment` (o el selector actual). Filtra OP si `skipOp`. Si `firstLevelOnly`, solo toma `.Comment` cuyo parent es `.Post`.
- **Subreddit:** navega a `/r/{sub}/top?t={timeRange}`, extrae autores de los primeros N posts. Iterar "load more" si es necesario.
- **Inbox (para response polling):** navega a `/message/inbox`, extrae mensajes nuevos (sin leer), compara `from` con `dm_log`, envía matches al backend.

### 7.7 Response Poller

En `background/response-poller.ts`. Corre cada 5 min via `chrome.alarms`. Solo corre si hay campaña activa y tab de Reddit abierto.

```typescript
chrome.alarms.create("response-poller", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "response-poller") return;
  const hasActive = await hasActiveCampaign();
  const tab = await getActiveRedditTab();
  if (!hasActive || !tab) return;

  // Inyectar scraper de inbox
  const responses = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeInboxResponses,
  });

  if (responses.length > 0) {
    await api.syncResponses(responses);
  }
});
```

### 7.8 Side Panel UI

**Pantalla principal** cuando hay JWT válido:

```
┌─────────────────────────────────┐
│  [Logo] ReddProwl        [user] │
├─────────────────────────────────┤
│                                 │
│  📊 Quick Stats                 │
│  DMs hoy: 12 / 25               │
│  Response rate: 18%             │
│  Plan: Growth (500/mes)         │
│                                 │
├─────────────────────────────────┤
│  🎯 Active Campaign             │
│  ┌───────────────────────────┐  │
│  │ Backlink Builders Outreach│  │
│  │ ████████░░░░░  24/50      │  │
│  │ Lead campaign · Score 70+ │  │
│  │                           │  │
│  │ [Pause] [View Details]    │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠️ Mantené esta pestaña de    │
│  Reddit abierta para continuar  │
│                                 │
├─────────────────────────────────┤
│  📋 All Campaigns               │
│  [+ New Campaign]               │
│                                 │
│  ○ Growth Hackers (paused)      │
│  ✓ SaaS Founders (done)         │
│  ○ HubSpot Switchers (draft)    │
│                                 │
└─────────────────────────────────┘
```

**Crear campaña** — wizard de 3 pasos:
1. Tipo (Lead / Thread / Subreddit) + fuente (filtros o URL).
2. Mensaje (con preview de variantes generadas por IA, editables).
3. Settings (daily limit, delays, skip contacted).

---

## 8. Dashboard — Lead CRM Module

Agregar al dashboard existente (`apps/web`). Nueva sección en el sidebar después de "Threads":

```
📥 Searchbox
💬 Threads
📤 Outbound        ← NUEVO
📡 Mentions
🔬 Content Lab
📊 Analytics
```

### 8.1 Rutas

```
/dashboard/outbound                 # overview de campañas
/dashboard/outbound/campaigns/:id   # detalle de campaña + leads contactados
/dashboard/outbound/crm             # pipeline de leads contactados
/dashboard/outbound/settings        # ignored users + plan limits
/dashboard/settings/extension       # generar connect token
```

### 8.2 Vista: Outbound Overview

`apps/web/app/dashboard/outbound/page.tsx`

Layout:
- **Header:** título "Outbound" + botón "New Campaign" + stats del mes (DMs used/limit, response rate global).
- **Active campaigns:** cards con progress bar, tipo, DMs enviados, pause/resume.
- **All campaigns:** tabla con columnas: name, type, status, sent, replies, rate, started, actions.
- **Empty state:** si no hay campañas, muestra hero: "Conectá la extensión para empezar" con link a `/dashboard/settings/extension`.

### 8.3 Vista: Campaign Detail

Tabs:
- **Overview:** stats detalladas, gráfico de DMs por día, response rate timeline, funnel (sent → replied → interested → won).
- **Queue:** tabla de `dm_queue` con status por item (pending/sending/sent/failed). Filtrable.
- **Messages:** variantes generadas con contador de uso de cada una. Botón "Regenerate variants".
- **Settings:** edit name, daily limit, delays. Solo editable si campaign está en draft/paused.

### 8.4 Vista: Lead CRM (core del módulo)

Tabla/kanban switcheable con leads que tuvieron interacción outbound:

**Columns (tabla):**
- Username (link a Reddit)
- Campaign origen
- Message sent (tooltip con mensaje completo)
- Sent at
- Response (si hay, preview + timestamp)
- Outcome (dropdown: pending / replied / interested / closed_won / closed_lost)
- Actions (abrir conversación en Reddit, marcar como won, notes)

**Filtros:**
- Por campaign
- Por outcome
- Por rango de fechas
- Búsqueda por username

**Kanban:**
4 columnas: Sent → Replied → Interested → Closed (Won/Lost). Drag & drop cambia el outcome.

### 8.5 Vista: Settings > Extension

`/dashboard/settings/extension`

- Estado: "Conectada" (con device label + last used) o "No conectada".
- Botón "Generar connect token" — abre modal con el token visible 5 min + instrucciones para pegarlo en la extensión.
- Lista de tokens activos con botón "Revocar" en cada uno.

---

## 9. Enforcement de Plan y Límites

### 9.1 Matriz de límites

Configurar en `packages/database/src/plans.ts`:

```typescript
export const OUTBOUND_LIMITS = {
  starter: {
    dmMonthlyLimit: 0,           // no incluido
    activeCampaignsLimit: 0,
  },
  growth: {
    dmMonthlyLimit: 500,
    activeCampaignsLimit: 3,
  },
  enterprise: {
    dmMonthlyLimit: 2000,
    activeCampaignsLimit: 999,  // ilimitadas
  },
} as const;
```

### 9.2 Enforcement en endpoints

- `POST /api/ext/campaigns` — cuenta campañas con status `active`. Si >= limit, 403.
- `POST /api/ext/campaigns/:id/start` — mismo check.
- `GET /api/ext/queue/:id/next` — check monthly limit. Si exceeded, 403 + pausa automática.

### 9.3 UI

Cuando el user es Starter y entra a `/dashboard/outbound`, mostrar upgrade wall:

```
🚀 Outbound requiere plan Growth
Desbloqueá 500 DMs/mes + 3 campañas activas.
[Upgrade to Growth]
```

---

## 10. Seguridad y Compliance

### 10.1 Rate limiting

En el backend, usar `@upstash/ratelimit` (ya existe):
- `POST /api/ext/queue/:id/result`: 60 req/min por user.
- `POST /api/ext/ai/generate-variants`: 10 req/min por user.
- `POST /api/ext/connect`: 5 req/min por IP.

### 10.2 Terms of Service

Agregar cláusulas en los ToS de ReddProwl:
1. El user es responsable del cumplimiento de Reddit's User Agreement y subreddit rules.
2. Prohibido usar la extensión para spam, harassment o manipulación de votos.
3. ReddProwl no se responsabiliza por bans de cuentas de Reddit.
4. El user acepta los límites de plan.

Al generar un connect token la primera vez, el user debe aceptar estos ToS específicos del outbound (checkbox explícito).

### 10.3 No trackear contenido de DMs como PII

Los mensajes enviados (`dm_log.message_sent`) contienen data escrita por el user, no PII. Pero las respuestas (`dm_log.response_text`) pueden contener PII de terceros. Aplicar:
- Guardar solo los primeros 500 chars.
- Opción en Settings: "No guardar texto de respuestas, solo el timestamp y username".
- GDPR delete: al borrar usuario, cascade delete a `dm_log`.

### 10.4 Extension hardening

- CSP estricto en el side panel: solo scripts del propio origin.
- Nunca loggear el JWT en console.
- Clear storage al revocar token desde el dashboard (via check de validez en cada API call).

---

## 11. Testing

### 11.1 Unit tests

- `packages/spintax`: parser, render, variant extraction — Vitest.
- `packages/api-contracts`: schema validation — Vitest.
- `apps/web/app/api/ext/*`: endpoints con mocks de Supabase — Vitest.

### 11.2 Integration tests

- Flujo completo: create campaign → populate queue → sent result → dm_log inserted → lead updated.
- Usar Supabase local (docker-compose) para tests de DB.

### 11.3 E2E de la extension

Playwright con `chromium` + `--load-extension`:
- Test: connect flow completo.
- Test: mock de reddit.com con fixture HTML, verificar que el content script scrapea correctamente.
- Test: campaign runner envía DM (mocked) y reporta al backend.

### 11.4 Manual QA checklist

- [ ] Send DM en cuenta de Reddit real (staging).
- [ ] Daily limit enforcement.
- [ ] Rate limit response de Reddit pausa la campaña 10 min.
- [ ] Tab close pausa la campaña.
- [ ] Tab reopen resume la campaña automáticamente.
- [ ] Response polling detecta respuesta y actualiza dashboard.
- [ ] Theme switch en extension y dashboard se sincroniza.

---

## 12. Plan de Implementación (por fases)

### Fase 1 — Infraestructura del monorepo (semana 1)

**Objetivo:** monorepo funcional, database schema aplicado, nuevo módulo Outbound accesible en el dashboard (pantalla vacía).

- [ ] Setup Turborepo + pnpm workspaces.
- [ ] Crear `packages/database`, `packages/api-contracts`, `packages/spintax`.
- [ ] Migrations del outbound system aplicadas en Supabase.
- [ ] RLS policies verificadas (test manual con users distintos).
- [ ] Nav item "Outbound" agregado en el dashboard.
- [ ] Ruta `/dashboard/outbound` con empty state + link a settings/extension.
- [ ] Ruta `/dashboard/settings/extension` con botón "Generar token" funcionando (sin extension aún).
- [ ] CI: `turbo lint` + `turbo typecheck` pasan.

**Criterio de aceptación:** el user puede hacer login al dashboard, ver el nav de Outbound, y generar un connect token (que aparece en la DB).

### Fase 2 — Extension base + conexión (semana 2)

**Objetivo:** extensión instalable que conecta con el dashboard.

- [ ] `apps/extension` con Vite + vite-plugin-crx configurado.
- [ ] Manifest V3 con side panel.
- [ ] Zustand store.
- [ ] Pantalla de conexión con flujo completo (paste token → JWT guardado).
- [ ] `api-client.ts` con fetch wrapper + auth header.
- [ ] Tailwind config compartido desde `packages/ui`.
- [ ] Build produce un zip instalable en Chrome.

**Criterio de aceptación:** instalás la extension, generás un token en el dashboard, lo pegás en la extension, y ves el dashboard de la extension con tu email y plan.

### Fase 3 — Thread Campaign end-to-end (semana 3)

**Objetivo:** un tipo de campaña funcional completa. Validar toda la arquitectura.

- [ ] Endpoints `/api/ext/campaigns` (CRUD).
- [ ] Endpoint `/api/ext/queue/:id/next` + `/result`.
- [ ] Content script: scraper de thread.
- [ ] Content script: messenger con gaussian delays y simulateTyping.
- [ ] Background: campaign runner loop con chrome.alarms.
- [ ] Side panel: wizard de crear Thread Campaign.
- [ ] Side panel: progress view durante envío.
- [ ] Dashboard: vista Campaign Detail con queue view en vivo.
- [ ] Spintax parser + renderer funcionando.
- [ ] Ignored users funcional.

**Criterio de aceptación:** creás una thread campaign desde la extension, pegás URL de un post, la extension scrapea comentaristas, envía DMs (en cuenta de test), y aparecen en el dashboard en tiempo real.

### Fase 4 — Lead Campaign + IA (semana 4)

**Objetivo:** el diferencial del producto — campañas basadas en el lead inbox con mensajes generados por IA.

- [ ] Endpoint `/api/ext/ai/generate-variants` con OpenAI.
- [ ] Inngest job que popula `dm_queue` al crear una lead campaign (filtrado por intent score).
- [ ] UI de creación de Lead Campaign con preview de leads matching + variantes generadas.
- [ ] Context-aware: cada DM usa el título/body del post del lead específico como contexto (regenera template por lead).
- [ ] Vista CRM en el dashboard funcional con filtros, outcomes, kanban.

**Criterio de aceptación:** creás una lead campaign, la IA te sugiere 3 variantes de mensaje, la queue se popula con leads de score ≥70 ordenados por score DESC, y al enviar, el mensaje de cada DM referencia el post específico del lead.

### Fase 5 — Subreddit Campaign + Response Polling (semana 5)

**Objetivo:** tercer tipo de campaña + detección automática de respuestas.

- [ ] Scraper de subreddit (top users del timerange).
- [ ] UI de Subreddit Campaign.
- [ ] Content script de scraping de inbox.
- [ ] Background response poller con `chrome.alarms` cada 5 min.
- [ ] Endpoint `/api/ext/dm-log/sync-responses`.
- [ ] Notificación en el dashboard (toast + badge) cuando llega respuesta.
- [ ] Inngest event `lead.dm.responded` que actualiza `leads.dm_status`.

**Criterio de aceptación:** un DM recibe respuesta en Reddit, a los 5 min el dashboard muestra el lead como "replied" y el user recibe notificación.

### Fase 6 — Plan enforcement + hardening (semana 6)

**Objetivo:** listo para beta privada.

- [ ] Enforcement de `OUTBOUND_LIMITS` en todos los endpoints críticos.
- [ ] Upgrade wall para Starter.
- [ ] Rate limiting con Upstash en endpoints sensibles.
- [ ] Toast de error claro cuando hits daily/monthly limit.
- [ ] Automatic pause en rate limit de Reddit (10 min).
- [ ] Shadowban check previo al start de campaign (reutilizar lógica del inbound).
- [ ] ToS específico del outbound con checkbox en el connect flow.
- [ ] Tests E2E del flujo completo con Playwright.
- [ ] Documentación en `/docs/outbound.md` del monorepo.

**Criterio de aceptación:** un beta tester del plan Growth puede usar el sistema completo durante una semana sin encontrarse con errores críticos, y un user del plan Starter ve el upgrade wall y no puede crear campañas.

---

## 13. Gotchas y edge cases

1. **MV3 service worker muere a los 30s.** Siempre usar `chrome.alarms`, nunca `setTimeout` para tareas diferidas. El alarm despierta el SW.
2. **Reddit cambia DOM frecuentemente.** Abstraer todos los selectores en `dom-selectors.ts`. Si un selector falla, log específico + fallback a selector alternativo + report a Sentry.
3. **Tab inactive pausa campaña.** Detectar con `chrome.tabs.onActivated` y `chrome.windows.onFocusChanged`. UI debe mostrar estado "Paused — tab inactive".
4. **Usuario hace logout del dashboard.** El JWT de la extensión sigue siendo válido (son tokens independientes). Invalidar via `/api/ext/tokens/:id/revoke` desde el dashboard.
5. **Race condition en queue.** Dos instances del SW podrían pedir `getNext` al mismo tiempo. Usar `UPDATE ... WHERE status = 'pending' RETURNING` con row-level lock (Supabase lo hace con `FOR UPDATE SKIP LOCKED`).
6. **Mensaje con spintax malformado.** Validar spintax en backend al crear campaign. Rechazar si hay `{` sin cerrar.
7. **User borra su cuenta Reddit.** La campaña sigue activa pero todos los envíos fallan. Detectar patrón (3+ failures con `account_suspended`) y pausar todas las campañas del user.
8. **Dark mode en Reddit afecta scraping.** Los selectores deben funcionar en ambos temas de Reddit (el de ellos, no el de la extensión). Testear ambos.
9. **Reddit Chat vs classic PMs.** La extensión solo soporta `reddit.com/message/compose/` (PMs clásicos). NO tocar Reddit Chat en MVP.
10. **User conecta extensión pero el proyecto activo no tiene leads.** Lead Campaign debe mostrar "No hay leads con intent score ≥ 70. Ajustá el threshold o esperá a que el inbound detecte leads."

---

## 14. Métricas de éxito del módulo

Trackear en PostHog (ya integrado en el dashboard):

- **Activation:** % de users que conectan la extensión en la primera semana.
- **Engagement:** DMs enviados por user activo por semana.
- **Retention:** % de users con campaña activa en semana N+1.
- **Outcome:** % de DMs con respuesta.
- **Conversion:** % de respuestas marcadas como `closed_won`.
- **Error rate:** % de queue items con `status='failed'`.


## 16. Checklist final antes de mergear cada fase

- [ ] Tipos generados de Supabase actualizados (`supabase gen types typescript`).
- [ ] Tests pasan (`turbo test`).
- [ ] Lint + typecheck pasan (`turbo lint typecheck`).
- [ ] Build de extension produce `.zip` instalable.
- [ ] Dashboard build pasa (`turbo build --filter=web`).
- [ ] Migration aplicada en Supabase staging.
- [ ] RLS policies testeadas con usuario no-owner.
- [ ] Variables de entorno documentadas en `.env.example`.
- [ ] Changelog actualizado.
- [ ] Demo video de la fase (loom o similar).

---

**Este prompt es la única fuente de verdad para la implementación del módulo Outbound. Si algo no está acá, preguntá antes de asumir.**
