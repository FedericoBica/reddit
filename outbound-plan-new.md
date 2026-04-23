# ReddProwl Outbound System — Product + Architecture Prompt (Project-Adapted)

> Para usar como prompt maestro de diseño e implementación.
> Este documento reemplaza una lectura literal de `Outbound_BuildSpec.md` y adapta el módulo Outbound al estado real del proyecto actual.
> No asume monorepo. No asume refactor estructural previa. Se integra sobre la app Next.js existente.

---

## 0. Objetivo

Diseñar e implementar el módulo **Outbound** de ReddProwl sobre el proyecto actual.

El sistema debe permitir:

- crear campañas outbound desde una **Chrome Extension**
- usar el contexto ya existente de ReddProwl (leads inbound, intent score, proyecto activo, billing, membresía)
- ejecutar DMs usando la sesión real de Reddit del usuario en su navegador
- registrar resultados en el backend
- mostrar campañas, contactos y respuestas en el dashboard actual

Este módulo debe encajar con el producto existente:

- Searchbox / inbox inbound ya existe
- leads ya existen
- scoring de intención ya existe
- proyecto, auth, billing y dashboard shell ya existen
- Inngest ya existe
- Supabase ya existe

No construir esto como producto separado. Es una extensión natural del sistema actual.

---

## 1. Decisiones ya tomadas

Estas decisiones ya están cerradas y deben respetarse.

### 1.1 Arquitectura general

- **No migrar a monorepo por ahora**
- **No usar Turborepo/workspaces como prerequisito**
- **Extender la app actual**
- La extensión será un nuevo artefacto dentro del repo, pero el backend y dashboard seguirán viviendo en la app Next.js actual

### 1.2 Extension

- La **Chrome Extension es necesaria**
- Sin extensión no existe outbound automático real
- La extensión no es opcional para el MVP funcional

### 1.3 Ownership del flujo

- **La creación de campañas ocurre desde la extensión**
- El dashboard web no es el punto primario para crear campañas
- El dashboard web sí es el lugar principal para:
  - revisar campañas
  - analizar performance
  - gestionar CRM outbound
  - administrar tokens de extensión
  - ver límites de plan

### 1.4 Separación inbound vs outbound

- **Inbound y outbound deben estar separados**
- No reutilizar el pipeline actual de leads inbound como pipeline outbound
- No mezclar estados inbound con estados outbound

### 1.5 Modelo de datos

- `leads` sigue representando el mundo inbound
- Outbound tendrá su propia entidad CRM, por ejemplo `dm_contacts`
- Si un contacto outbound nace desde un lead inbound, se vincula con `lead_id`
- Si nace desde thread/subreddit, puede existir sin `lead_id`

### 1.6 Planes y membresía

Mantener el sistema actual de planes y adaptarlo:

- `startup`: owner only
- `growth`: owner + 1 member
- `professional`: owner + 2 members

Reglas:

- campañas outbound viven a nivel `project`
- tokens de extensión viven a nivel `user`
- permisos se resuelven según membresía del proyecto
- owner administra settings sensibles

### 1.7 Límite mensual outbound

Hacerlo así:

- guardar en DB:
  - `dm_monthly_used`
  - `dm_cycle_resets_at`
- **no** guardar `dm_monthly_limit` en DB por ahora
- el límite mensual se calcula desde el plan actual en código

---

## 2. Visión del producto

ReddProwl hoy detecta conversaciones con intención en Reddit.

Outbound agrega la capa de ejecución:

- tomar leads inbound existentes
- convertirlos en targets contactables
- enviar DMs desde la sesión real del usuario en Reddit
- registrar el resultado
- seguir la conversación en un CRM outbound

Además, el sistema debe quedar preparado para campañas de:

- `lead`
- `thread`
- `subreddit`

Aunque el MVP puede priorizar `lead` y `thread`, el modelo de datos debe quedar listo desde el principio.

---

## 3. Enfoque de integración con este proyecto

### 3.1 Estado actual del proyecto

El proyecto actual ya tiene:

- Next.js App Router
- Supabase
- auth server-side
- dashboard shell
- billing/limits
- leads inbound
- Searchbox
- mentions
- Inngest jobs

Por eso:

- no crear un segundo backend
- no duplicar auth
- no crear un sistema de planes paralelo
- no mover el proyecto a monorepo antes de validar outbound

### 3.2 Estructura recomendada

Mantener la app actual y agregar:

#### Backend/dashboard

- nuevas rutas web bajo `app/outbound/*` o equivalentes consistentes con la app actual
- nuevos endpoints bajo `app/api/ext/*`
- nuevos módulos en `src/modules/outbound/*`
- nuevas queries/mutations en `src/db/*`
- nuevas migraciones en `supabase/migrations/*`

#### Extensión

Crear un directorio nuevo dentro del repo, por ejemplo:

```txt
extension/
```

La extensión puede tener su propio build tool si hace falta, pero sin forzar monorepo.

---

## 4. Producto: responsabilidades por superficie

### 4.1 Chrome Extension

La extensión debe:

- conectar con ReddProwl
- crear campañas outbound
- iniciar/pausar campañas
- ejecutar envíos en Reddit
- scrapear respuestas del inbox
- sincronizar esos eventos al backend

La extensión es el centro operativo.

### 4.2 Dashboard web

El dashboard debe:

- mostrar overview de campañas
- mostrar detalle de campaña
- mostrar CRM outbound
- permitir marcar outcomes
- gestionar tokens de extensión
- mostrar límites y uso del plan

El dashboard es el centro de gestión y análisis.

---

## 5. Modelo funcional del dominio

### 5.1 Campaigns

Una campaña outbound es una configuración persistida que define:

- proyecto
- tipo de source
- audiencia
- mensaje base
- límites y delays
- estado de ejecución

Tipos:

- `lead`
- `thread`
- `subreddit`

### 5.2 Contacts

Un `dm_contact` representa una persona/username dentro del CRM outbound.

Debe existir independientemente de si provino o no de un lead inbound.

Un contacto puede estar vinculado a:

- un `lead` inbound existente
- una campaña concreta
- un historial de mensajes

### 5.3 Queue

La cola (`dm_queue`) representa unidades ejecutables por la extensión.

Cada item de queue refiere a:

- una campaña
- un contacto
- una prioridad
- un estado operacional

### 5.4 Log

`dm_log` guarda el histórico real de:

- mensaje enviado
- respuesta recibida
- outcome comercial

Este log es la base del reporting y del CRM.

---

## 6. Pipeline outbound

El pipeline outbound debe ser independiente del pipeline inbound.

Estados sugeridos del CRM outbound:

- `queued`
- `sent`
- `replied`
- `interested`
- `won`
- `lost`

No reutilizar:

- `new`
- `reviewing`
- `irrelevant`
- `replied` inbound

aunque existan en `leads`.

`dm_contacts.status` es la verdad del pipeline outbound.

---

## 7. Schema MVP recomendado

### 7.1 `dm_campaigns`

Representa campañas outbound.

Campos mínimos:

- `id`
- `project_id`
- `created_by`
- `name`
- `type` (`lead | thread | subreddit`)
- `status` (`draft | active | paused | completed | failed`)
- `source_url` nullable
- `source_config jsonb`
- `message_template`
- `daily_limit`
- `delay_min_sec`
- `delay_max_sec`
- `sent_count`
- `reply_count`
- `failed_count`
- `started_at`
- `completed_at`
- timestamps

Notas:

- aunque el MVP funcional arranque con `lead`, el schema debe soportar `thread` y `subreddit`
- `source_config` debe modelar variantes por tipo

Ejemplos:

- lead:
  - `minIntentScore`
  - `maxLeads`
  - `onlyNew`
- thread:
  - `postUrl`
  - `skipOp`
  - `firstLevelOnly`
- subreddit:
  - `subreddit`
  - `timeRange`
  - `maxUsers`

### 7.2 `dm_contacts`

Representa contactos del CRM outbound.

Campos mínimos:

- `id`
- `project_id`
- `lead_id` nullable
- `reddit_username`
- `source_type` (`lead | thread | subreddit`)
- `first_campaign_id`
- `last_campaign_id`
- `status` (`queued | sent | replied | interested | won | lost`)
- `last_message_at`
- `last_reply_at`
- timestamps

Constraint importante:

- unique `(project_id, reddit_username)`

### 7.3 `dm_queue`

Cola operativa.

Campos mínimos:

- `id`
- `campaign_id`
- `contact_id`
- `priority`
- `status` (`pending | sending | sent | failed | skipped`)
- `error_reason`
- `scheduled_at`
- `sent_at`
- timestamps

Constraint:

- unique `(campaign_id, contact_id)`

### 7.4 `dm_log`

Histórico de DMs.

Campos mínimos:

- `id`
- `project_id`
- `campaign_id`
- `contact_id`
- `queue_item_id` nullable
- `message_sent`
- `response_received`
- `response_text` nullable
- `response_at` nullable
- `outcome` (`pending | replied | interested | won | lost`)
- `sent_at`
- `last_synced_at`

Regla:

- truncar `response_text` a 500 chars

### 7.5 `extension_connect_tokens`

Token temporal de conexión.

Campos mínimos:

- `id`
- `user_id`
- `project_id`
- `token_hash`
- `expires_at`
- `consumed_at`
- `created_at`

### 7.6 `extension_tokens`

Token persistente de dispositivo/extensión.

Campos mínimos:

- `id`
- `user_id`
- `project_id`
- `token_hash`
- `label`
- `last_used_at`
- `expires_at`
- `revoked_at`
- `created_at`

### 7.7 `users`

Agregar:

- `dm_monthly_used`
- `dm_cycle_resets_at`

No agregar por ahora:

- `dm_monthly_limit`

---

## 8. RLS y permisos

Todas las tablas nuevas deben tener RLS habilitado.

### 8.1 Regla conceptual

- campañas: visibles para miembros del proyecto
- contactos: visibles para miembros del proyecto
- queue: visible para miembros del proyecto
- logs: visibles para miembros del proyecto
- extension tokens: visibles solo para el usuario dueño del token
- connect tokens: visibles solo para el usuario dueño del token

### 8.2 Regla de ownership

Usar como base:

- `project_id` para recursos compartidos del módulo
- `user_id` para tokens de extensión

### 8.3 Roles funcionales MVP

MVP:

- miembros del proyecto pueden:
  - ver campañas
  - crear campañas
  - iniciar/pausar campañas
  - ver CRM outbound
- owner puede además:
  - generar connect token
  - revocar tokens
  - administrar settings sensibles

---

## 9. Planes y límites

Mantener el sistema actual de planes del proyecto.

No introducir otra taxonomía.

### 9.1 Mapping outbound

- `startup`
  - outbound no disponible
  - 0 campañas
  - owner only
- `growth`
  - outbound disponible
  - límite mensual definido por código
  - owner + 1 member
- `professional`
  - outbound disponible
  - límite mensual mayor
  - owner + 2 members

### 9.2 Fuente de verdad

El límite mensual outbound se calcula desde el plan actual en código.

Persistir solo:

- uso mensual
- fecha de reset

### 9.3 Enforcement

Chequeos mínimos:

- al crear campaña
- al iniciar campaña
- al pedir `queue/next`

Reglas:

- si el plan no tiene outbound, bloquear acceso
- si se excede el uso mensual, pausar ejecución

---

## 10. Flujos del producto

### 10.1 Conexión extensión

1. El usuario entra al dashboard web
2. Va a Settings > Extension
3. Genera un connect token
4. Abre la extensión
5. Pega el token
6. La extensión llama al backend
7. Recibe token persistente
8. Guarda sesión

### 10.2 Creación de campaña desde la extensión

La creación vive en la extensión.

Wizard sugerido:

#### Paso 1 — Source

Opciones:

- Lead campaign
- Thread campaign
- Subreddit campaign

#### Paso 2 — Audience

Lead:

- min intent score
- max leads
- only new

Thread:

- post URL
- skip OP
- first-level only

Subreddit:

- subreddit
- time range
- max users

#### Paso 3 — Message + Limits

- mensaje base
- AI assist
- daily limit
- min/max delay
- create draft
- create and start

### 10.3 Ejecución de campaña

1. La extensión obtiene una campaña activa
2. Pide el próximo queue item
3. Espera delay random
4. Navega al compose de Reddit
5. Escribe el mensaje
6. Intenta enviarlo
7. Reporta resultado
8. Repite

### 10.4 Sync de respuestas

1. La extensión revisa inbox de Reddit
2. Detecta respuestas relevantes
3. Las envía al backend
4. El backend matchea contra `dm_log`
5. Actualiza `dm_log` y `dm_contacts`
6. El dashboard web refleja el cambio

---

## 11. Extension-first UX

La extensión es el lugar principal para operar outbound.

### 11.1 Pantallas mínimas de la extensión

#### Connect

- pegar token
- confirmar proyecto conectado

#### Home

- quick stats
- campaña activa
- campañas recientes
- botón `New Campaign`

#### New Campaign

- wizard de creación

#### Campaign Detail

- estado actual
- sent / replies / failed
- pause/resume

#### Settings

- proyecto
- usuario
- disconnect

### 11.2 Reparto de responsabilidades UX

Extension:

- crear
- iniciar
- pausar
- ejecutar

Dashboard:

- revisar
- analizar
- marcar outcome
- gestionar CRM
- administrar tokens

---

## 12. Dashboard web

Agregar el módulo outbound al dashboard actual, manteniendo el lenguaje visual existente.

No rediseñar el dashboard completo.

### 12.1 Sidebar

Agregar item:

- `Outbound`

Mantener la navegación existente. No reordenar el producto salvo necesidad real.

### 12.2 Rutas web sugeridas

- `/outbound`
- `/outbound/campaigns/[id]`
- `/outbound/crm`
- `/settings/extension`

Si conviene por consistencia con la app actual, usar otra convención de rutas, pero sin crear una taxonomía paralela rara.

### 12.3 `Outbound` overview

Debe mostrar:

- DMs usados este ciclo
- response rate
- campañas activas
- campañas recientes
- estado de conexión de la extensión

### 12.4 `Campaign Detail`

Debe mostrar:

- overview
- queue
- logs
- stats
- acciones básicas

### 12.5 `Outbound CRM`

Debe mostrar `dm_contacts`.

Tabla mínima:

- username
- campaign
- status
- last message at
- last reply at
- message preview
- outcome action

### 12.6 `Settings > Extension`

Debe mostrar:

- estado de conexión
- generar connect token
- tokens activos
- revocar token

---

## 13. Endpoints backend MVP

Todos en la app actual.

Ubicación sugerida:

```txt
app/api/ext/*
```

### 13.1 Auth

- `POST /api/ext/connect`
- `GET /api/ext/status`

### 13.2 Campaigns

- `GET /api/ext/campaigns`
- `POST /api/ext/campaigns`
- `GET /api/ext/campaigns/:id`
- `POST /api/ext/campaigns/:id/start`
- `POST /api/ext/campaigns/:id/pause`

### 13.3 Queue

- `GET /api/ext/campaigns/:id/queue/next`
- `POST /api/ext/queue/:id/result`

### 13.4 Responses

- `POST /api/ext/dm-log/sync-responses`
- `POST /api/ext/dm-log/:id/outcome`

### 13.5 Settings

- `POST /api/ext/settings/generate-connect-token`
- `GET /api/ext/settings/tokens`
- `POST /api/ext/settings/tokens/:id/revoke`

### 13.6 Optional helper endpoints for extension UI

- `GET /api/ext/projects/:id/leads/eligible`
- `POST /api/ext/ai/generate-message`

---

## 14. Lógica backend importante

### 14.1 Creación de campaña

Lead campaign:

1. validar permisos
2. validar plan
3. crear `dm_campaigns`
4. seleccionar `leads` elegibles
5. upsert `dm_contacts`
6. crear `dm_queue`

Thread/Subreddit:

1. crear campaña
2. dejar queue vacía hasta que la extensión scrapee usernames
3. la extensión puede empujar candidatos al backend o el backend puede generar queue luego del scrape

Definir esa parte de forma explícita al implementar.

### 14.2 Uso mensual

Cada envío exitoso debe:

- incrementar `users.dm_monthly_used`
- respetar `dm_cycle_resets_at`
- recalcular permitido según plan actual

### 14.3 Campaña activa

MVP recomendado:

- una sola campaña activa por proyecto

Esto simplifica:

- queue execution
- status global
- UX de la extensión
- manejo de errores

### 14.4 Deduplicación

No recontactar el mismo `reddit_username` dentro del mismo proyecto si ya existe `dm_contact`.

Regla inicial:

- si ya existe `dm_contact` del username en el proyecto, no crear otro
- decidir si se reusa o se salta según configuración futura

---

## 15. Content script / extension runner

### 15.1 Reglas

- usar la sesión real del usuario en Reddit
- no usar credenciales de Reddit en backend
- no usar API oficial
- toda acción de DM ocurre en el browser del usuario

### 15.2 Runner

El runner debe:

- usar `chrome.alarms`, no timers volátiles
- tolerar sleep del service worker
- detectar si no hay tab de Reddit
- pausar o notificar si falta contexto

### 15.3 DM sending

El content script debe:

- navegar al compose
- detectar elementos
- escribir subject/message
- click submit
- detectar success / rate limit / user blocks DMs / dom error

### 15.4 Polling de inbox

El polling debe:

- leer respuestas periódicamente
- extraer username + texto + timestamp
- sincronizar con backend

---

## 16. IA en outbound

IA es apoyo, no prerequisito duro del primer envío.

### 16.1 MVP

MVP puede arrancar con:

- un solo `message_template`
- preview simple
- interpolación básica de username/contexto

### 16.2 Fase posterior

Agregar:

- generación de variantes
- spintax
- ajuste por tono
- resumen contextual del post

No hacer que el éxito del MVP dependa de una capa de IA demasiado sofisticada.

---

## 17. Seguridad

### 17.1 Tokens

- nunca guardar token plano persistente en DB
- guardar hash
- expiración obligatoria
- revocación obligatoria

### 17.2 Settings sensibles

Solo owner puede:

- generar connect token
- revocar tokens

### 17.3 PII

`response_text` debe truncarse

Idealmente agregar luego setting de privacidad para no guardar body de respuestas, solo metadata.

### 17.4 Logging

- no loggear tokens
- no loggear mensajes sensibles completos en consola

---

## 18. Roadmap por fases

### Fase 1 — Fundaciones

- migraciones DB outbound MVP
- queries/mutations outbound
- limits + permissions
- settings/extension en dashboard
- connect token flow

### Fase 2 — Extension MVP operativa

- connect
- home
- create lead campaign
- start/pause
- queue runner
- report queue result

### Fase 3 — CRM outbound web

- overview
- campaign detail
- CRM table
- outcome manual

### Fase 4 — Sync de respuestas

- inbox poller
- sync endpoint
- actualizaciones CRM

### Fase 5 — Thread campaigns

- parse thread URL
- scrape commenters
- queue
- execution

### Fase 6 — Subreddit campaigns

- scrape subreddit users
- queue
- execution

### Fase 7 — IA avanzada

- variants
- spintax
- regenerate
- usage tracking

---

## 19. Qué no hacer

- No migrar a monorepo ahora solo por prolijidad arquitectónica
- No mezclar inbound status con outbound status
- No sobrecargar `leads` como si fuera también el CRM outbound
- No hacer que el dashboard sea el único lugar de campaign creation
- No introducir una taxonomía de planes distinta a la actual
- No construir primero thread/subreddit scraping sin tener sólido el núcleo de lead campaigns

---

## 20. Instrucción final

Implementar este módulo pensando en el proyecto real actual, no en un greenfield idealizado.

Prioridades:

1. Encaje correcto con auth, billing, proyectos y dashboard actuales
2. Separación limpia entre inbound y outbound
3. Extension-first para la operación outbound
4. Dashboard web para CRM, reporting y administración
5. Modelo de datos extensible a `lead`, `thread` y `subreddit`

Si algo de la spec original entra en conflicto con estas decisiones, priorizar este documento.

