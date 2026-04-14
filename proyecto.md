

**REDDIT LEAD RADAR**

Documento de Arquitectura y Producto

v2.0 — Revisado y Mejorado

*Automatiza el ciclo de venta en Reddit: desde el descubrimiento de intención de compra hasta la respuesta asistida por IA, bajo una filosofía de Inbox Zero.*

Confidencial — Solo para uso interno del equipo fundador

# **1\. Visión del Producto**

## **1.1 Problema**

Cada día miles de personas en Reddit expresan intención de compra de forma orgánica: preguntan por recomendaciones, comparan herramientas, buscan soluciones a problemas específicos. Para las empresas, especialmente SaaS y servicios profesionales, estos posts representan leads de altísima calidad que se pierden porque nadie los monitorea sistemáticamente.

Las herramientas existentes (GummySearch, Syften, F5Bot) resuelven parcialmente el problema: alertan sobre menciones pero no asisten en la respuesta, no analizan intención de compra y no ofrecen un ciclo completo de venta.

## **1.2 Solución**

Reddit Lead Radar es una plataforma SaaS que automatiza el ciclo completo de venta en Reddit:

1. Descubrimiento inteligente de leads basado en intención de compra (no solo keywords).

2. Scoring automático con IA para priorizar oportunidades de alto valor.

3. Generación de respuestas asistidas por IA que pasan el filtro humano de Reddit.

4. Pipeline de leads con tracking de resultados para medir ROI.

5. Content Lab para posicionamiento proactivo como experto en subreddits clave.

## **1.3 Mercado Objetivo**

**Primario:** Founders de SaaS (especialmente en early-stage) que necesitan traccion orgánica sin presupuesto de ads.

**Secundario:** Agencias de marketing digital, consultores, profesionales independientes (abogados, contadores) en mercados de habla hispana e inglesa.

**Terciario:** Equipos de growth en empresas medianas que usan Reddit como canal de adquisición.

## **1.4 Análisis Competitivo**

Es crítico entender qué existe y dónde diferenciarnos:

| Feature | GummySearch | Syften | F5Bot | Brandwatch | Lead Radar |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Keyword Alerts | Sí | Sí | Sí | Sí | Sí |
| Intent Scoring IA | Básico | No | No | Sí | Avanzado (1-100) |
| Reply Generator IA | No | No | No | No | 3 tonos \+ human-like |
| Content Lab / SEO | No | No | No | No | Full suite |
| Pipeline de Leads | No | No | No | Sí | Mini-CRM |
| Filtro Regional/Voseo | No | No | No | No | Sí |
| Precio desde | $49/m | $19/m | Gratis | $800+/m | $29/m |

*Diferencial clave:* somos el único que ofrece el ciclo completo descubrimiento → scoring → respuesta → tracking → contenido proactivo, con soporte nativo para mercados hispanohablantes.

# **2\. Arquitectura Técnica**

## **2.1 Stack Tecnológico**

| Capa | Tecnología | Justificación |
| :---- | :---- | :---- |
| Frontend | Next.js 15 (App Router) | SSR, RSC, API routes integradas, ecosystem maduro |
| UI Components | Tailwind CSS \+ shadcn/ui | Estética SaaS moderna, consistencia, dark mode nativo |
| Database | Supabase (PostgreSQL) | Auth integrada, Realtime, Row Level Security, pgvector |
| Búsqueda vectorial | pgvector (Supabase) | Análisis semántico sin servicio externo adicional |
| Orquestación | Inngest | Event-driven, reintentos, cron jobs, zero-infra |
| Data Sourcing | Apify \+ Reddit API oficial | Doble fuente: Apify para volumen, API oficial como fallback legal |
| IA Principal | OpenAI GPT-4o / GPT-4o-mini | 4o para análisis complejo, 4o-mini para clasificación masiva |
| IA Fallback | Claude 3.5 Haiku (Anthropic) | Fallback si OpenAI tiene downtime o rate limits |
| Pagos | LemonSqueezy | Customer portal, metered billing, webhooks robustos |
| Email | Resend \+ React Email | Templates con React, deliverability alta |
| Caching | Upstash Redis | Caché semántico, rate limiting, session store |
| Monitoreo | Sentry \+ Inngest Dashboard | Error tracking, performance, observabilidad de jobs |
| Analytics | PostHog | Product analytics, feature flags, session replay |
| Deploy | Vercel | Preview deploys, edge functions, integración nativa con Next.js |
| Mobile Apps | Capacitor (Ionic) | Wrapper nativo sobre Next.js PWA. Una codebase, presencia en App Store/Play Store, push nativo, haptic feedback |
| Product Tour | React Joyride | Guided tours interactivos, tooltips contextuales, no-code step builder |

## **2.2 Procesador de Pagos: LemonSqueezy (Merchant of Record)**

El documento original mencionaba LemonSqueeze con signo de pregunta. Se confirma LemonSqueezy como la opción correcta para el contexto del proyecto (founder en Uruguay). Al ser Merchant of Record, LemonSqueezy es el vendedor legal ante el cliente, lo que elimina la necesidad de tener una LLC en USA o entidad en un país soportado por Stripe:

* **Checkout optimizado:** Checkout embebible con alta conversión, soporte para tarjetas, PayPal, Apple Pay, Google Pay.

* **Portal del cliente:** Los usuarios gestionan su suscripción y métodos de pago desde el portal de LemonSqueezy sin que vos tengas que construir UI.

* **Suscripciones flexibles:** Soporte nativo para planes mensuales/anuales, free trials, y descuentos. Los límites por tier se controlan desde tu backend.

* **Webhooks:** subscription\_created, subscription\_updated, subscription\_payment\_failed y más para manejar todo el lifecycle de billing.

* **Tax compliance global:** LemonSqueezy resuelve IVA/GST automáticamente como MoR para cualquier país. No necesitás preocuparte por tax compliance.

## **2.3 Cambio Crítico: IA Fallback (NUEVO)**

El spec original dependía 100% de OpenAI. Esto es un Single Point of Failure crítico. Se agrega:

* **Circuit Breaker Pattern:** Si OpenAI falla 3 veces consecutivas en 5 minutos, el sistema switchea automáticamente a Claude Haiku para clasificación y a Claude Sonnet para generación de respuestas.

* **Inngest retry con exponential backoff:** Los jobs de IA reintentan con delays crecientes (1s, 5s, 30s, 2min) antes de activar el fallback.

* **Provider-agnostic interface:** Un wrapper abstracto (LLMProvider) que permite cambiar de modelo sin tocar lógica de negocio.

## **2.4 Arquitectura Event-Driven (Detalle)**

El flujo principal del sistema opera como una cadena de eventos en Inngest:

1. **scraper/scheduled:** Cron job (frecuencia según tier) que dispara el scraping de subreddits configurados.

2. **posts/discovered:** Apify retorna posts nuevos. Se deduplicam contra caché global Redis (post\_id como key).

3. **posts/classify:** GPT-4o-mini clasifica batch de posts: intent score, region score, sentiment, keywords matched.

4. **leads/qualified:** Posts con intent score \> umbral configurado se insertan en Supabase y disparan notificación.

5. **leads/notify:** Según preferencias del usuario: push, email digest, Slack webhook, Telegram bot.

6. **leads/replied:** Cuando el usuario marca como respondido, se trackea para analytics y A/B testing.

# **3\. Autenticación y Multi-Proyecto (NUEVO)**

El documento original no mencionaba autenticación. Es fundamental definirlo desde el día uno.

## **3.1 Flujo de Auth**

* **Supabase Auth:** OAuth con Google y GitHub (login social). Magic Link por email como alternativa.

* **Row Level Security (RLS):** Cada tabla en Supabase tiene políticas RLS que aseguran que un usuario solo ve sus datos.

* **Session handling:** JWT con refresh tokens. Middleware de Next.js valida sesión en cada request server-side.

## **3.2 Multi-Proyecto**

Un usuario puede gestionar múltiples marcas/productos. Cada proyecto tiene su propio set de keywords, competidores, subreddits y configuración de IA.

* Modelo: User → hasMany → Projects → hasMany → Keywords, Competitors, Leads, etc.

* Switcher de proyecto en la navbar (similar a Vercel team switcher).

* Límites de proyectos por tier: Starter \= 1, Growth \= 3, Enterprise \= ilimitados.

## **3.3 Roles de Equipo (NUEVO)**

Para el tier Enterprise, soporte de equipos colaborativos:

* **Owner:** Acceso total. Gestión de billing y miembros.

* **Admin:** Puede configurar keywords, competidores y settings del proyecto.

* **Member:** Puede ver leads, generar respuestas y marcar como respondido.

* **Viewer:** Solo lectura. Útil para stakeholders que quieren ver analytics.

# **4\. Onboarding Inteligente (Mejorado)**

El spec original mencionaba un Strategy Generator pero no detallaba el flujo. Aquí se especifica paso a paso:

## **4.1 Flujo de Onboarding (5 pasos)**

1. **Paso 1 — Tu Producto:** Input de URL del sitio web. El sistema crawlea y extrae: propuesta de valor, features principales, stack tecnológico detectado, tono de voz de la marca. Si no tiene web, formulario manual con 3 campos: nombre del producto, qué problema resuelve, quién es el cliente ideal.

2. **Paso 2 — Tu Mercado:** Selector de país específico (Argentina, Uruguay, México, Colombia, Chile, España, Brasil, USA, etc.) con campo opcional de ciudad/estado. Al seleccionar un país, el sistema precarga automáticamente: subreddits locales (ej: Argentina \= r/argentina, r/merval, r/DerechoGenial, r/buenosaires), keywords de jerga local (ej: Uruguay \= BPS, DGI, ANTEL; Argentina \= AFIP, monotributo, carta documento), y configuración de idioma/tono (voseo, tú, usted). Selector de idioma primario y secundario.

3. **Paso 3 — Competidores:** Input de 1-3 URLs de competidores (según tier). El sistema los analiza y genera automáticamente: puntos débiles detectados, keywords donde el competidor aparece mencionado, subreddits donde los discuten.

4. **Paso 4 — Mapa de Intención (auto-generado):** La IA presenta un mapa con: 15-30 keywords sugeridas (agrupadas por intención: informacional, comparativa, transaccional), 10-20 subreddits recomendados con su volumen estimado. El usuario puede aceptar, editar o agregar.

5. **Paso 5 — Configuración de Notificaciones:** Elección de canales (email, Slack, Telegram), frecuencia (instant, daily digest, weekly), umbral mínimo de intent score para notificar.

## **4.2 Mejora: Onboarding Progresivo**

No obligar a completar todo en la primera sesión. El dashboard muestra un checklist de setup con porcentaje completado. El usuario puede empezar a ver leads desde el Paso 1 con keywords básicas y refinar después.

# **5\. Módulos Funcionales (Mejorado)**

## **5.A New Opportunities**

Posts muy recientes (\< 2 horas) capturados por keywords. Feed tipo timeline con auto-refresh. No requiere scoring profundo: se muestra con un badge de "Fresh" y el usuario decide rápidamente si vale la pena.

**Mejora agregada:** Notificación push opcional para opportunities con intent score \> 80\. Configurable por el usuario.

## **5.B Searchbox (The Leads Inbox) — MEJORADO**

Centro operativo principal. Mantiene la filosofía "Inbox Zero".

**Layout dos columnas (sin cambios):**

* Columna izquierda: listado de posts con título, subreddit, link, relevance score (badge de color).

* Columna derecha: al seleccionar un post, se muestra contenido completo, comentarios desplegables, interacciones, y el Write a Comment editor abajo.

**Smart Filters (mejorado):**

* **High Intent:** Score \> 70\. Posts donde la persona está activamente buscando una solución.

* **My Keywords:** Matches directos con las keywords del proyecto.

* **Competitor Mentions:** Posts que mencionan a competidores configurados.

* **NUEVO — Unanswered:** Posts donde nadie ha respondido aún (alta oportunidad).

* **NUEVO — Trending:** Posts con crecimiento rápido de upvotes/comentarios en las últimas 4 horas.

**Reply Generator (mejorado):**

* **Engaging:** Enfoque en comunidad y ayuda genuina. Sin links.

* **Direct:** Pitch profesional y corto. Incluye link.

* **Balanced:** Valor primero, mención sutil del producto al final.

* **NUEVO — Custom:** El usuario define su propio template/tono que la IA usa como base.

* **NUEVO — Context-Aware:** La IA lee los comentarios existentes y adapta la respuesta para no repetir lo que ya dijeron otros.

**Acciones (mejorado):**

* **Copy & Open:** Copia respuesta \+ abre post en nueva pestaña \+ marca como REPLIED (sin cambios).

* **NUEVO — Snooze:** Ocultar lead por X horas y que reaparezca. Para posts que son interesantes pero prematuros.

* **NUEVO — Assign:** (Enterprise) Asignar lead a un miembro del equipo.

## **5.C Pipeline de Leads (NUEVO — Reemplaza Archivo)**

El archivo binario (respondidos/rechazados) se reemplaza por un pipeline completo tipo mini-CRM:

| Estado | Descripción | Acción del usuario |
| :---- | :---- | :---- |
| New | Lead recién descubierto, sin revisar | Aparece en Searchbox |
| Reviewing | El usuario lo abrió y está evaluando | Genera respuesta con IA |
| Replied | Se copió la respuesta y se marcó como respondido | Copy & Open |
| Won | El lead convirtió (el usuario confirma manualmente) | Marca como Won \+ valor estimado |
| Lost | No hubo conversión después de responder | Marca como Lost \+ razón |
| Irrelevant | Falso positivo, no era un lead real | Descarte rápido desde Searchbox |

**Por qué importa:** Sin este pipeline, el usuario no puede medir ROI real. Con él, puede decir "de 150 leads este mes, respondí 40 y cerré 3 ventas por $X". Eso es lo que hace que renueven la suscripción.

## **5.D Mentions & Competitor Intelligence (sin cambios mayores)**

* Brand Monitoring: tracking de menciones del nombre de marca y URL.

* Sentiment Analysis: Positivo/Negativo/Neutral con IA.

* Competitor Monitoring: menciones de competidores configurados.

* **NUEVO — Alerts de sentimiento negativo:** Si alguien habla mal del producto del usuario, notificación instantánea para damage control.

## **5.E Insights & Analytics (Mejorado)**

Todas las métricas del original, más:

* **Conversion Funnel:** Visualización New → Replied → Won con tasas de conversión.

* **Reply Style Performance:** Qué tono de respuesta genera más engagement (A/B tracking).

* **Best Time to Reply:** Análisis de en qué horarios las respuestas reciben más upvotes.

* **Subreddit Heatmap:** Mapa visual de actividad por subreddit y día de la semana.

* **Cost per Lead:** Estimación automática dividiendo costo del tier por leads calificados.

## **5.F Content Lab (Mejorado)**

Se mantiene todo el spec original (Trend Spotting, AI Draft Styles, Keyword Optimization, Calendar View, Karma Tracker, Draft Editor) y se agrega:

* **NUEVO — Post Performance Tracker:** Después de postear, el usuario ingresa la URL del post y el sistema trackea upvotes, comentarios y tráfico generado al sitio (vía UTM params).

* **NUEVO — Subreddit Rules Checker:** Antes de sugerir un post, la IA verifica las reglas del subreddit (usando el scraper) para evitar que el contenido sea removido.

* **NUEVO — Repost Optimizer:** Si un post tuvo buen rendimiento, sugerir cuándo y en qué otro subreddit repostearlo adaptado.

# **6\. Integraciones Externas (NUEVO)**

El spec original era una isla. Un producto SaaS serio necesita conectarse al workflow existente del usuario.

## **6.1 Integraciones Prioritarias**

| Integración | Qué hace | Tier mínimo |
| :---- | :---- | :---- |
| Slack | Notificaciones de leads nuevos en un canal elegido | Growth |
| Telegram Bot | Alertas instantáneas con botón de acción rápida | Growth |
| HubSpot / Pipedrive | Sync de leads Won como contactos/deals en el CRM | Enterprise |
| Webhooks genéricos | POST a cualquier URL cuando hay un evento (lead nuevo, replied, won) | Growth |
| Zapier / Make | Zapier-ready endpoints para conectar con 5000+ apps | Enterprise |
| Google Analytics | UTM tracking automático en links sugeridos por Content Lab | Starter |

# **7\. Multi-Cuenta Reddit y Account Health (NUEVO)**

Un gap crítico del spec original: no abordaba cómo el usuario conecta su cuenta de Reddit.

## **7.1 Conexión de Cuentas**

El sistema NO postea automáticamente (anti-spam, como estaba en el original). Pero sí necesita conocer la cuenta del usuario para:

* Verificar Karma y antiguöedad de la cuenta.

* Hacer shadowban check.

* Sugerir en qué subreddits tiene permiso para postear (karma mínimo, account age).

**Implementación:** OAuth2 con Reddit API (scope: identity, read, history). No se pide write scope para reforzar que NO posteamos.

## **7.2 Account Health Dashboard**

* **Karma Tracker:** Karma actual \+ gráfico de evolución. Aviso si está por debajo del mínimo para postear en subreddits clave.

* **Shadowban Checker:** Verificación automática cada 24hs consultando la página pública del perfil.

* **Posting Frequency Alert:** Si el usuario está respondiendo más de 5 posts por hora, aviso de riesgo de ban.

* **Cooldown Timer:** Recomendación visual de esperar X minutos antes del próximo reply para parecer orgánico.

# **8\. Founder Dashboard — God Mode (Mejorado)**

Se mantienen todas las funcionalidades originales y se agregan:

## **8.1 Funcionalidades originales**

* Monitor de Costos de API (OpenAI \+ Apify por usuario).

* Global Blacklist de subreddits hostiles.

* Impersonation Tool (modo lectura del dashboard de un usuario).

* Prompt Manager para actualizar System Prompts sin deploy.

## **8.2 Funcionalidades nuevas**

* **Prompt Versioning:** Historial de versiones de cada prompt con diff visual, rollback instantáneo y A/B testing entre versiones.

* **User Cohort Analytics:** Segmentación de usuarios por región, tier, industria. Métricas de retención por cohorte.

* **Feature Flags:** Via PostHog. Activar features nuevas para un % de usuarios antes de rollout completo.

* **Churn Prediction:** Alerta si un usuario no ingresó en 7 días o su actividad cayó 50%. Trigger de email de reengagement.

* **Revenue Dashboard:** MRR, churn rate, LTV, CAC integrado con LemonSqueezy analytics. Sin necesidad de herramientas externas.

* **Abuse Detection:** Detección automática de usuarios que abusan del sistema (ej: scraping excesivo, generación masiva de replies).

# **9\. Análisis de Costos Operativos (NUEVO)**

El spec original pedía este análisis pero no lo incluía. Aquí va la estimación:

## **9.1 Costos Fijos Mensuales (Infraestructura)**

| Servicio | Plan | Costo/mes |
| :---- | :---- | :---- |
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Inngest | Pro | $50 |
| Upstash Redis | Pay-as-you-go | \~$10 |
| Resend | Pro | $20 |
| Sentry | Team | $26 |
| PostHog | Free tier | $0 |
| Dominio \+ DNS | Cloudflare | $2 |
| TOTAL FIJO |  | \~$153/mes |

## **9.2 Costos Variables por Usuario (estimación)**

| Concepto | Starter | Growth | Enterprise |
| :---- | :---- | :---- | :---- |
| Apify (scraping) | $2-4/mes | $5-10/mes | $12-20/mes |
| OpenAI (clasificación) | $0.50-1 | $1-3 | $3-8 |
| OpenAI (replies) | $1-2 | $3-6 | $5-12 |
| OpenAI (Content Lab) | $0.30 | $0.80 | $1.50 |
| TOTAL por usuario | $3.80-7.30 | $9.80-19.80 | $21.50-41.50 |

## **9.3 Breakeven Analysis**

| Tier | Precio | Costo var. | Margen | Breakeven |
| :---- | :---- | :---- | :---- | :---- |
| Starter ($29/m) | $29 | \~$5.50 | $23.50 (81%) | \~7 usuarios |
| Growth ($79/m) | $79 | \~$15 | $64 (81%) | \~3 usuarios |
| Enterprise ($199/m) | $199 | \~$31 | $168 (84%) | \~1 usuario |

**Conclusión:** Con \~15 usuarios pagos se cubren costos fijos. Los márgenes por usuario son saludables (80%+). El cache semántico global reduce el costo variable a medida que crece la base de usuarios.

10\. Modelo de Pricing (Definitivo)

## **10.1 Estructura de Planes**

**Free Trial (3 dias, sin tarjeta de credito)**

* **Acceso:** Tier Growth completo durante 3 dias. El usuario experimenta el valor real del producto, no una version capada.

* **Al vencer:** La cuenta se congela (no se borran datos). El usuario puede ver su dashboard pero no generar replies ni scrapear. Puede reactivar pagando en cualquier momento.

* **Sin tarjeta:** Reduce friccion de entrada. El usuario solo ingresa email via OAuth o Magic Link.

* **Objetivo:** Que el usuario vea leads reales y genere al menos 3-5 replies en 3 dias. Si lo logra, la conversion es alta.

| Feature | Free Trial | Starter $29/m | Growth $79/m | Enterprise $199/m |
| :---- | :---- | :---- | :---- | :---- |
|  | (3 dias) | ($24/m anual) | ($66/m anual) | ($166/m anual) |
| Keywords | 20 | 10 | 25 | 50 |
| Competidores | 6 | 3 | 6 | 10 |
| Proyectos | 1 | 1 | 3 | Ilimitados |
| Cuentas Reddit | 1 | 1 | 2 | 5 |
| Scan frequency | Cada 4hs | Cada 12hs | Cada 4hs | Cada 1h |
| AI Replies/mes | 50 | 100 | 400 | 1000 |
| Content Lab posts/mes | 3 | 2 | 6 | 15 |
| Ghostwriter threads | 5 | 5 | 20 | Ilimitados |
| Evergreen threads | 5 | 5 | 15 | 30 |
| Battlecards | Si | Si | Si | Si |
| Voice Profile | 1 | 1 | 2 | 5 |
| Warm-up Engine | Basico | Basico | Avanzado | Multi-cuenta |
| Collision Detection | No | No | No | Si |
| Reply Analytics | Basico | Basico | Completo | Completo \+ export |
| Integraciones | Email | Email \+ GA | \+ Slack, Telegram, Webhooks | \+ CRM, Zapier, API |
| Team members | 1 | 1 | 3 | Ilimitados |
| Soporte | \- | Email | Email prioritario | Slack dedicado |
| Tutorial interactivo | Si | Si | Si | Si \+ onboarding call |
| DM Assistant | No | No | Si | Si |
| SERP auto-detection | No | No | No | Si |
| Founder Dashboard | \- | \- | \- | Si (self-hosted) |

## **10.2 Logica de Pricing**

* **Free Trial \= Growth:** Mostrar el valor real. Si damos trial del Starter, el valor es bajo y no convierten. 3 dias es suficiente para ver resultados sin generar costos excesivos.

* **Starter ($29/m) \- El Explorador:** Para el solopreneur que quiere probar Reddit como canal. Suficiente para validar con 10 keywords y 100 replies. La limitacion de scan cada 12hs es el dolor que motiva el upgrade.

* **Growth ($79/m) \- El Sweet Spot:** Para el founder que valido y quiere escalar. Scan cada 4hs, Ghostwriter, DM Assistant, Slack. Aca se queda el 60% de usuarios pagos.

* **Enterprise ($199/m) \- El Equipo:** Team seats, Collision Detection, scan cada 1h, 5 cuentas Reddit, Slack dedicado. Para equipos que usan Reddit como canal serio de adquisicion.

## **10.3 Plan Anual**

Descuento del 17% (equivalente a 2 meses gratis). Starter: $24/m ($288/anio). Growth: $66/m ($792/anio). Enterprise: $166/m ($1,992/anio). El plan anual mejora cash flow y reduce churn mecanicamente (el usuario ya pago, no cancela por inercia).

## **10.4 Metricas de Conversion Target**

* **Trial a Pago:** Target 15-20%. Benchmark de SaaS con trial sin tarjeta es 10-15%, pero el Discovery Mode (leads en 60 segundos) deberia superar eso.

* **Starter a Growth:** Target 30% en los primeros 3 meses. El dolor del scan cada 12hs y 100 replies es el driver principal.

* **Growth a Enterprise:** Target 10%. Solo equipos con necesidad real de team features.

* **Churn mensual:** Target menos del 5%. El Pipeline con ROI visible \+ Ghostwriter (daily engagement) son los retenedores clave.

# **11\. Modelo de Datos (Esquema Revisado)**

Se presenta el schema conceptual con las entidades principales y sus relaciones. Implementación en Supabase con migraciones SQL (no Prisma, para aprovechar RLS nativo).

**Entidades principales:**

* **users:** id, email, name, avatar\_url, lemonsqueezy\_customer\_id, created\_at

* **projects:** id, user\_id (owner), name, website\_url, value\_proposition, tone, region, language, lemonsqueezy\_subscription\_id

* **project\_members:** project\_id, user\_id, role (owner/admin/member/viewer)

* **keywords:** id, project\_id, term, type (custom/ai\_suggested/competitor), is\_active

* **competitors:** id, project\_id, name, url, weaknesses\_json

* **subreddits:** id, project\_id, name, is\_regional, avg\_daily\_posts, last\_scraped\_at

* **leads:** id, project\_id, reddit\_post\_id, title, body, subreddit, author, url, intent\_score, region\_score, sentiment, status (new/reviewing/replied/won/lost/irrelevant), assigned\_to, snoozed\_until, replied\_at, won\_value, lost\_reason, created\_at

* **lead\_replies:** id, lead\_id, style (engaging/direct/balanced/custom), content, was\_used (boolean), engagement\_score (tracked post-reply)

* **mentions:** id, project\_id, reddit\_post\_id, type (brand/competitor), competitor\_id (nullable), sentiment, url, created\_at

* **content\_drafts:** id, project\_id, subreddit, title\_options\_json, body, style, keyword\_targets, status (draft/published/tracking), published\_url, upvotes, comments\_count

* **reddit\_accounts:** id, user\_id, reddit\_username, access\_token (encrypted), karma, account\_age, is\_shadowbanned, last\_checked\_at

* **notifications\_config:** id, project\_id, channels\_json, frequency, min\_intent\_score, is\_active

* **scrape\_cache:** reddit\_post\_id (PK), raw\_data\_json, analysis\_json, analyzed\_at, embedding (vector)

* **prompt\_versions:** id, prompt\_key, version, content, is\_active, created\_by, created\_at

* **api\_usage\_log:** id, project\_id, service (openai/apify/anthropic), tokens\_used, cost\_usd, created\_at

# **12\. Seguridad, Compliance y Ética (Mejorado)**

## **12.1 Seguridad (mejorado)**

* **Anti-Spam:** Sin cambios. NUNCA se postea automáticamente. Siempre Copy & Paste humano.

* **Encriptación:** API keys y tokens de Reddit encriptados con AES-256 en Supabase Vault.

* **RLS:** Row Level Security en todas las tablas. Un usuario jamás puede acceder a datos de otro proyecto.

* **Rate Limiting:** Upstash Redis rate limiter en todos los endpoints de API (por IP y por user\_id).

* **CORS:** Configuración estricta. Solo el dominio propio puede llamar a la API.

## **12.2 Compliance con Reddit ToS (NUEVO)**

Este es un riesgo legal que el spec original no abordaba:

* **Scraping vs. API:** Reddit prohibe scraping no autorizado en sus ToS. Apify opera en una zona gris. Estrategia: usar la API oficial de Reddit (gratuita para lectura) como fuente primaria y Apify solo para datos que la API no expone (ej: posts eliminados, métricas históricas).

* **Rate limits de Reddit API:** 60 requests/minuto por OAuth token. Inngest maneja la cola y distribuye requests en el tiempo.

* **Términos de uso claros:** Nuestros ToS deben prohibir explícitamente que los usuarios usen la herramienta para spam, acoso o manipulación de votos.

## **12.3 GDPR y Data Retention (NUEVO)**

* **Data Retention:** Leads se retienen 90 días después de ser marcados como Won/Lost/Irrelevant. Después se eliminan automáticamente.

* **Right to Deletion:** Endpoint para que un usuario borre toda su data. Requerido por GDPR.

* **Data Processing Agreement:** Necesario para usuarios de la UE. Template estándar de Supabase cubre la base.

* **No PII en logs:** Sentry y PostHog configurados para NO capturar datos personales.

## **12.4 Filtrado Regional (sin cambios mayores)**

Se mantienen las 3 capas del spec original:

1. Capa de Local Subreddits (filtro grueso por país: cada país tiene su pack de subreddits pre-cargados).

2. Capa de Geographic Intent Keywords (jerga local por país: instituciones, leyes, modismos específicos).

3. Capa de Inferencia de Contexto (GPT-4o-mini detecta señales regionales).

# **13\. Estrategia Mobile-First (NUEVO)**

El spec original solo decía "debe ser mobile responsive". Eso no alcanza. Se necesita pensar mobile-first para el caso de uso de "revisar leads en el colectivo":

* **Searchbox Mobile:** Vista de una sola columna. Swipe left \= marcar irrelevante. Swipe right \= abrir detalle. Inspirado en Tinder/email apps.

* **Quick Reply:** En mobile, los 3 botones de estilo (Engaging/Direct/Balanced) son prominentes. Un tap genera, otro tap copia.

* **PWA:** Implementar como Progressive Web App con service worker. Adicionalmente, usar Capacitor (Ionic) como wrapper para generar .ipa y .apk desde la misma codebase Next.js y publicar en App Store y Play Store.

* **Offline Queue:** Si el usuario genera una respuesta sin conexión, se guarda en local storage y se sincroniza cuando vuelve.

* **Bottom Navigation:** En mobile, la sidebar se convierte en bottom nav con 5 tabs: Inbox, Mentions, Content, Analytics, Settings.

# **14\. Cache Semántico Global (Detalle Técnico)**

Se mantiene la idea original y se detalla la implementación:

## **14.1 Flujo de Cache**

6. **Deduplicación por post\_id:** Antes de enviar un post a OpenAI, se verifica en Redis si ya fue procesado. Key: reddit:{post\_id}. TTL: 7 días.

7. **Cache de análisis:** El resultado del análisis de IA se almacena en scrape\_cache (Supabase) con el embedding vectorial del post.

8. **Reutilización cross-user:** Si User A y User B monitorean el mismo subreddit, el post se scrapea y analiza una sola vez.

9. **Invalidación:** Si un post se actualiza (edit) en Reddit, el cache se invalida automáticamente en el próximo scan.

## **14.2 Ahorro Estimado**

Con 100 usuarios activos monitoreando subreddits populares, el cache reduce llamadas a OpenAI en un 60-70% estimado, y llamadas a Apify en un 40-50%.

# **15\. Testing y CI/CD (NUEVO)**

## **15.1 Estrategia de Testing**

* **Unit Tests (Vitest):** Lógica de scoring, parseo de posts, formateo de replies, cálculo de métricas.

* **Integration Tests:** Flujos de Inngest (mock de APIs externas), webhooks de LemonSqueezy, CRUD de leads.

* **E2E Tests (Playwright):** Flujo de onboarding completo, ciclo de lead (new → replied → won), generación de contenido.

* **AI Output Testing:** Suite de prompts de referencia con outputs esperados. Se corre cada vez que se actualiza un prompt para detectar regresión.

## **15.2 Pipeline de CI/CD**

* **GitHub Actions:** Lint (ESLint \+ Prettier) → Type check (TypeScript) → Unit tests → Build → Preview deploy (Vercel).

* **Preview Deployments:** Cada PR genera un preview en Vercel con su propia instancia de Supabase (branch database).

* **Production Deploy:** Merge a main → deploy automático a producción. Rollback automático si Sentry detecta spike de errores.

# **16\. Roadmap Sugerido**

| Fase | Semanas | Entregables | Métrica de éxito |
| :---- | :---- | :---- | :---- |
| MVP | Semanas 1-6 | Auth, Searchbox básico, Reply Generator, LemonSqueezy, 1 tier | 10 beta users activos |
| V1 | Semanas 7-10 | Mentions, Analytics básico, Pipeline de leads, Notificaciones | Primer pago, NPS \> 7 |
| V1.5 | Semanas 11-14 | Content Lab, Multi-proyecto, Account Health, 3 tiers | 50 usuarios, $2K MRR |
| V2 | Semanas 15-20 | Integraciones, Team roles, Mobile PWA, Founder Dashboard completo | 150 usuarios, $8K MRR |

**Recomendación:** No construir todo de una. Lanzar el MVP con Searchbox \+ Reply Generator \+ LemonSqueezy y validar con usuarios reales antes de invertir en Content Lab y analytics avanzado.

# **17\. Modo Discovery: Time to Value en 60 Segundos (NUEVO)**

Problema: el onboarding de 5 pasos es completo pero puede generar friccion. El usuario no sabe si la herramienta sirve hasta que termina de configurar todo. Si abandona en el paso 3, perdimos un cliente.

## **17.1 Concepto**

Ni bien el usuario ingresa su URL en el Paso 1, el sistema dispara en paralelo un scan rapido que muestra una "Muestra de Leads Calientes" en tiempo real MIENTRAS el usuario completa el resto de la configuracion. Esto valida la promesa del producto en los primeros 60 segundos.

## **17.2 Flujo Tecnico**

* **Extraccion instantanea:** Al ingresar la URL, el crawler extrae propuesta de valor y 5-8 keywords basicas en menos de 10 segundos.

* **Scan paralelo:** Inngest dispara un job rapido que busca esas keywords en los top 10 subreddits mas relevantes (inferidos por la IA a partir del producto).

* **Preview en vivo:** Mientras el usuario avanza por los pasos 2-5, un panel lateral/inferior muestra en tiempo real los leads que va encontrando con un mini-score.

* **Transicion al Searchbox:** Al terminar el onboarding, los leads del Discovery se migran automaticamente al Searchbox real con scoring completo.

## **17.3 UX del Discovery Panel**

* **Ubicacion:** Panel colapsable en el costado derecho o bottom sheet en mobile durante el onboarding.

* **Contenido:** Cards minimalistas con titulo del post, subreddit, y un score preliminar (bajo/medio/alto).

* **Animacion:** Los leads aparecen con animacion de entrada (fade-in) a medida que el scraper los encuentra. Genera la sensacion de "el sistema ya esta trabajando para mi".

* **CTA:** Texto tipo: "Ya encontramos 7 oportunidades para tu producto. Termina de configurar para ver el analisis completo."

## **17.4 Impacto Esperado**

Basado en benchmarks de SaaS similares, mostrar valor antes de completar el onboarding aumenta la tasa de completacion entre 30-50% y reduce el time-to-first-value de minutos a segundos. Es el feature que mas impacta en la conversion de trial a pago.

# **18\. Battlecards Dinamicas de Competidores (NUEVO)**

Problema: cuando un lead menciona a un competidor, el usuario tiene que recordar de memoria los puntos debiles para personalizar su pitch. Eso genera respuestas genericas que no convierten.

## **18.1 Concepto**

Cuando el Searchbox detecta que un lead menciona a un competidor configurado, la columna derecha muestra automaticamente una "Battlecard" contextual con 3 puntos de ataque especificos basados en las debilidades detectadas en el onboarding.

## **18.2 Estructura de una Battlecard**

* **Competidor detectado:** Nombre y URL del competidor mencionado en el post.

* **Punto de ataque \#1 \- Debilidad de producto:** Feature que el competidor no tiene o hace mal vs. lo que nosotros ofrecemos. Ej: "Competidor X no tiene integracion con Slack \- nosotros si".

* **Punto de ataque \#2 \- Sentiment de la comunidad:** Quejas recurrentes sobre el competidor detectadas en Reddit. Ej: "En r/saas, 12 usuarios se quejaron del pricing de Competidor X este mes".

* **Punto de ataque \#3 \- Diferenciador clave:** El angulo mas fuerte para esta conversacion especifica, adaptado al contexto del post. La IA elige el diferenciador mas relevante segun lo que el lead esta preguntando.

## **18.3 Integracion con Reply Generator**

El Reply Generator incorpora automaticamente los puntos de ataque de la Battlecard en la respuesta generada. El tono "Direct" los usa de forma explicita, el "Balanced" los menciona sutilmente, y el "Engaging" los usa como contexto sin mencion directa.

## **18.4 Actualizacion de Battlecards**

* **Automatica:** Cada vez que el sistema detecta nuevas menciones/quejas sobre un competidor, actualiza los puntos de ataque.

* **Manual:** El usuario puede editar o agregar puntos de ataque propios desde Settings \> Competidores.

* **Historial:** Se mantiene un log de como evolucionan las debilidades detectadas de cada competidor en el tiempo.

# **19\. Perfil de Voz de Cuenta Reddit (NUEVO)**

Problema: si un usuario gestiona multiples cuentas de Reddit (o incluso una sola), la IA puede generar respuestas con estilos contradictorios en el mismo subreddit. Los moderadores detectan inconsistencias de tono como signal de bot/spam.

## **19.1 Concepto**

Cada cuenta de Reddit vinculada tiene un "Perfil de Voz" que define como la IA debe escribir cuando genera respuestas para esa cuenta. El sistema recuerda el tono, el historial de respuestas y la "personalidad" de cada cuenta para mantener consistencia.

## **19.2 Componentes del Perfil de Voz**

* **Tono base:** Formal/Casual/Tecnico/Amigable. Se puede configurar manualmente o la IA lo infiere analizando los ultimos 20 comments del historial de la cuenta Reddit.

* **Vocabulario:** Palabras y expresiones que esta cuenta usa frecuentemente. Ej: para una cuenta rioplatense, "che", "viste", "buenisimo".

* **Prohibiciones:** Palabras o frases que esta cuenta NUNCA debe usar. Ej: "solucion innovadora", "lider en la industria" (red flags de marketing).

* **Firma:** Como cierra tipicamente los comments esta cuenta. Ej: "Espero que te sirva\!" o "Any questions, shoot me a DM".

* **Historial de contexto:** Las ultimas 50 respuestas generadas por esta cuenta, para que la IA no repita estructuras o frases.

## **19.3 Consistencia Cross-Subreddit**

El sistema trackea en que subreddits posteo cada cuenta y con que tono. Si detecta que la misma cuenta esta respondiendo en r/saas con tono corporativo y en r/smallbusiness con tono ultra-casual, muestra un warning: "Esta cuenta tiene estilos muy diferentes en estos subreddits. Los moderadores podrian notar la inconsistencia."

## **19.4 Auto-aprendizaje**

Cada vez que el usuario edita una respuesta generada antes de copiarla, el sistema registra las diferencias. Con el tiempo, el Perfil de Voz se refina automaticamente para que las respuestas necesiten cada vez menos edicion manual.

# **20\. Modo Ghostwriter: Gestion de Hilos Completos (NUEVO)**

Problema: el Reply Generator actual ayuda con el primer comentario, pero en Reddit casi nunca se cierra una venta en el primer mensaje. El flujo real es: respondes, te preguntan algo, respondes de vuelta, recien ahi te mandan DM o hacen click. El sistema te deja solo exactamente cuando la venta se pone interesante.

## **20.1 Concepto**

La IA no solo ayuda con el primer comentario, sino que monitorea el hilo completo. Cuando el lead responde, el sistema notifica al usuario y sugiere la siguiente respuesta manteniendo el contexto de toda la conversacion, guiandola progresivamente hacia el DM o el sitio web.

## **20.2 Flujo del Ghostwriter**

* **Reply inicial:** El usuario responde al post usando el Reply Generator (sin cambios).

* **Monitoreo activo:** Un Inngest job hace polling cada 15-30 minutos de los posts donde el usuario respondio, buscando replies al comment del usuario via Reddit API.

* **Notificacion de respuesta:** Cuando el lead responde, el sistema notifica al usuario por su canal configurado: "ALERTA: \[username\] te respondio en r/saas \- Interesante, pero cuanto cuesta?".

* **Siguiente respuesta sugerida:** La IA genera el proximo mensaje con contexto completo: post original \+ todos los comments del hilo \+ Battlecard del competidor (si aplica) \+ Perfil de Voz de la cuenta \+ paso actual del Conversation Playbook.

* **Escalamiento a DM/sitio:** Cuando la IA detecta que el lead esta listo (ej: pregunta por precio, pide demo), sugiere escalar: "Este lead esta caliente. Sugerimos ofrecer un DM o link directo en la proxima respuesta."

## **20.3 Conversation Playbook (Configurable)**

El usuario define su estrategia de escalamiento en pasos:

* **Paso 1 \- Dar valor:** Respuesta 100% helpful, cero mencion del producto. Establecer credibilidad.

* **Paso 2 \- Mencion sutil:** Si el lead responde positivamente, mencionar el producto como "algo que tambien podria ayudarte".

* **Paso 3 \- Ofrecer demo/DM:** Si hay interes explicito, sugerir continuar la conversacion por DM o agendar una demo.

* **Paso 4 \- Link directo:** En el DM o si el contexto lo permite, compartir link directo al sitio/producto.

El Playbook es configurable por proyecto y la IA lo usa como guia para saber en que momento escalar la conversacion. No es rigido: si el lead pregunta directamente por el precio en el primer mensaje, la IA salta al paso 3\.

## **20.4 Thread Inbox**

Nueva vista en el Searchbox (o tab separado) que muestra solo las conversaciones activas:

* **Lista de hilos:** Cada hilo muestra: post original (resumen), ultimo mensaje del lead, paso actual del Playbook, tiempo desde la ultima respuesta del lead.

* **Indicador de urgencia:** Si el lead respondio hace menos de 1 hora, badge rojo. Responder rapido en Reddit es critico para conversion.

* **Historial completo:** Al abrir un hilo, se ve toda la conversacion con los mensajes del usuario resaltados.

* **Metricas por hilo:** Numero de intercambios, tiempo promedio de respuesta, si escalo a DM/sitio.

## **20.5 Impacto en Retencion**

El Ghostwriter genera un loop de retencion: el usuario TIENE que volver a la app cada vez que le responden. Eso sube el daily active usage y la percepcion de valor. Es la diferencia entre una herramienta que usas 1 vez por semana (buscar leads) y una que usas todos los dias (gestionar conversaciones activas).

# **21\. Resumen de Nuevas Entidades de Datos**

Las 4 nuevas features requieren las siguientes entidades adicionales en el modelo de datos:

* **discovery\_previews:** id, project\_id, reddit\_post\_id, title, subreddit, preliminary\_score, discovered\_during\_onboarding (boolean), migrated\_to\_lead\_id (nullable), created\_at

* **battlecards:** id, competitor\_id, attack\_point\_product, attack\_point\_sentiment, attack\_point\_differentiator, source\_mentions\_count, last\_updated\_at, manually\_edited (boolean)

* **voice\_profiles:** id, reddit\_account\_id, tone\_base (formal/casual/tech/friendly), vocabulary\_json, prohibited\_phrases\_json, signature, recent\_replies\_json (last 50), auto\_learned\_adjustments\_json, created\_at, updated\_at

* **conversation\_threads:** id, lead\_id, reddit\_comment\_id (our reply), playbook\_current\_step, status (active/escalated/closed), last\_lead\_reply\_at, total\_exchanges, escalated\_to (dm/website/none), created\_at

* **thread\_messages:** id, thread\_id, author\_type (user/lead), reddit\_comment\_id, content, suggested\_reply (nullable), suggested\_reply\_used (boolean), created\_at

* **conversation\_playbooks:** id, project\_id, name, steps\_json (array of {step\_number, label, instruction, escalation\_trigger}), is\_default (boolean), created\_at

# **22\. Account Protection Automatica (Reemplaza Warm-up Engine)**

Se reemplaza el concepto anterior de 'Karma Warm-up Engine' (modulo separado que el usuario activaba manualmente) por un sistema unificado, invisible y automatico de proteccion de cuenta. El usuario no tiene que tomar ninguna decision: el sistema detecta el estado de la cuenta y ajusta los limites en tiempo real.

## **22.1 Account Score Dinamico**

Al conectar la cuenta de Reddit, el sistema calcula un Account Score (0-100) que combina tres factores:

| Factor | Peso | Como se mide |
| :---- | :---- | :---- |
| Karma total | 40% | Karma combinado (post \+ comment). 0 karma \= 0 puntos, 500+ karma \= 40 puntos. |
| Antiguedad | 35% | Edad de la cuenta. menos de 30 dias \= 0 puntos, 90+ dias \= 25 puntos, 1+ anio \= 35 puntos. |
| Historial | 25% | Actividad reciente. Cuenta activa con posts/comments recientes \= 25 puntos. Cuenta dormida \= 5 puntos. |

## **22.2 Niveles de Proteccion Automatica**

El Account Score determina automaticamente los limites operativos:

| Account Score | Nivel | Replies/dia | Cooldown | Links | Warm-up |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 0-25 (Cuenta nueva) | Critico | 2 | 30 min entre replies | Prohibidos | Activo: 2 sugerencias/dia |
| 26-50 (Madurando) | Precaucion | 5 | 15 min entre replies | Solo en tono Balanced | Activo: 1 sugerencia/dia |
| 51-75 (Establecida) | Normal | 10 | 5 min entre replies | Permitidos | Desactivado |
| 76-100 (Veterana) | Libre | 20+ | Sin cooldown | Permitidos | Desactivado |

## **22.3 Flujo del Usuario**

**Conexion:** Al vincular cuenta Reddit via OAuth, el sistema chequea edad \+ karma via Reddit API en menos de 5 segundos.

**Evaluacion:** Se calcula el Account Score y se determina el nivel de proteccion.

**Comunicacion:** Si el score es bajo (menor a 50), el usuario ve un banner: 'Tu cuenta esta en periodo de calentamiento' con barra de progreso visual y estimacion de cuando se liberan las restricciones.

**Warm-up automatico:** Para cuentas con score menor a 50, el sistema sugiere automaticamente comentarios de warm-up en hilos de bajo riesgo entre medio de los replies de venta. Son comentarios genuinamente utiles basados en la expertise del usuario.

**Progreso continuo:** El Account Score se recalcula cada 24hs. A medida que crece el karma, los limites se relajan automaticamente. La barra de progreso se actualiza.

**Graduacion:** Cuando el score supera 50, el warm-up se desactiva solo y los limites se relajan. El usuario recibe notificacion: 'Tu cuenta salio del calentamiento. Ahora podes responder hasta 10 leads por dia.'

## **22.4 Proteccion Activa (Always-On)**

Incluso para cuentas veteranas (score 76+), el sistema mantiene protecciones activas:

* **Rate Spike Detection:** Si el usuario pasa de 2 replies/dia a 15 de golpe, warning: 'Detectamos un aumento brusco de actividad. Reddit podria interpretarlo como spam. Te sugerimos mantener un ritmo constante.'

* **Subreddit Concentration Alert:** Si mas del 50% de los replies van al mismo subreddit, warning: 'Estas concentrando mucha actividad en r/saas. Diversifica para reducir riesgo.'

* **Link Density Check:** Si mas del 30% de los replies incluyen links, warning: 'Muchos de tus replies tienen links. Reddit puede marcarte como spammer. Alterna con replies sin links.'

* **Shadowban Check:** Verificacion automatica cada 24hs. Si se detecta shadowban, alerta inmediata con recomendaciones de recuperacion.

## **22.5 Warm-up Inteligente (Score menor a 50\)**

Para cuentas en calentamiento, el sistema busca hilos de bajo riesgo donde el usuario puede aportar valor:

* **Hilos sugeridos:** Preguntas abiertas, discusiones populares, AMAs en los subreddits objetivo del usuario.

* **Comentarios sugeridos:** Basados en la expertise del usuario (del onboarding). Genuinamente utiles, nunca spam.

* **Sin links:** Los comentarios de warm-up NUNCA incluyen links ni mencionan el producto.

* **Frecuencia:** Score 0-25: 2 sugerencias/dia. Score 26-50: 1 sugerencia/dia.

* **Copy & Open:** Mismo flujo que el Searchbox: copiar comentario \+ abrir hilo en Reddit.

* **Doble beneficio:** Los comentarios de warm-up en los subreddits objetivo construyen reputacion en esas comunidades, mejorando la recepcion de los pitches futuros.

## **22.6 Datos del Account Protection**

Entidades necesarias:

* **account\_scores:** id, reddit\_account\_id, karma\_score, age\_score, history\_score, total\_score, protection\_level, last\_calculated\_at

* **account\_activity\_log:** id, reddit\_account\_id, action\_type (reply/warmup/content), subreddit, had\_link (boolean), created\_at

* **warmup\_suggestions:** id, reddit\_account\_id, subreddit, thread\_url, suggested\_comment, status (pending/posted/skipped), karma\_gained, created\_at

* **protection\_alerts:** id, reddit\_account\_id, alert\_type (rate\_spike/concentration/link\_density/shadowban), message, acknowledged (boolean), created\_at

# **23\. Collision Detection y Anti-Cannibalization (NUEVO)**

Problema: si un equipo de 3 personas usa la herramienta para el mismo producto, podrian terminar respondiendo al mismo hilo con cuentas distintas. Reddit detecta esto como brigading (ataque coordinado) y banea permanentemente todas las cuentas involucradas.

## **23.1 Concepto**

Sistema de deteccion de colisiones que bloquea un hilo para otras cuentas del mismo proyecto cuando una cuenta ya esta interactuando con el. Incluye estrategia de 'Refuerzo' controlado para equipos.

## **23.2 Mecanismo de Bloqueo**

**Lock por hilo:** Cuando Cuenta A abre un lead o genera un reply para un hilo, ese hilo se lockea para Cuenta B y Cuenta C del mismo proyecto.

**Cooldown temporal:** Incluso si Cuenta A no responde, el hilo permanece bloqueado por 24hs despues de que Cuenta A lo abrio. Esto evita que dos cuentas del mismo equipo aparezcan en el mismo hilo en ventanas de tiempo sospechosas.

**Indicador visual:** En el Searchbox, los hilos lockeados por otro miembro muestran un badge con el nombre del miembro que lo tomo: 'Tomado por Juan hace 2hs'.

**Liberacion:** El miembro puede liberar manualmente un hilo si decide no responder. Tambien se libera automaticamente despues de 48hs sin accion.

## **23.3 Modo Refuerzo (Avanzado)**

Para equipos que quieren maximizar presencia sin parecer brigading:

* **Reglas estrictas:** La Cuenta B solo puede entrar a un hilo donde Cuenta A ya respondio despues de 6+ horas.

* **Tipo de interaccion:** Cuenta B NO puede hacer pitch de venta. Solo puede hacer un comentario de apoyo natural (ej: 'Puedo confirmar, yo tambien uso X y funciona bien para esto').

* **Limite:** Maximo 1 refuerzo por hilo. Nunca 3 cuentas en el mismo hilo.

* **La IA detecta riesgo:** Si el subreddit tiene moderadores activos o reglas anti-spam estrictas, el sistema bloquea el refuerzo y muestra: 'Este subreddit es de alto riesgo para refuerzo. Solo una cuenta por hilo'.

## **23.4 Scope**

El Collision Detection aplica a nivel de proyecto (project\_id). Si dos usuarios distintos (de empresas distintas) coinciden en el mismo hilo, NO se bloquean entre si porque son proyectos independientes.

# **24\. Evergreen Monitoring \- Thread Resurrection (NUEVO)**

Problema: el Searchbox se enfoca en posts recientes, pero muchos leads de alta intencion ocurren en comentarios nuevos dentro de hilos viejos que rankean en la primera pagina de Google. Cuando alguien busca 'best CRM for small business' en Google, el primer resultado suele ser un hilo de Reddit de hace 6 meses, y la persona deja un comentario nuevo ahi.

## **24.1 Concepto**

Permitir al usuario marcar hilos historicos de Reddit que rankean en Google para sus keywords. El sistema monitorea cada nuevo comentario en esos hilos especificos, porque esos son los leads de mayor intencion de busqueda.

## **24.2 Flujo**

**Seleccion de hilos:** El usuario puede marcar hasta 10-20 hilos como 'Evergreen' (segun tier). Puede hacerlo manualmente ingresando URLs o el sistema puede sugerir hilos que rankean en Google para sus keywords.

**Monitoreo continuo:** Inngest job cada 4-6 horas revisa nuevos comentarios en los hilos marcados.

**Clasificacion de comentarios:** GPT-4o-mini analiza cada comentario nuevo: es una pregunta? menciona un competidor? tiene intencion de compra? Si califica, se convierte en un lead dentro del Searchbox con badge 'Evergreen'.

**Respuesta en contexto:** El Reply Generator recibe como contexto no solo el comentario nuevo sino todo el hilo historico, para generar una respuesta que encaje naturalmente en una conversacion de hace meses.

## **24.3 Deteccion Automatica de Hilos Evergreen**

Ademas de la seleccion manual, el sistema puede detectar automaticamente hilos candidatos:

* **Google SERP Check:** Para cada keyword del proyecto, un job semanal busca en Google 'site:reddit.com \[keyword\]' y detecta que hilos rankean en las primeras 3 posiciones.

* **Sugerencia al usuario:** 'Detectamos que este hilo rankea \#1 en Google para tu keyword \[X\]. Queres monitorearlo?'.

* **Re-evaluacion:** Si un hilo deja de rankear en Google, el sistema sugiere desactivar el monitoreo para ahorrar recursos.

## **24.4 Limites por Tier**

* **Starter:** 5 hilos evergreen, monitoreo cada 12hs.

* **Growth:** 15 hilos evergreen, monitoreo cada 6hs.

* **Enterprise:** 30 hilos evergreen, monitoreo cada 4hs, deteccion automatica de SERP.

# **25\. Reply Analytics con Tracking Real (NUEVO)**

Problema: el sistema marca un lead como 'Replied' pero nunca verifica que paso despues. El comentario pudo recibir 50 upvotes o pudo ser removido por moderadores. Sin este feedback loop, el A/B testing de estilos de reply opera a ciegas.

## **25.1 Concepto**

Un job automatico que revisa el estado real de cada comentario posteado por el usuario 24-48 horas despues, y alimenta las metricas de Analytics con datos reales de engagement.

## **25.2 Metricas Trackeadas Post-Reply**

* **Upvotes/Downvotes:** Score neto del comentario 24hs y 48hs despues de posteado.

* **Replies recibidos:** Cuantas personas respondieron al comentario (indicador de engagement).

* **Removido por moderadores:** Si el comentario fue eliminado. Dato critico para ajustar el tono y evitar subreddits hostiles.

* **Colapsado:** Si Reddit colapso el comentario por bajo score (indicador de que el pitch fue demasiado agresivo).

* **Autor del post respondio:** Si el OP (la persona que hizo el post original) respondio al comentario. Esto es el indicador mas fuerte de engagement exitoso.

## **25.3 Feedback Loop**

Los datos de tracking real alimentan:

* **A/B Testing real:** En vez de asumir que 'Balanced' funciona mejor, ahora hay datos: 'Balanced tiene 2.3x mas upvotes promedio que Direct en r/saas'.

* **Subreddit Difficulty Score:** Si los comentarios en un subreddit consistentemente son removidos o colapsados, el score de dificultad sube y el usuario recibe warning.

* **Perfil de Voz:** Si las respuestas editadas por el usuario reciben mejor engagement que las generadas sin edicion, el sistema aprende del patron.

* **Ghostwriter:** Las respuestas en hilos donde el primer comentario tuvo buen engagement se priorizan para follow-up.

# **26\. Subreddit Relationship Score (NUEVO)**

Problema: no todos los subreddits tratan igual a las cuentas. Algunos tienen karma minimo, otros banean self-promotion, otros son super friendly. El usuario no tiene forma de saber esto sin experiencia previa en cada comunidad.

## **26.1 Concepto**

Un perfil de dificultad y receptividad por subreddit que le dice al usuario como comportarse en cada comunidad. Se construye automaticamente a partir de las reglas del subreddit, historial de moderacion, y datos de engagement de todos los usuarios de la plataforma.

## **26.2 Componentes del Score**

* **Difficulty Score (1-10):** Que tan dificil es postear sin ser baneado. Basado en: karma minimo requerido, restricciones de account age, reglas anti-spam, frecuencia de posts removidos de usuarios de la plataforma.

* **Receptivity Score (1-10):** Que tan bien reciben los pitches sutiles. Basado en: engagement promedio de respuestas de nuestros usuarios, tasa de upvotes vs downvotes, si el OP suele responder.

* **Best Strategy:** Recomendacion de la IA: 'En r/saas usa tono Engaging sin links. En r/smallbusiness podes ser mas Direct. En r/startups evita mencionar pricing'.

* **Link Policy:** Si el subreddit permite links en comentarios, si tiene whitelist de dominios, si los links se auto-remueven.

* **Active Mods:** Indicador de que tan activos son los moderadores (alto \= mas riesgo de remocion).

## **26.3 Construccion del Score**

* **Automatica inicial:** Al agregar un subreddit, el scraper extrae las reglas y el sistema asigna un score preliminar.

* **Datos crowdsourced:** A medida que los usuarios de la plataforma postean en un subreddit, los datos de engagement y remocion refinan el score para todos (anonimizado).

* **Actualizacion continua:** El score se recalcula semanalmente con los datos mas recientes.

* **Override manual:** El usuario puede marcar un subreddit como 'hostil' o 'friendly' basado en su experiencia personal.

# **27\. DM Automation Assistant (NUEVO)**

Problema: el Ghostwriter lleva la conversacion del hilo publico hasta el punto de escalamiento a DM, pero despues deja al usuario solo. El primer mensaje de DM es critico: tiene que continuar la conversacion del hilo de forma natural y llevar al lead hacia la conversion final.

## **27.1 Concepto**

Un modulo que sugiere el primer mensaje de DM con contexto completo del hilo, y despues trackea si el lead respondio al DM para cerrar el funnel de conversion.

## **27.2 Flujo**

**Trigger:** Cuando el Ghostwriter detecta que el lead esta listo para DM (pregunta por precio, pide demo, dice 'mandame info'), sugiere: 'Este lead esta listo. Queres que genere el primer DM?'.

**Generacion del DM:** La IA genera el mensaje de DM con: referencia natural al hilo ('Hola\! Siguiendo nuestra charla en r/saas...'), propuesta de valor personalizada basada en lo que el lead pregunto, CTA claro (link a demo, pricing page, o propuesta de llamada).

**Copy & Send:** El usuario copia el DM, abre Reddit y lo envia manualmente (nunca automatico, consistente con la politica anti-spam).

**Follow-up tracking:** El sistema marca el thread como 'Escalado a DM' y hace polling de la inbox de Reddit (con scope adecuado) para detectar si el lead respondio.

**Cierre del funnel:** Si el lead responde al DM, notificacion al usuario con sugerencia de siguiente mensaje. Si no responde en 48hs, sugerencia de follow-up sutil.

## **27.3 Templates de DM**

* **Warm intro:** Para leads que ya mostraron interes explicito en el hilo. Tono personal y directo.

* **Soft follow-up:** Para leads que no respondieron al primer DM. Un recordatorio sutil sin ser pushy.

* **Value-first:** Para leads que pidieron mas info. Incluye un recurso gratuito (guia, caso de estudio) antes de pedir la venta.

## **27.4 Consideraciones de Privacidad**

* **Scope de Reddit API:** Se necesita scope 'privatemessages' para poder detectar respuestas a DMs. Esto se solicita por separado del OAuth inicial y el usuario debe autorizar explicitamente.

* **Opt-in:** El DM Assistant es 100% opt-in. El usuario puede usar el Ghostwriter sin activar esta funcionalidad.

* **No automatico:** Igual que con los replies publicos, NUNCA se envian DMs automaticamente. Siempre copy & paste manual.

# **28\. Entidades de Datos Adicionales (v2.2)**

Las 6 nuevas features requieren las siguientes entidades adicionales al modelo de datos:

* **karma\_warmup\_tasks:** id, reddit\_account\_id, subreddit, thread\_url, thread\_title, suggested\_comment, status (pending/posted/skipped), karma\_gained, posted\_at

* **karma\_progress:** id, reddit\_account\_id, target\_subreddit, required\_karma, current\_karma, progress\_pct, last\_checked\_at

* **thread\_locks:** id, project\_id, reddit\_post\_id, locked\_by\_user\_id, locked\_by\_account\_id, locked\_at, expires\_at, released\_at

* **reinforcement\_rules:** id, project\_id, max\_accounts\_per\_thread, min\_delay\_hours, allowed\_interaction\_type (upvote/support\_comment), high\_risk\_subreddits\_json

* **evergreen\_threads:** id, project\_id, reddit\_post\_id, url, title, google\_rank\_position, keyword\_matched, is\_active, last\_checked\_at, new\_comments\_since\_last\_check

* **reply\_tracking:** id, lead\_reply\_id, reddit\_comment\_id, upvotes\_24h, upvotes\_48h, replies\_count, was\_removed, was\_collapsed, op\_responded, checked\_at

* **subreddit\_scores:** id, subreddit, difficulty\_score, receptivity\_score, best\_strategy, link\_policy, active\_mods\_level, karma\_minimum, account\_age\_minimum, rules\_summary, last\_updated\_at

* **dm\_conversations:** id, thread\_id, lead\_id, reddit\_account\_id, first\_dm\_content, first\_dm\_sent\_at, lead\_responded (boolean), lead\_response\_at, followup\_sent (boolean), status (sent/responded/no\_response/converted)

* **dm\_templates:** id, project\_id, type (warm\_intro/soft\_followup/value\_first), content\_template, created\_at

# **29\. Tutorial Interactivo y Guided Onboarding UX (NUEVO)**

Problema: el producto tiene muchas funcionalidades (Searchbox, Mentions, Content Lab, Analytics, Account Health, Ghostwriter, etc.). Un usuario nuevo que entra al dashboard por primera vez sin guia se congela y no sabe por donde empezar. Esto causa abandono en la primera sesion.

## **29.1 Estrategia de 3 Capas**

El sistema de tutorial opera en 3 capas complementarias que guian al usuario desde el primer segundo hasta que es un power user:

## **29.2 Capa 1: Product Tour Interactivo (Primera vez)**

Se activa automaticamente la primera vez que el usuario entra al dashboard despues del onboarding. Usa React Joyride para mostrar tooltips paso a paso con overlay oscuro que destaca cada seccion.

Pasos del tour (7 pasos, 2 minutos):

**Searchbox:** 'Este es tu centro de operaciones. Aca aparecen todos los leads detectados por la IA, ordenados por relevancia. Tu objetivo: Inbox Zero.'

**Lead Card:** 'Cada lead muestra el titulo, subreddit, y un score de intencion. Los rojos son los mas calientes. Hace click para ver el detalle.'

**Reply Generator:** 'Aca la IA te genera respuestas en 3 tonos. Elegis uno, editas si queres, y Copy & Open lo copia y abre Reddit.'

**Mentions:** 'Aca ves cuando alguien menciona tu marca o un competidor. Las menciones negativas te llegan como alerta.'

**Analytics:** 'Tus metricas: cuantos leads respondiste, cuantos convertiste, y tu ROI. Esto es lo que justifica la suscripcion.'

**Content Lab:** 'Para cuando quieras pasar de reactivo a proactivo: crea posts que te posicionen como experto en tus subreddits.'

**Settings:** 'Keywords, competidores, notificaciones y billing. Todo configurable aca.'

Reglas del tour:

* **Skip-able:** Boton 'Saltar tour' visible en todo momento. Nunca forzar.

* **Progreso visible:** Indicador '3 de 7' para que el usuario sepa cuanto falta.

* **Responsive:** En mobile, los tooltips se adaptan a bottom sheet en vez de popover lateral.

* **Re-accesible:** Boton 'Repetir tour' en Settings para usuarios que quieran refrescar.

* **Animacion:** Cada tooltip aparece con transicion suave. El area destacada tiene un pulso sutil para guiar la atencion.

## **29.3 Capa 2: Tareas Guiadas \- Getting Started Checklist (Primera semana)**

Un panel persistente en el dashboard (colapsable) con un checklist de primeras acciones. Cada tarea completada da una micro-celebracion (confetti sutil, check animado) y desbloquea la siguiente.

Tareas del checklist (en orden):

**Revisa tu primer lead:** Abrir un lead en el Searchbox y leer el detalle completo. Se completa automaticamente al abrir un lead.

**Genera tu primera respuesta:** Usar el Reply Generator en cualquier tono. Se completa al generar.

**Responde tu primer lead:** Usar Copy & Open. Se completa al marcar como Replied.

**Descarta un lead irrelevante:** Marcar un lead como irrelevante. Refuerza la filosofia Inbox Zero.

**Revisa tus Mentions:** Abrir la seccion Mentions. Se completa al visitar.

**Configura notificaciones:** Elegir canal y frecuencia en Settings. Se completa al guardar.

**Marca tu primer Won:** Cuando un lead convierta, marcarlo como Won con valor. Se completa al marcar.

Reglas del checklist:

* **Persistente:** Visible como panel lateral o widget flotante hasta completar todas las tareas.

* **Porcentaje:** Barra de progreso: 'Setup completado: 57% (4 de 7)'.

* **No bloquea:** El usuario puede usar cualquier feature sin haber completado el checklist.

* **Celebracion final:** Al completar las 7 tareas: 'Felicitaciones\! Ya dominas lo basico. Ahora explora Content Lab y Analytics para llevar tu juego al siguiente nivel.'

* **Persistencia:** Estado guardado en Supabase (campo onboarding\_checklist\_json en tabla users). No se pierde al cerrar sesion.

## **29.4 Capa 3: Tooltips Contextuales (Ongoing)**

La primera vez que el usuario entra a una seccion que no visito antes, aparece un mini-tutorial especifico de esa seccion. No se repite despues.

* **Content Lab (primera visita):** 'Bienvenido al Content Lab\! Aca la IA te sugiere temas trending y te ayuda a crear posts que posicionen tu marca. Empeza eligiendo un subreddit.'

* **Ghostwriter (primera notificacion de reply):** 'Un lead te respondio\! El Ghostwriter te sugiere la proxima respuesta siguiendo tu Playbook. Revisa la sugerencia y usa Copy & Open.'

* **Battlecard (primera deteccion de competidor):** 'Detectamos que este lead menciona a \[competidor\]. La Battlecard te muestra 3 puntos de ataque para personalizar tu respuesta.'

* **Evergreen (primera configuracion):** 'Los hilos Evergreen son posts viejos que rankean en Google. Nuevos comentarios ahi son leads de altisima intencion.'

* **Warm-up (primera deteccion de bajo karma):** 'Tu cuenta tiene poco karma para postear en r/saas. El Warm-up Engine te sugiere comentarios para subir karma de forma organica.'

## **29.5 Implementacion Tecnica**

* **Libreria:** React Joyride para el Product Tour (soporta steps, overlay, callbacks, mobile responsive).

* **Estado:** Campo onboarding\_progress\_json en tabla users con: tour\_completed (boolean), checklist\_tasks (array de {task\_id, completed\_at}), sections\_visited (array de strings).

* **Tracking:** Cada paso del tour y tarea del checklist envia evento a PostHog para medir drop-off y optimizar.

* **A/B testing:** Via feature flags de PostHog, testear variantes del tour (ej: 5 pasos vs 7 pasos, con video vs sin video).

# **30\. Estrategia Mobile: PWA \+ Capacitor (Detalle Tecnico)**

Se actualiza la seccion 13 (Mobile-First) con la estrategia completa de distribucion mobile. La decision es NO desarrollar apps nativas en Swift/Kotlin. En su lugar, se usa Capacitor como wrapper sobre la PWA de Next.js.

## **30.1 Por que NO nativo**

* **Una sola codebase:** Mantener 3 codebases (web \+ iOS \+ Android) con un equipo chico es insostenible. Next.js \+ Capacitor \= 1 codebase, 3 plataformas.

* **El producto es text-first:** No necesita camara, GPS, bluetooth, sensores, AR ni nada que requiera acceso hardware profundo. Las acciones principales son: leer texto, generar texto, copiar texto.

* **Time to market:** Desarrollar apps nativas duplica o triplica el tiempo de desarrollo de cada feature.

* **Cuando si nativo:** Solo si el producto escala a \+10K usuarios y se necesita performance extrema de scroll en listas de miles de leads, o widgets de home screen. Eso es problema de V3+.

## **30.2 Stack Mobile**

* **PWA base:** Next.js con service worker (next-pwa o Serwist), manifest.json, offline support.

* **Capacitor wrapper:** Genera .ipa (iOS) y .apk (Android) desde la misma web app. Agrega: push notifications nativas (Firebase Cloud Messaging / APNs), haptic feedback en swipe gestures, deep links, splash screen nativo.

* **Distribucion:** Web: acceso directo via browser \+ banner 'Instalar App'. iOS: App Store via Capacitor build. Android: Play Store via Capacitor build.

## **30.3 Flujo de Build**

**Desarrollo:** Todo se desarrolla en Next.js como web app normal. Se testea en browser.

**Build web:** next build genera la web app optimizada. Se despliega en Vercel.

**Build mobile:** npx cap sync copia el build web al proyecto nativo de Capacitor.

**iOS:** npx cap open ios abre Xcode. Se compila y sube a App Store Connect.

**Android:** npx cap open android abre Android Studio. Se compila y sube a Play Console.

**Actualizaciones:** Para cambios que no tocan plugins nativos, se puede hacer live update sin pasar por review de App Store (via Capgo o similar).

## **30.4 Features Nativas via Capacitor**

* **Push Notifications:** @capacitor/push-notifications. Firebase para Android, APNs para iOS. Mas robustas que las de service worker.

* **Haptic Feedback:** @capacitor/haptics. Vibracion sutil en swipe left (descartar) y swipe right (abrir) del Searchbox mobile.

* **Share:** @capacitor/share. Compartir un lead o respuesta via WhatsApp, Telegram, etc.

* **App Badge:** @capacitor/badge. Numero de leads sin leer en el icono de la app.

* **Deep Links:** @capacitor/app. Links directos desde notificaciones que abren la app en el lead especifico.

* **Biometric Auth:** Opcion futura para login con Face ID / fingerprint.

## **30.5 Costo Adicional**

Apple Developer Account: $99/anio. Google Play Developer: $25 (unico pago). Capgo para live updates: \~$14/mes. Total: \~$15/mes adicional sobre la infraestructura existente.

# **31\. Riesgos y Mitigaciones**

| Riesgo | Probabilidad | Impacto | Mitigación |
| :---- | :---- | :---- | :---- |
| Reddit cambia API/ToS | Media | Alto — bloqueo total de data sourcing | Doble fuente (API \+ Apify). Monitoring de changelog de Reddit. |
| OpenAI rate limits/downtime | Media | Medio — replies no disponibles | Fallback a Anthropic Claude. Circuit breaker. |
| Usuarios banneados en Reddit | Alta | Alto — churn directo | Account Health, cooldown timers, educación al usuario. |
| Competidor copia el modelo | Media | Medio — compresión de precios | Moat: Content Lab \+ SEO \+ regional filters. |
| Costos de IA escalan rápido | Baja | Alto — márgenes negativos | Cache semántico \+ metered billing \+ alertas de costo. |
| Baja retención | Media | Alto — negocio no viable | Pipeline con ROI visible. Churn prediction \+ reengagement. |

*Fin del Documento — Reddit Lead Radar v2.4*