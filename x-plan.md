# X Integration — Build Plan

Estado actual: pipeline técnico completo y funcionando (webhook, Inngest, clasificador, DB). Lo que falta es llevar la **experiencia de usuario** al nivel del pipeline de Reddit.

---

## P0 — Crítico (hace X usable, sin esto está incompleto)

### 1. Reply generator para X posts
El gap más grande. Reddit leads tienen `ReplyEditor` con generación de múltiples drafts con IA. X posts solo tienen "Dismiss" y "Open on X".

Qué hay que crear:
- `src/db/schemas` — añadir `XPostReply` DTO y tabla `x_post_replies` (migration 029)
- `src/modules/x/x-reply-generator.ts` — función que toma el tweet y el proyecto, genera 3 sugerencias de reply en ≤280 chars con tono adecuado para X (conciso, no de vendedor)
- `src/inngest/functions/generate-x-reply.ts` — función Inngest disparada por evento `x/reply.generate.requested`
- `src/modules/x/actions.ts` — añadir `generateXReplyFromForm` server action
- `XReplyEditor` component en `app/feed/page.tsx` — similar a `ReplyEditor`, muestra drafts generados, botón copy, botón "Mark as Replied"
- En `XPostDetail`: integrar `XReplyEditor` en el `.lead-comment-box` equivalente, igual que `LeadDetail` tiene `ReplyEditor`

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

### 4. Badge del sidebar cuenta X posts nuevos
`newLeadsCount` en el sidebar actualmente solo cuenta leads de Reddit con `status="new"`. Hay que sumar los X posts con `status="new"`.

- En `app/feed/page.tsx`: calcular `newXCount = allXPosts.filter(p => p.status === "new").length`
- Pasar `newLeadsCount + newXCount` al `DashboardShell` como badge
- O bien pasar ambos por separado y mostrar distinción en el tooltip (opcional)

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
Reddit tiene `project_keyword_suggestions` generadas por IA en el onboarding. X no tiene nada equivalente.

Qué crear:
- Migration 029 (o extender): tabla `x_keyword_suggestions (id, project_id, query, rationale, status)`
- `src/modules/x/x-keyword-suggestion-generator.ts` — prompt específico que genera queries válidas para X Filtered Stream (con operadores) basadas en el proyecto
- Server action `generateXKeywordSuggestionsFromForm`
- En Settings tab X Keywords: sección "Suggested keywords" con cards Accept/Dismiss, igual que los keyword suggestions de Reddit en onboarding

---

### 9. Intent threshold para X posts
Actualmente todos los tweets matcheados se guardan sin importar el intent_score. Igual que Reddit tiene `LEAD_INTENT_THRESHOLD`, X debería tener umbral.

- Añadir `X_INTENT_THRESHOLD` env var (default: 25 — tweets son cortos, scores tienden a ser más bajos)
- En `process-x-post.ts`: si `classification.intentScore < threshold`, hacer early return `{ saved: false, belowThreshold: true }` en lugar de guardar
- Evitar llenar la DB de tweets irrelevantes

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
