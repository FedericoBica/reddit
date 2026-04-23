# ReddProwl Outbound — Chrome Extension Design Plan

## 1. Visión y diferenciación

RedReach es standalone: el usuario busca posts manualmente, arma campañas a mano, sin contexto del negocio. Nuestro enfoque es radicalmente distinto: **la extensión es el brazo ejecutor de datos que ya tenemos**.

- Los leads ya están clasificados (intent score 1-100)
- Las menciones de marca ya están rastreadas
- La IA ya generó borradores de respuesta
- El CRM ya existe

La extensión Chrome completa el ciclo: descubrimiento → scoring → **contacto directo** → tracking de respuesta. Todo en un solo producto.

**Ventaja de integración sobre RedReach:**

| Capacidad | RedReach | ReddProwl Outbound |
|-----------|----------|--------------------|
| Campañas por thread | Sí | Sí |
| Campañas por subreddit | Sí | Sí |
| Campañas desde lead inbox | No | Sí (único diferencial) |
| Campañas desde menciones de marca | No | Sí |
| Mensaje personalizado con contexto del post | No | Sí (IA usa el post completo) |
| CRM integrado con intent score | No | Sí |
| Priorización por score de compra | No | Sí |

---

## 2. Cómo funciona técnicamente (mecanismo central)

### Por qué extensión y no API oficial

La API oficial de Reddit para DMs requiere OAuth del usuario + aprobación de app por Reddit. Tiene rate limits duros y Reddit puede revocar el acceso.

La extensión **usa la sesión de Reddit que ya tiene abierta el usuario** — exactamente como el usuario usaría el sitio manualmente. No hay credenciales extra, no hay OAuth de Reddit, no hay aprobación externa.

### El flujo de envío de DMs

Reddit expone una URL estable para componer PMs:
```
https://www.reddit.com/message/compose?to=USERNAME&subject=SUBJECT&message=BODY
```

El content script:
1. Navega a esa URL con los datos del destinatario
2. Espera que el formulario cargue
3. Verifica que el campo de mensaje tenga el texto correcto
4. Simula click en Submit
5. Detecta la respuesta: éxito, error de cuenta suspendida, ya contactado, rate limit

Este es el mismo enfoque que usa RedReach. No llama APIs internas de Reddit directamente — emula comportamiento humano a nivel DOM.

### Limitación crítica de Manifest V3

Los service workers de MV3 **no persisten en background** — se duermen si el tab no está activo. Por eso RedReach pide mantener el tab abierto. Nosotros también tenemos esta limitación. La campaña vive mientras el tab activo exista.

---

## 3. Arquitectura del sistema

### 3.1 Componentes

```
┌─────────────────────────────────────────────────────┐
│                Chrome Extension                      │
│                                                     │
│  Side Panel UI (React + Vite)                       │
│    → Campaign list / status                         │
│    → Active campaign progress bar                   │
│    → Quick stats (DMs hoy, response rate)           │
│    → Settings (delays, daily limit, ignore list)    │
│                                                     │
│  Background Service Worker                          │
│    → Campaign queue                                 │
│    → Delay scheduler (Alarm API)                    │
│    → ReddProwl API sync                             │
│    → Daily limit counter                            │
│                                                     │
│  Content Script (inyectado en reddit.com)           │
│    → Navega a compose URL                           │
│    → Detecta éxito/error de envío                   │
│    → Scraping de comentadores (thread campaigns)    │
│    → Detección de respuestas en inbox               │
└─────────────────┬───────────────────────────────────┘
                  │  REST API (JWT token del usuario)
┌─────────────────▼───────────────────────────────────┐
│              ReddProwl Backend (Next.js)             │
│                                                     │
│  /api/ext/leads         → leads para DM outreach    │
│  /api/ext/mentions      → menciones para campañas   │
│  /api/ext/campaigns     → CRUD de campañas          │
│  /api/ext/dm-log        → registrar DM enviado      │
│  /api/ext/dm-response   → registrar respuesta       │
│  /api/ext/token         → one-time connect token    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Supabase (PostgreSQL)                   │
│                                                     │
│  dm_campaigns     → campañas con config             │
│  dm_queue         → usuarios a contactar + estado   │
│  dm_log           → historial de DMs enviados       │
│  leads            → updated: dm_status column       │
│  brand_mentions   → updated: dm_status column       │
└─────────────────────────────────────────────────────┘
```

### 3.2 Stack de la extensión

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| UI del panel | React + Vite | Mismo stack que el dashboard, componentes compartibles |
| Estilos | Tailwind CSS | Consistencia visual con el resto |
| Estado | Zustand | Liviano, funciona en extension context |
| Build | Vite + vite-plugin-crx | Build óptimo para MV3 |
| Comunicación | chrome.runtime.sendMessage | Entre content script y SW |
| Persistencia local | chrome.storage.local | Queue, config, daily counter |
| Auth con backend | JWT guardado en chrome.storage.sync | Sincronizado entre dispositivos |

---

## 4. Tipos de campaña

### 4.1 Lead Campaign (diferencial clave)

Origen de datos: lead inbox de ReddProwl, filtrado por intent score mínimo.

```
Selección: leads con intent_score >= 70, status = "new", sin DM previo
Orden: por intent_score DESC (primero los más calientes)
Mensaje: IA lo genera con el título + body del post como contexto
```

El usuario puede configurar un threshold de intent score. Leads debajo del umbral se saltan.

### 4.2 Mention Campaign

Origen de datos: brand_mentions de ReddProwl.

```
Opciones:
  - Menciones propias (sentiment = "negative" → soporte)
  - Menciones de competidores (poaching: mostrar alternativa)
  - Filtrar por sentiment: positive / negative / neutral
```

### 4.3 Thread Campaign (como RedReach)

El usuario pega la URL de un post. La extensión extrae todos los comentaristas (scraping DOM o API pública de Reddit) y los agrega a la queue.

Opciones:
- Solo comentarios de primer nivel (recomendado)
- Saltar al autor del post
- Saltar ya contactados

### 4.4 Subreddit Campaign

La extensión busca posts recientes en un subreddit y extrae usuarios activos. Más amplio, menos preciso.

---

## 5. Motor de Spintax

Formato estándar: `{opción1|opción2|opción3}`, soporta anidamiento.

```
{Hey|Hi|Hola}, vi que {comentaste|escribiste} sobre {problemas con SEO|dificultades 
con backlinks}. {Hice|Construí|Lancé} una herramienta que puede ayudarte. 
¿Querés que te cuente?
```

La IA de ReddProwl puede **generar automáticamente 3-5 variaciones** del mensaje base usando el contexto del post. El usuario puede editarlas antes de lanzar la campaña.

---

## 6. Sistema de seguridad y anti-ban

### Límites configurables

| Parámetro | Default | Rango |
|-----------|---------|-------|
| DMs por día por cuenta | 25 | 5-100 |
| Delay entre mensajes | 4-8s random | 2-30s |
| DMs por run (pausa manual) | 10 | 1-50 |

### Checks automáticos

- **Cuenta nueva**: si la cuenta de Reddit tiene < 30 días → warning, reducir límite a 5/día
- **Cuenta suspendida**: detectar 403 en compose URL → parar campaña
- **Rate limit de Reddit**: detectar "you are doing that too much" → esperar 10min
- **Usuario ya contactado**: verificar tabla `dm_log` antes de cada envío
- **Lista de ignorados**: usernames que nunca se contactan (competidores, bots)

### Variación de delays

No usar delay fijo. Usar distribución uniforme entre min y max configurado, con un 20% de probabilidad de pausa larga (2x el delay normal) para simular distracción humana.

---

## 7. Detección de respuestas

El content script puede inyectarse en `reddit.com/message/inbox` para detectar respuestas nuevas. 

Opciones:
1. **Polling activo**: cada N minutos, el SW revisa el inbox si hay tab de Reddit abierto
2. **Webhook de usuario**: Reddit no tiene webhooks → imposible sin backend propio
3. **Manual sync**: botón "Sync responses" en el panel

Recomendación: polling cada 5 minutos mientras hay una campaña activa. Detecta mensajes cuyo `from` esté en la `dm_log` → marca como "responded" en ReddProwl CRM.

---

## 8. Conexión extensión ↔ ReddProwl

### One-time connect flow

1. Usuario va al dashboard de ReddProwl → Settings → "Conectar extensión"
2. Backend genera un token de un solo uso (expira en 5 minutos)
3. Usuario hace click en botón "Conectar" → abre popup de la extensión con el token en la URL
4. Extensión intercambia el token por un JWT de larga duración
5. JWT guardado en `chrome.storage.sync` → disponible en todos los dispositivos

### API endpoints del backend

```
GET  /api/ext/status              → verifica JWT, retorna plan + límites
GET  /api/ext/leads               → leads disponibles para outreach
GET  /api/ext/mentions            → menciones disponibles para outreach
POST /api/ext/campaigns           → crear campaña
GET  /api/ext/campaigns/:id       → estado de campaña
PUT  /api/ext/campaigns/:id/pause → pausar
POST /api/ext/dm-log              → registrar DM enviado { campaign_id, username, message }
POST /api/ext/dm-response         → registrar respuesta detectada { username }
```

---

## 9. CRM integrado en el dashboard

### Nuevas columnas en tablas existentes

```sql
-- en tabla leads
dm_status: "none" | "queued" | "sent" | "responded" | "interested" | "closed"
dm_sent_at: timestamptz
dm_campaign_id: uuid (FK a dm_campaigns)

-- en tabla brand_mentions
dm_status: "none" | "queued" | "sent" | "responded"
```

### Vista CRM en ReddProwl

Pestaña "Outbound" en el sidebar:
- Listado de campañas (activas, pausadas, completadas)
- Por campaña: progress bar, DMs enviados, responses, response rate
- Vista de leads contactados con su último estado
- Filtrar por campaña, status, fecha

---

## 10. Modelo de distribución

### Chrome Web Store

Framing correcto para aprobación: "Reddit Community Outreach Manager — Reach relevant Reddit users based on your lead data".

No mencionar: "automated", "bot", "mass DM", "spam prevention".

Mencionar: "productivity", "community engagement", "reach relevant users", "manual campaigns".

RedReach pasó el review → es posible. Diferencial: nosotros tenemos una plataforma SaaS real detrás, no solo una extensión.

### Alternativa: self-hosted

Distribuir como `.crx` desde el dashboard de ReddProwl para usuarios en planes avanzados. Evita el review de Google, pero requiere que el usuario habilite "developer mode".

### Recomendación inicial

Empezar con distribución directa (self-hosted) para los primeros usuarios beta. Publicar en Chrome Web Store cuando el producto esté estable y tengamos casos de uso documentados para el review.

---

## 11. Monetización

La extensión no es un producto separado — es una feature de los planes de ReddProwl.

| Plan | DMs/mes incluidos | Campañas activas |
|------|-------------------|-----------------|
| Starter | No incluido | — |
| Pro | 500 DMs/mes | 3 campañas |
| Agency | 2000 DMs/mes | Ilimitadas |

El límite de DMs se trackea en el backend. La extensión consulta `/api/ext/status` antes de cada envío.

---

## 12. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cuenta del usuario baneada por Reddit | Media | Alto | Límites conservadores, delays, warnings claros |
| Chrome Web Store rechaza la extensión | Media | Medio | Distribución self-hosted como fallback |
| Reddit cambia el DOM de compose | Alta (eventual) | Medio | Abstracción del selector, updates frecuentes |
| Reddit detecta el patrón de navegación | Baja | Alto | Randomización de delays, no usar API interna |
| Usuarios abusan y dañan la reputación del producto | Baja | Alto | Límites duros por plan, ToS propio que prohíbe spam |

---

## 13. Plan de desarrollo por etapas

### Fase 1 — MVP extensión (4-6 semanas)

- [ ] Setup: Vite + React + MV3 boilerplate
- [ ] Auth: one-time token flow, JWT en chrome.storage
- [ ] UI del side panel: básico, solo stats y campañas activas
- [ ] Thread Campaign: pegar URL → extraer comentaristas → queue → enviar
- [ ] Motor de Spintax: parser básico
- [ ] Sistema de delays y límite diario
- [ ] Backend: tablas dm_campaigns, dm_queue, dm_log + API endpoints básicos
- [ ] DM logging: registrar cada envío en ReddProwl

### Fase 2 — Integración profunda (3-4 semanas)

- [ ] Lead Campaign: conectar con lead inbox + filtro por intent score
- [ ] Mention Campaign: conectar con brand mentions pipeline
- [ ] Generación de mensajes con IA (usar contexto del post)
- [ ] Detección de respuestas: polling de inbox
- [ ] CRM view en dashboard: pestaña Outbound
- [ ] Límites por plan: enforcement en backend

### Fase 3 — Pulido y escala (2-3 semanas)

- [ ] Subreddit Campaign
- [ ] Warning de riesgo de cuenta (edad + karma check)
- [ ] A/B testing de mensajes (2 variantes, reportar cuál convierte más)
- [ ] Chrome Web Store submission
- [ ] Analytics: funnel DM enviado → respuesta → deal

---

## 14. Preguntas abiertas antes de implementar

1. **¿Extensión en repositorio separado o monorepo?** Recomendación: package `extension/` dentro del mismo repo. Comparte tipos TypeScript y componentes con el dashboard.

2. **¿Usar reddit.com/message/compose (PMs clásicos) o Reddit Chat?** Los PMs tienen URL estable y flujo predecible. Reddit Chat es React puro, DOM inestable. Empezar con PMs.

3. **¿Límite de DMs es por cuenta de Reddit o por usuario de ReddProwl?** Por usuario de ReddProwl (más simple de trackear). El usuario puede tener múltiples cuentas de Reddit — elegir cuál usar al conectar.

4. **¿Precio del tier con extensión?** Definir si es add-on separado o parte de Pro+.

5. **¿ToS propio?** Agregar cláusula explícita en ToS de ReddProwl que prohíbe usar la extensión para spam y transfiere responsabilidad de bans de Reddit al usuario.

6. **¿Cuántos tabs simultáneos puede manejar una campaña?** Un solo tab activo es lo más seguro. Múltiples tabs paralelos aceleran el envío pero aumentan el riesgo de detección.

7. **¿Detección de respuestas activa o manual?** El polling activo (cada 5 min en el inbox) consume recursos y requiere que el tab de Reddit esté abierto. Un botón "Sync" manual es más conservador para el MVP.

8. **¿La extensión maneja múltiples cuentas de Reddit del mismo usuario?** Si el usuario tiene cuenta principal + cuenta de testeo, ¿puede cambiar cuál usa por campaña? Complejidad no trivial.

9. **¿Qué pasa con los DMs que fallan (cuenta suspendida, usuario bloqueó DMs)?** Definir si se reintentan, se descartan, o se marcan para revisión manual en el CRM.

10. **¿La generación de mensajes con IA es automática o a pedido?** Auto-generar al crear la campaña (más cómodo) vs. el usuario escribe y la IA sugiere variantes (más control).

11. **¿Firefox también?** Firefox soporta Manifest V3 con limitaciones. WebExtensions API es compatible en su mayoría. Si hay demanda, se puede portar con poco trabajo extra.

12. **¿Cómo se maneja el warming de cuenta nueva?** Si el usuario conecta una cuenta de Reddit de 3 días, ¿bloqueamos el uso, reducimos el límite automáticamente, o solo avisamos?

13. **¿Los mensajes se guardan localmente o solo en el backend?** Por privacidad, el texto del DM debería no viajar al servidor si el usuario no lo quiere. Opción: guardar solo metadata (username, timestamp, campaign_id), no el cuerpo del mensaje.

14. **¿Cuál es el criterio de "campaign completada" en Thread Campaigns?** ¿Cuando se procesaron todos los comentaristas del post? ¿Qué pasa si el post sigue recibiendo comentarios nuevos?
