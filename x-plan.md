# X Integration — Build Plan

Estado actual: pipeline técnico completo y funcionando (webhook, Inngest, clasificador, DB). Lo que falta es llevar la **experiencia de usuario** al nivel del pipeline de Reddit.

---

## P0 — Crítico (hace X usable, sin esto está incompleto)

### 1. Reply generator para X posts
El gap más grande. Reddit leads tienen `ReplyEditor` con generación de múltiples drafts con IA. X posts solo tienen "Dismiss" y "Open on X".

#### 1a. State machine — migration 029

El enum `reply_generation_status` (`idle/generating/ready/failed`) ya existe en DB (migration 007). Reutilizarlo añadiendo a `x_posts`:

```sql
alter table public.x_posts
  add column reply_generation_status public.reply_generation_status not null default 'idle',
  add column reply_generation_error  text,
  add column reply_generation_requested_at  timestamptz,
  add column reply_generation_completed_at  timestamptz;

create table public.x_post_replies (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  x_post_id   uuid not null references public.x_posts(id)  on delete cascade,
  content     text not null,
  style       text not null,         -- 'engaging' | 'direct' | 'concise'
  was_used    boolean not null default false,
  created_at  timestamptz not null default now()
);
-- RLS: members can read, service_role can insert
```

`XPostDTO` (domain.ts) debe exponer los cuatro campos de estado una vez regenerados los tipos.

#### 1b. Mutations — `src/db/mutations/x.ts`

Tres funciones paralelas a `lead-replies.ts`:

```ts
// Guard idéntico al de Reddit: solo avanza si status IN ('idle','failed')
requestXPostReplyGeneration(projectId, xPostId): Promise<boolean>
  → update x_posts set reply_generation_status='generating', error=null,
    requested_at=now(), completed_at=null
    where id=xPostId and reply_generation_status in ('idle','failed')
    return Boolean(data)   // false = ya estaba generando, no enviar evento

completeXPostReplyGeneration({projectId, xPostId, userId, replies}): Promise<void>
  → insert into x_post_replies (rows)
  → update x_posts set reply_generation_status='ready', completed_at=now()

failXPostReplyGeneration(projectId, xPostId, message): Promise<void>
  → update x_posts set reply_generation_status='failed', error=message.slice(0,2000),
    completed_at=now()
```

`listXPostReplies(projectId, xPostId)` en `src/db/queries/x.ts`.

#### 1c. Inngest — `src/inngest/functions/generate-x-reply.ts`

```ts
triggers: [{ event: "x/reply.generate.requested" }]
onFailure: → failXPostReplyGeneration(projectId, xPostId, error.message)

steps:
  1. "load context"  → getXPostById + project details
  2. "generate engaging reply" → generateXReplyVariant(context, "engaging")
  3. "generate direct reply"   → generateXReplyVariant(context, "direct")
  4. "generate concise reply"  → generateXReplyVariant(context, "concise")
  5. "save replies"            → completeXPostReplyGeneration(...)
```

Registrar en `src/inngest/functions/index.ts`.

#### 1d. Reply generator — `src/modules/x/x-reply-generator.ts`

**No comparte nada con `reply-generator.ts` de Reddit.** Módulo independiente con prompt, estilos y anti-patrones propios de X.

Diferencias estructurales clave respecto a Reddit:

| Dimensión | Reddit | X |
|-----------|--------|---|
| Longitud máxima | 900 tokens output (~1500 chars) | ≤280 chars hard limit (Zod: `max(280)`) |
| Estilos | `engaging / direct / balanced` | `hook / reply / mention` |
| Intent strategies | 5 tipos basados en `intent_type` | No existe — tweets son demasiado cortos para esa granularidad |
| Few-shot examples | Largos, multi-párrafo | Cortos, 1-2 líneas por ejemplo |
| URL del producto | Incluida estratégicamente | Evitar salvo fit obvio — X penaliza links |
| temperature | 0.4 | 0.7 — X necesita más variedad y creatividad |
| max_output_tokens | 900 | 120 |

**Estilos para X:**

- `hook` — Observación o pregunta que engancha, sin mencionar el producto. Objetivo: que el autor responda. Ejemplo: *"El problema no es X, es que la mayoría automatiza antes de entender el flujo. ¿Probaste mapear el proceso primero?"*
- `reply` — Respuesta directa y útil, como un colega con contexto. Puede mencionar el producto si encaja naturalmente. Ejemplo: *"Esto es exactamente para lo que construimos [Producto] — si querés lo charlamos."*
- `mention` — Valor primero (dato, perspectiva, tip), producto al final como opción natural, sin URL. Ejemplo: *"Depende del volumen. Para <1000 contactos cualquier tool sirve; a partir de ahí la segmentación se vuelve crítica. Nosotros usamos [Producto] para eso."*

**Anti-patrones específicos de X:**

```
- Empezar con "Hey @username" — suena a bot
- Incluir hashtags — parece spam de marketing
- Más de 2 oraciones seguidas sin punto — X se lee en scroll rápido
- "Chequeá nuestro link en bio" — señal de cuenta comercial
- Emojis en exceso — uno máximo si el tono es casual
- Responder exactamente lo que ya dijo el tweet sin agregar nada
- "¡Exactamente!" / "Gran punto!" — bot flag igual que en Reddit
- URL del producto salvo en estilo `reply` cuando el fit es obvio
```

**Estructura del system prompt:**

```
Escribís replies en X para un equipo SaaS.
X no es Reddit ni LinkedIn. Las reglas son distintas:
- 280 chars max — cada palabra cuenta
- El scroll es rápido — la primera oración decide si leen el resto
- Los usuarios de X detectan cuentas de marketing al instante
- Un reply útil sin mención de producto vale más que un pitch que no aporta nada

[ANTI-PATRONES]
[EJEMPLOS — 3 buenos y 2 malos, todos ≤280 chars]
[ESTILO — instrucción del estilo solicitado]
```

**User prompt (mucho más corto que Reddit):**

```
Producto: {name}
Propuesta de valor: {value_proposition}
Tweet:
{text}
Keywords matcheadas: {keywords_matched}
Razón del clasificador: {classification_reason}

Escribí un reply estilo {style} de máximo 280 chars.
No incluyas URL. No uses hashtags.
```

Zod schema: `z.object({ content: z.string().trim().min(10).max(280) })` — el `max(280)` en el schema es el guard final independiente del prompt.

#### 1e. Server action — `src/modules/x/actions.ts`

```ts
export async function generateXReplyFromForm(formData: FormData) {
  // requireUser, extraer projectId + xPostId + returnTo
  // requestXPostReplyGeneration → si retorna false, redirect (ya en curso)
  // inngest.send("x/reply.generate.requested", { projectId, xPostId, userId })
  // revalidatePath("/feed") + redirect(returnTo)
}
```

#### 1f. UI — `XReplyEditor` en `app/feed/page.tsx`

Componente client-side paralelo a `ReplyEditor`:
- Tabs por style (Engaging / Direct / Concise) con botón Copy
- Char counter (≤280) en rojo si excede
- "Mark as Replied" llama a `updateXPostStatusFromForm` con `status=replied` + `was_used=true` en el reply seleccionado

En `XPostDetail`: añadir sección `.lead-comment-box` con:
```tsx
{isXGenerating ? (
  <div>Generating replies…</div>
) : (
  <XReplyEditor
    replies={xReplies}
    projectId={projectId}
    xPostId={post.id}
    permalink={post.permalink}
    returnTo={returnTo}
    generateForm={<form action={generateXReplyFromForm}>...</form>}
  />
)}
```

`isXGenerating = selectedXPost?.reply_generation_status === "generating"` — incluir en la condición de `AutoRefresh` junto con `isGenerating` de leads.

`xReplies` se carga en `FeedPage` con `listXPostReplies` cuando `selectedXPost` existe.

Nota: Los replies de X son ≤280 chars y en tono diferente a Reddit — el prompt debe reflejarlo.

---

### 2. Acción "Mark as Replied" en XPostDetail
Actualmente solo hay "Dismiss". Faltan las transiciones de estado explícitas.

- Añadir botón "Mark as Replied" que llame a `updateXPostStatusFromForm` con `status=replied`
- Mostrar `StatusPill` en `XPostCard` cuando `status !== "new"` (igual que `LeadCard`)
- En `XPostDetail` topbar: mostrar dot de color según status (rojo=new, verde=replied, gris=resto)

---

### 3. Filtros específicos para X en el feed
Cuando `type=x`, mostrar controles de triage similares a los de mentions. Hoy no hay ninguno.

Controls a añadir (sección paralela a los mention triage controls):
- **Relevance**: All / High (≥70) / Medium (40–69)
- **Sentiment**: All / Positive / Negative / Neutral
- **Sort**: Most Relevant (por `intent_score desc`) / Most Recent (por `posted_at desc`)

Implementación: misma técnica que mention triage controls — sección condicional `{feedType === "x" && (...)}` en el header del `opportunity-column`.

URL params cuando type=x: `xScore` (all/high/medium), `xSentiment`, `xSort`.

---

### 4. Badge del sidebar — mover el conteo al shell

**Problema de arquitectura actual:** `newLeadsCount` se calcula en cada página por separado y se pasa como prop a `DashboardShell`. Resultado: ~10 páginas que montan el shell (archive, content-lab, outbound, etc.) no pasan el prop y el badge muestra 0. Si sumamos X posts en `feed/page.tsx` solamente, el badge queda inconsistente según la ruta activa.

**Solución correcta:** mover el conteo dentro de `DashboardShellContent`, que ya es un server component async y ya tiene `currentProject.id`.

**`src/db/queries/leads.ts` (o nuevo `src/db/queries/counts.ts`):**

```ts
export async function getNewItemsCount(projectId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const [leadsResult, xPostsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "new"),
    supabase
      .from("x_posts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "new"),
  ]);
  return (leadsResult.count ?? 0) + (xPostsResult.count ?? 0);
}
```

**`app/components/dashboard-shell.tsx`:**

```ts
async function DashboardShellContent({ currentProject, ... }) {
  // Reemplaza el prop recibido — siempre fresco, en todas las páginas
  const newLeadsCount = await getNewItemsCount(currentProject.id);
  ...
}
```

Eliminar `newLeadsCount` del prop type de `DashboardShell` y `DashboardShellContent`. Las páginas que hoy lo calculan ellas mismas (feed, analytics, pipeline, etc.) dejan de pasarlo — el shell lo tiene internamente.

Nota: es una query `head: true` (COUNT sin fetch de filas) — muy barata, no impacta en performance.

---

### 5. XPostCard — mejoras de calidad visual
El card actual es muy básico comparado con LeadCard y MentionCard.

Añadir:
- `SentimentPill` (ya existe el componente para mentions, reutilizar)
- Verified badge `✓` junto al @username si `author_verified === true`
- `StatusPill` cuando `status !== "new"` (igual que LeadCard)
- Follower count si disponible: `· 12.4K followers` en la meta row
- Mostrar retweet_count además de like_count en la fila de stats

---

### 6. Aplicar migración y regenerar tipos
Tarea de infraestructura necesaria antes de que todo lo anterior funcione en prod.

```bash
npx supabase db push           # aplica 028_x_integration.sql en prod
npm run supabase:types         # regenera database.types.ts
```

---

## P1 — Importante (calidad profesional)

### 7. Guía de sintaxis de queries X en Settings
Las keywords de X Filtered Stream no son texto libre — tienen operadores propios. Los usuarios no lo saben.

Ejemplos de operadores clave:
```
-is:retweet              # excluir retweets (casi siempre necesario)
lang:en                  # solo inglés
has:links                # solo tweets con links
is:verified              # solo usuarios verificados
-is:reply                # excluir replies
"frase exacta"           # comillas para frase exacta
(termA OR termB)         # OR explícito
```

Qué hacer en Settings:
- En la sección X Keywords, añadir un collapsible "Query syntax reference" con tabla de operadores
- Tooltip en el input field: "Use X operators like `-is:retweet` and `lang:en`"
- Presets de ejemplo clicables: "Add `-is:retweet`" que appende al query actual

---

### 8. Sugerencias de keywords con IA para X

Reddit tiene `project_keyword_suggestions` generadas por IA. X no tiene equivalente, **y tiene un requisito adicional**: las queries de X Filtered Stream tienen sintaxis estricta. Una query inválida pasada a `addRules()` en `x-stream-rules.ts:68` hace que X API devuelva 4xx y el throw rompe el sync entero para todos los proyectos.

#### 8a. Validador previo — `validateXQuery` en `x-stream-rules.ts`

X API soporta `dry_run: true` en el endpoint de reglas — valida sin aplicar:

```ts
export async function validateXQuery(query: string): Promise<{ valid: boolean; error?: string }> {
  const response = await fetch(X_RULES_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ add: [{ value: query }], dry_run: true }),
  });

  if (response.ok) return { valid: true };

  const body = await response.json() as { errors?: Array<{ message: string }> };
  const message = body.errors?.[0]?.message ?? `HTTP ${response.status}`;
  return { valid: false, error: message };
}
```

Este helper se reutiliza en tres lugares (ver abajo).

#### 8b. Schema de la tabla — `x_keyword_suggestions`

A diferencia de Reddit (`project_keyword_suggestions` sin columna de status — aceptar/descartar es implícito vía delete), X necesita un campo `status` para persistir el resultado de validación:

```sql
create table public.x_keyword_suggestions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  query       text not null,
  rationale   text,
  status      text not null default 'pending',
  -- 'pending'  → generado por IA, sin acción del usuario
  -- 'invalid'  → falló dry_run al momento de generación
  -- (aceptado/descartado se manejan por delete, igual que Reddit)
  validation_error text,       -- mensaje de X API si status='invalid'
  created_at  timestamptz not null default now(),
  unique (project_id, query)
);
```

#### 8c. Flujo de generación — `x-keyword-suggestion-generator.ts`

Al generar sugerencias, validar cada query antes de persistir:

```ts
for (const suggestion of aiSuggestions) {
  const { valid, error } = await validateXQuery(suggestion.query);
  await supabase.from("x_keyword_suggestions").upsert({
    project_id: projectId,
    query: suggestion.query,
    rationale: suggestion.rationale,
    status: valid ? "pending" : "invalid",
    validation_error: error ?? null,
  }, { onConflict: "project_id,query" });
}
```

UI en Settings: mostrar `pending` con botones Accept/Dismiss; mostrar `invalid` como tarjeta deshabilitada con el error de X API visible (no ocultarlos — el usuario puede editar y re-validar manualmente).

#### 8d. Validación en accept — server action

Cuando el usuario acepta una sugerencia, re-validar antes de persistir a `x_keywords` (defensa ante queries que eran válidas al generarse pero pueden haber cambiado reglas de X):

```ts
export async function acceptXKeywordSuggestionFromForm(formData: FormData) {
  const query = String(formData.get("query") ?? "");
  const { valid, error } = await validateXQuery(query);

  if (!valid) {
    // Re-marcar sugerencia como invalid en DB y retornar el error al usuario
    await markXSuggestionInvalid(projectId, suggestionId, error);
    return; // o redirect con error param
  }

  await addXKeyword(projectId, query);
  await deleteSuggestion(projectId, suggestionId);
  await queueXRulesSync(projectId);
}
```

#### 8e. Validación en entry manual — `addXKeywordFromForm`

El mismo `validateXQuery` se llama en `addXKeywordFromForm` antes de insertar en `x_keywords`. Si la query es inválida, retornar el mensaje de error al usuario en lugar de guardar y dejar que el sync falle silenciosamente.

#### 8f. Hardening de `addRules` en `x-stream-rules.ts`

Actualmente `addRules` lanza en cualquier 4xx, rompiendo el sync para todos los proyectos. Mejorar para aislar fallas por regla:

X API puede devolver 200 con errores parciales en el body (`errors` array) o 4xx. Parsear el body de error para identificar qué reglas fallaron y loguear por separado sin interrumpir las reglas válidas del batch.

---

### 9. Intent threshold para X posts

**Diferencia crítica vs Reddit:** Reddit usa `continue` sin guardar nada porque es un scraper pull — el mismo post no vuelve a aparecer en el siguiente ciclo. X usa webhook con garantía **at-least-once**: el mismo tweet puede re-entregarse tras reconexiones o retries de X. Si no se guarda ningún registro, el pipeline vuelve a clasificar (pagando AI) en cada re-entrega.

**Estrategia correcta: dos pasos en `process-x-post.ts`**

**Paso 1 — "check existing" ANTES de clasificar:**

```ts
const existing = await step.run("check existing", () =>
  supabase
    .from("x_posts")
    .select("id")
    .eq("project_id", payload.projectId)
    .eq("x_post_id", payload.post.id)
    .maybeSingle()
);

if (existing.data) {
  return { saved: false, duplicate: true }; // ya procesado, cortar sin llamar a AI
}
```

**Paso 2 — después de clasificar, aplicar threshold:**

```ts
if (classification.intentScore < threshold) {
  // Guardar igual, pero con status="irrelevant"
  // El registro actúa como marca durable de "seen but discarded"
  // La próxima re-entrega termina en el paso 1 (lookup barato, sin AI)
  await step.run("save as irrelevant", () =>
    upsertXPost({ ..., status: "irrelevant" })
  );
  return { saved: false, belowThreshold: true };
}
```

**Por qué no una tabla separada de drops:** `upsertXPost` ya tiene `onConflict: "project_id,x_post_id"` — reusar la misma tabla es más simple y no requiere infraestructura adicional. Las filas con `status="irrelevant"` no aparecen en el feed (ya filtradas).

**Configuración:**
- Env var `X_INTENT_THRESHOLD` (default: 25 — tweets son más cortos que posts de Reddit, los scores tienden a ser menores)
- El threshold se evalúa post-clasificación, no antes — necesitamos el score para decidir

**Resultado por re-entrega del mismo tweet:**
- Primera vez: DB lookup (miss) → clasificar → guardar con status correcto
- Re-entregas: DB lookup (hit) → return `{duplicate: true}` — sin AI, sin upsert

---

### 10. Empty state específico para X
Cuando `type=x` y no hay posts, el mensaje genérico "No items yet" no explica nada.

Mostrar:
- Título: "No X posts yet"
- Copy: "Add X keywords in Settings to start monitoring. Posts matching your queries will appear here in real time."
- Link directo a `/settings?tab=x`

---

### 11. Intent type para X classifier
Reddit tiene `intent_type` (competitor_comparison, active_buying, pain_expression, etc.) que permite filtrar y entender mejor los leads. X solo tiene `intent_score + sentiment`.

Añadir campo `intent_type` al clasificador de X con valores propios para tweets:
```
problem_expression    # "ugh, [pain point]"
recommendation_request # "anyone using X for Y?"
competitor_mention    # menciona un competidor
product_discovery     # buscando alternativas
conversation_starter  # abre debate sobre el tema
```

- Añadir a `x_posts` tabla: `intent_type text` (migration)
- Actualizar `xClassificationSchema` en el clasificador
- Mostrar en `XPostCard` y `XPostDetail` como badge
- Usar para filtrar (añadir filtro "Intent" a los X triage controls del P0.3)

---

## P2 — Nice to have (futuro)

### 12. Analytics para X
Extensión de `/analytics` con métricas de X:
- Posts recibidos por día/semana
- Distribution de intent scores
- Top keywords que traen más posts de alta relevancia
- Conversion rate (new → replied)

### 13. Enriquecimiento de autor
Usar X API para fetchear bio, profile picture y descripción del autor cuando se guarda un post. Mostrar avatar en `XPostDetail`.

### 14. Contexto de hilo/thread
Si el tweet es una reply, fetchear el tweet padre para mostrar contexto. Útil cuando el tweet matchea pero no se entiende sin el contexto de la conversación.

### 15. X keywords en onboarding
El flow de onboarding actual solo sugiere Reddit keywords/subreddits. Al completar onboarding, ofrecer también setup de X keywords con las mismas sugerencias de IA.

---

## Orden de ejecución sugerido

```
Semana 1: P0 — 1 (reply generator) + 2 (mark as replied) + 6 (migración)
Semana 2: P0 — 3 (filtros X) + 4 (badge) + 5 (card mejorado)
Semana 3: P1 — 7 (syntax guide) + 9 (threshold) + 10 (empty state)
Semana 4: P1 — 8 (keyword suggestions IA) + 11 (intent type)
Futuro:   P2
```

---

## Archivos clave actuales

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/028_x_integration.sql` | Tablas x_keywords + x_posts |
| `src/modules/x/x-classifier.ts` | Clasificador de tweets (gpt-4.1-mini) |
| `src/modules/x/x-webhook-handler.ts` | CRC + HMAC + despacho a Inngest |
| `src/modules/x/x-stream-rules.ts` | Sync de reglas con X Filtered Stream API |
| `src/modules/x/actions.ts` | updateXPostStatusFromForm |
| `src/inngest/functions/process-x-post.ts` | Classify + save pipeline |
| `src/inngest/functions/sync-x-stream-rules.ts` | Sync rules on demand |
| `app/api/x/webhook/route.ts` | GET (CRC) + POST (incoming tweets) |
| `src/db/queries/x.ts` | listProjectXKeywords, listProjectXPosts, getXPostById |
| `src/db/mutations/x.ts` | Full CRUD keywords + posts |
| `app/feed/page.tsx` | XPostCard, XPostDetail, type pill "X" |
| `app/settings/page.tsx` | X keywords management UI |
