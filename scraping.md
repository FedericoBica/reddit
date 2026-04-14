

**REDDPROWL**

Estrategia de Data Sourcing y Scraping

Documento tecnico para el equipo de desarrollo

# **1\. Panorama Actual de Acceso a Datos de Reddit (2026)**

Desde los cambios de pricing de 2023, Reddit estructuro el acceso a datos en 3 tiers claros. Entender cada uno es critico para disenar la estrategia de data sourcing de ReddProwl.

## **1.1 Reddit API Oficial (OAuth2) \- Tier Gratuito**

| Aspecto | Detalle |
| :---- | :---- |
| Rate Limit | 100 requests/minuto con OAuth. 10 req/min sin auth. |
| Costo | Gratis para uso no-comercial. Uso comercial requiere tier Standard ($12,000/anio). |
| Que podes hacer | Buscar posts por keyword dentro de un subreddit, leer comentarios, verificar perfil/karma de usuario, leer inbox/DMs (con scope). |
| Que NO podes hacer | Busqueda full-text across all Reddit (solo por subreddit). Posts eliminados. Metricas historicas detalladas. Scraping masivo paralelo. |
| Riesgo legal | Bajo. Es el canal oficial y aprobado por Reddit. |
| Riesgo tecnico | Medio. Los rate limits son restrictivos para monitoreo intensivo. |

Punto critico para ReddProwl: Reddit define 'uso comercial' como 'un producto que monetiza data de Reddit'. ReddProwl monetiza las respuestas generadas por IA, no la data en si. Esto nos pone en una zona gris que hay que consultar con un abogado, pero muchos productos similares (GummySearch, Syften) operan con el tier gratuito sin problemas reportados.

## **1.2 Apify (Reddit Scraper Actor)**

| Aspecto | Detalle |
| :---- | :---- |
| Que es | Servicio de scraping-as-a-service. Corre bots headless en sus servidores. No usa tu IP. |
| Costo | \~$0.002 por post. $5 gratis/mes. Plans desde $49/mes para 100K credits. |
| Ventaja principal | Busqueda full-text across Reddit completo. Acceso a data que la API no expone. Sin riesgo de ban de tu infra. |
| Que NO podes hacer | Acceso a posts privados. Garantia de uptime (depende de Apify). |
| Riesgo legal | Alto. Reddit prohibe scraping en sus ToS. Apify opera en zona gris. |
| Riesgo tecnico | Medio-Alto. Si Reddit bloquea Apify (ya lo hicieron parcialmente), la fuente se cae. |

## **1.3 PullPush / Arctic Shift (Reddit Archive)**

| Aspecto | Detalle |
| :---- | :---- |
| Que es | Archivos publicos de data historica de Reddit (sucesor de Pushshift). |
| Costo | Gratis. Torrents academicos con millones de posts/comments. |
| Sirve para | Evergreen Monitoring (hilos viejos), analisis historico de competidores, seed data para onboarding. |
| NO sirve para | Data en tiempo real. Tiene delay de horas o dias. |
| Riesgo legal | Bajo. Datos publicos liberados por Reddit. |

## **1.4 Alternativas Emergentes**

* **SociaVault:** API no oficial con busqueda full-text. \~$0.002 por post. Maneja IP rotation y anti-bot automaticamente.

* **ScraperAPI:** Proxy rotativo generico. $49/mes. Vos manejas la logica de scraping, ellos manejan IPs y CAPTCHAs.

* **Data365:** API social con Reddit pre-indexado. Pricing transparente. Buena opcion para volumen alto.

* **RSS Feeds de Reddit:** Gratis. Agregar .rss a cualquier URL de Reddit. Limitado pero util para monitoreo basico.

# **2\. Estrategia de Data Sourcing Recomendada para ReddProwl**

La estrategia es de 3 capas con failover automatico. Nunca depender de una sola fuente.

## **2.1 Arquitectura de 3 Capas**

**Capa 1 \- Reddit API Oficial (Fuente Primaria)**

Es la fuente principal. Legal, gratuita, y suficiente para el 70% de las operaciones de ReddProwl.

* **Usa para:** Busqueda de posts por keyword dentro de subreddits configurados. Lectura de comentarios de posts detectados. Verificacion de karma/perfil para Account Protection. Monitoreo de replies para Ghostwriter (polling de comment replies). Shadowban check (consulta de perfil publico).

* **Implementacion:** PRAW (Python Reddit API Wrapper) o llamadas HTTP directas desde Next.js API routes. OAuth2 con scope: identity, read, history. Token refresh automatico.

* **Rate limit management:** 100 req/min. Inngest maneja la cola de requests distribuyendolos en el tiempo. Cada proyecto tiene un budget de requests/hora basado en su tier.

**Capa 2 \- Apify como Complemento (Fuente Secundaria)**

Para lo que la API oficial no puede hacer. Se usa solo cuando es necesario.

* **Usa para:** Busqueda full-text across Reddit (cuando el usuario busca una keyword que puede estar en cualquier subreddit, no solo en los configurados). Scraping inicial masivo durante el onboarding (Modo Discovery necesita resultados rapidos de muchos subreddits). Deteccion automatica de hilos Evergreen via Google SERP check.

* **Implementacion:** Apify Reddit Scraper Actor via API. Llamadas desde Inngest jobs en background. Resultados se cachean en Redis \+ Supabase.

* **Cuando NO usar Apify:** Para operaciones que la API oficial puede resolver. Cada call a Apify tiene costo, la API oficial es gratis.

**Capa 3 \- Arctic Shift / PullPush (Fuente Historica)**

Para data historica que ni la API ni Apify cubren bien.

* **Usa para:** Pre-cargar hilos historicos relevantes durante el onboarding. Analisis de patrones de competidores en los ultimos 12 meses. Seed data para entrenar el scoring de intension.

* **Implementacion:** Download de datasets via torrent. Procesamiento batch con scripts Python. Se corre una vez al mes para actualizar la base historica.

## **2.2 Flujo de Failover Automatico**

1. **Intento 1:** Reddit API Oficial. Si responde OK, se usa esa data.

2. **Intento 2:** Si la API falla (rate limit, timeout, error 5xx), Inngest reintenta con exponential backoff (1s, 5s, 30s).

3. **Intento 3:** Si despues de 3 reintentos la API sigue fallando, se activa Apify como fallback automatico.

4. **Alerta:** Si ambas fuentes fallan, se notifica al Founder Dashboard y se activa el modo degradado (se muestran los ultimos resultados cacheados).

# **3\. Datos a Extraer por Operacion**

## **3.1 Scan de Subreddits (operacion principal)**

Se ejecuta segun frecuencia del tier: cada 12hs (Starter), 4hs (Growth), 1h (Enterprise).

**Request a Reddit API:**

* Endpoint: GET /r/{subreddit}/search?q={keyword}\&sort=new\&t=day\&limit=25

* Para cada subreddit configurado x cada keyword activa del proyecto.

**Datos a extraer por post:**

| Campo | Fuente | Para que se usa |
| :---- | :---- | :---- |
| post\_id | API: name/id | Deduplicacion en cache global Redis |
| title | API: title | Display en Searchbox \+ input para IA scoring |
| body/selftext | API: selftext | Analisis de intencion por IA \+ display en detalle |
| subreddit | API: subreddit | Filtrado \+ analytics por subreddit |
| author | API: author | Display \+ DM targeting |
| url / permalink | API: permalink | Copy & Open \+ Evergreen tracking |
| created\_utc | API: created\_utc | Filtro de frescura \+ badge Fresh |
| score (upvotes) | API: score | Trending detection \+ Reply Analytics |
| num\_comments | API: num\_comments | Filtro Unanswered (0 comments) \+ engagement |
| link\_flair\_text | API: link\_flair\_text | Contexto adicional para IA scoring |
| is\_self | API: is\_self | Distinguir text posts de link posts |

## **3.2 Lectura de Comentarios (al abrir un lead)**

Se ejecuta on-demand cuando el usuario hace click en un lead en el Searchbox.

* Endpoint: GET /r/{subreddit}/comments/{post\_id}?sort=best\&limit=50

**Datos a extraer por comment:**

* **comment\_id:** Para tracking de replies del Ghostwriter.

* **author:** Para detectar si el OP respondio.

* **body:** Para context-aware Reply Generator.

* **score:** Para mostrar engagement.

* **created\_utc:** Para ordenar cronologicamente.

* **parent\_id:** Para reconstruir la estructura de hilos anidados.

* **replies (nested):** Para mostrar la conversacion completa.

## **3.3 Verificacion de Account Health**

Se ejecuta al vincular cuenta Reddit y cada 24hs despues.

* Endpoint: GET /api/v1/me (con token OAuth del usuario)

* Endpoint: GET /user/{username}/about (publico, para shadowban check)

**Datos a extraer:**

* **link\_karma \+ comment\_karma:** Para calcular Account Score.

* **created\_utc:** Antiguedad de la cuenta.

* **verified:** Si el email esta verificado.

* **subreddit karma breakdown:** Karma por subreddit especifico (GET /api/v1/me/karma).

## **3.4 Monitoreo de Ghostwriter (polling de replies)**

Se ejecuta cada 15-30 min para leads con status Replied que tienen Ghostwriter activo.

* Endpoint: GET /r/{subreddit}/comments/{post\_id}?comment={our\_comment\_id}

**Logica:**

* **Buscar replies al comment\_id del usuario:** Si hay replies nuevos (comparar con ultima revision), disparar notificacion \+ generar sugerencia de respuesta.

* **Extraer:** body, author, score, created\_utc del reply nuevo.

* **Desactivacion:** Si no hay actividad nueva en 7 dias, desactivar monitoreo automaticamente.

## **3.5 Evergreen Monitoring**

Se ejecuta cada 4-12hs segun tier para hilos marcados como Evergreen.

* Mismo endpoint que lectura de comentarios, pero comparando num\_comments actual vs. almacenado.

* **Si num\_comments aumento:** Extraer los nuevos comentarios y pasarlos por clasificacion IA.

* **SERP check (Enterprise):** Apify Google Scraper Actor para verificar ranking de hilos en Google. Frecuencia: semanal.

# **4\. Budget de Requests por Tier**

Con 100 req/min de Reddit API, el budget diario total es \~144,000 requests. Hay que distribuirlo entre todos los usuarios.

## **4.1 Estimacion de Consumo por Operacion**

| Operacion | Requests | Frecuencia |
| :---- | :---- | :---- |
| Scan 1 subreddit x 1 keyword | 1 | Segun tier (2x-24x/dia) |
| Leer comentarios de 1 post | 1-3 | On-demand (usuario hace click) |
| Account Health check | 3 | 1x/dia por cuenta Reddit |
| Ghostwriter polling 1 hilo | 1 | Cada 15-30 min por hilo activo |
| Evergreen check 1 hilo | 1 | Cada 4-12hs por hilo |

## **4.2 Budget por Usuario por Dia**

| Operacion | Starter | Growth | Enterprise |
| :---- | :---- | :---- | :---- |
| Scans (subs x keys x freq) | 10 subs x 10 keys x 2/dia \= 200 | 15 subs x 25 keys x 6/dia \= 2,250 | 20 subs x 50 keys x 24/dia \= 24,000 |
| Comments on-demand | \~20 | \~50 | \~100 |
| Account Health | 3 | 6 | 15 |
| Ghostwriter polling | 5 hilos x 48 \= 240 | 20 x 48 \= 960 | 50 x 96 \= 4,800 |
| Evergreen | 5 x 2 \= 10 | 15 x 4 \= 60 | 30 x 6 \= 180 |
| TOTAL/dia | \~473 | \~3,326 | \~29,095 |

## **4.3 Capacidad del Sistema**

Con 144,000 req/dia disponibles en un token OAuth:

* **Solo Starters:** \~304 usuarios simultaneos.

* **Solo Growth:** \~43 usuarios simultaneos.

* **Solo Enterprise:** \~4 usuarios simultaneos.

**Solucion para escalar:** Multiples tokens OAuth. Cada proyecto puede tener su propio token (el usuario autoriza su cuenta Reddit). Esto multiplica el budget por la cantidad de usuarios con cuenta vinculada. Con 50 usuarios Growth cada uno con su token, el budget es practicamente ilimitado.

**Cache global Redis:** El factor clave. Si User A y User B monitorean r/saas con la keyword 'CRM', el scan se hace UNA sola vez y ambos reciben el resultado. Con 100 usuarios en subreddits populares, el cache reduce las requests reales en un 60-70%.

# **5\. Pipeline de Procesamiento de Datos**

## **5.1 Flujo Completo (Inngest Events)**

5. **scraper.scheduled:** Cron job dispara el scan. Frecuencia segun tier del proyecto.

6. **scraper.execute:** Para cada proyecto: iterar subreddits x keywords. Verificar cache Redis antes de cada request. Si el post ya fue visto (post\_id en cache), skip.

7. **posts.discovered:** Posts nuevos (no cacheados) se insertan en Redis (TTL 7 dias) y se encolan para clasificacion.

8. **posts.classify:** GPT-4o-mini clasifica en batch (hasta 10 posts por request): intent\_score (1-100), region\_score (1-10), sentiment (pos/neg/neutral), keywords\_matched, competitor\_detected.

9. **leads.qualified:** Posts con intent\_score superior al umbral del usuario se insertan en Supabase como leads con status 'new'.

10. **leads.notify:** Se dispara notificacion segun configuracion del usuario (push, email, Slack, Telegram).

11. **leads.opened:** Cuando el usuario hace click, se cargan comentarios on-demand y se cambia status a 'reviewing'.

12. **leads.replied:** Copy & Open ejecutado. Se activa Ghostwriter monitoring para ese hilo.

13. **ghostwriter.poll:** Cada 15-30 min, polling de replies. Si hay reply nuevo, notificacion \+ sugerencia.

14. **reply.track:** 24hs y 48hs post-reply: verificar upvotes, remocion, engagement del comentario del usuario.

## **5.2 Deduplicacion y Cache**

* **Redis key format:** reddprowl:post:{post\_id} con TTL de 7 dias.

* **Redis value:** JSON con el analisis de IA ya procesado (intent\_score, sentiment, etc).

* **Lookup:** Antes de enviar un post a OpenAI, se verifica si ya existe en Redis. Si existe, se reutiliza el analisis sin gastar tokens de IA.

* **Cross-user:** El cache es global. Si User A y User B matchean el mismo post, se analiza una sola vez.

* **Invalidacion:** Si un post se actualiza en Reddit (edit), el cache se invalida en el proximo scan (se detecta por cambio en 'edited' timestamp).

# **6\. Clasificacion con IA (El Cerebro del Scoring)**

## **6.1 Modelo de Clasificacion**

* **Modelo principal:** GPT-4o-mini. Barato ($0.15/1M input tokens), rapido, suficiente para clasificacion.

* **Modelo fallback:** Claude 3.5 Haiku (Anthropic). Se activa si OpenAI falla 3 veces consecutivas.

* **Batch processing:** Hasta 10 posts por request para reducir overhead de API calls.

## **6.2 System Prompt de Clasificacion**

El prompt debe extraer 5 dimensiones de cada post:

* **Intent Score (1-100):** Probabilidad de que el autor este buscando una solucion comercial. 90+ \= esta pidiendo recomendaciones. 70-89 \= esta evaluando opciones. 50-69 \= tiene un problema pero no busca activamente. Menor a 50 \= informacional, no es lead.

* **Region Score (1-10):** Probabilidad de que el autor sea del pais configurado. Buscar senales: moneda (ARS, pesos, usd blue), modismos (che, viste, laburo), instituciones (AFIP, BPS, DGI), leyes locales, ciudades mencionadas.

* **Sentiment:** Positivo (recomienda algo), Negativo (se queja de algo), Neutral (pregunta objetiva).

* **Keywords Matched:** Cuales de las keywords del proyecto matchearon y en que contexto.

* **Competitor Detected:** Si se menciona algun competidor configurado, cual y en que contexto (queja, recomendacion, comparacion).

## **6.3 Costo Estimado de IA por Scan**

Un post tipico tiene \~200 tokens (titulo \+ body resumido). Con batch de 10 posts:

* **Input:** \~2,500 tokens (system prompt \+ 10 posts).

* **Output:** \~500 tokens (JSON con scores de 10 posts).

* **Costo:** \~$0.00045 por batch de 10 posts. \~$0.000045 por post.

* **A escala:** Un usuario Growth que procesa 500 posts/mes gasta \~$0.02 en clasificacion IA. Negligible.

# **7\. Seguridad, Rate Limiting y Compliance**

## **7.1 Rate Limiting Interno**

* **Por proyecto:** Budget de requests/hora basado en tier. Starter: 20 req/hora a Reddit API. Growth: 100\. Enterprise: 500\.

* **Global:** Upstash Redis rate limiter. Si el sistema se acerca al 80% del budget global (100 req/min), los scans de Starter se pausan y se priorizan Growth/Enterprise.

* **Circuit breaker:** Si Reddit API devuelve 429 (rate limit) 3 veces en 5 min, se pausa todo scraping por 10 min y se notifica al Founder Dashboard.

## **7.2 Compliance con Reddit ToS**

* **Posicion legal:** ReddProwl usa la Reddit API oficial como fuente primaria. No republicamos contenido de Reddit. Generamos respuestas originales con IA. Los usuarios hacen copy/paste manualmente (nunca posteo automatico).

* **Apify como riesgo:** El uso de Apify para scraping esta en zona gris legal. Minimizar su uso y tener plan de contingencia si Reddit lo bloquea.

* **ToS propios:** Nuestros terminos de servicio deben prohibir explicitamente: spam, acoso, manipulacion de votos, y cualquier uso que viole los ToS de Reddit.

* **User-Agent:** Todas las requests a Reddit API deben incluir un User-Agent descriptivo: 'ReddProwl/1.0 (by /u/{account})' como requiere Reddit.

## **7.3 Data Privacy**

* **Posts de Reddit son publicos:** No estamos accediendo a data privada. Los posts y comentarios que procesamos son publicamente visibles.

* **No almacenamos PII:** No guardamos datos personales de los autores de Reddit mas alla de su username publico.

* **Tokens encriptados:** Los OAuth tokens de las cuentas Reddit de nuestros usuarios se encriptan con AES-256 en Supabase Vault.

* **Data retention:** Posts procesados se retienen 90 dias en cache. Despues se eliminan automaticamente.

# **8\. Analisis de Costos de Data Sourcing**

## **8.1 Costo por Usuario por Mes**

| Concepto | Starter | Growth | Enterprise |
| :---- | :---- | :---- | :---- |
| Reddit API | $0 (gratuita) | $0 (gratuita) | $0 (gratuita) |
| Apify (complemento) | $1-2 | $3-6 | $8-15 |
| OpenAI (clasificacion) | $0.02-0.05 | $0.10-0.25 | $0.30-0.80 |
| Redis cache (Upstash) | $0.05 | $0.10 | $0.20 |
| TOTAL scraping/mes | $1-2 | $3-6 | $8-16 |

**Nota:** Estos costos son SOLO de data sourcing. Los costos de Reply Generator (GPT-4o) y Content Lab son adicionales y estan detallados en el documento de arquitectura principal.

## **8.2 Efecto del Cache en Costos**

Con 100 usuarios activos en subreddits populares (r/saas, r/startups, r/entrepreneur):

* **Sin cache:** \~150,000 posts analizados/mes. Costo OpenAI: \~$6.75.

* **Con cache:** \~45,000 posts analizados/mes (70% hit rate). Costo OpenAI: \~$2.00.

* **Ahorro:** \~70% en costos de IA. El cache se paga solo desde el primer mes.

# **9\. Resumen Ejecutivo**

| Decision | Recomendacion |
| :---- | :---- |
| Fuente primaria | Reddit API Oficial (OAuth2, gratuita, legal) |
| Fuente secundaria | Apify Reddit Scraper (para full-text search y Discovery Mode) |
| Fuente historica | Arctic Shift / PullPush (para seed data y Evergreen) |
| Clasificacion IA | GPT-4o-mini (primario) \+ Claude Haiku (fallback) |
| Cache | Upstash Redis (global, cross-user, TTL 7 dias) |
| Orquestacion | Inngest (event-driven, retries, cron jobs) |
| Escalado | Tokens OAuth por usuario \+ cache global \= budget ilimitado |
| Riesgo principal | Reddit cambia API/ToS. Mitigacion: doble fuente \+ cache. |
| Costo de scraping/usuario | $1-16/mes segun tier (margenes saludables en todos los tiers) |

La estrategia de 3 capas con cache global garantiza que ReddProwl pueda operar de forma legal, eficiente y escalable. El costo de data sourcing es menor al 10% del precio de cada tier, dejando margenes de 80%+ para cubrir IA de generacion de respuestas, infraestructura y profit.

*Fin del Documento \- ReddProwl Data Sourcing Strategy*