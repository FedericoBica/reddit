

**REDDIT LEAD RADAR**

User Stories

84 historias de usuario — Organizadas por módulo

**Resumen por Prioridad**

| Prioridad | Cantidad |
| ----- | :---: |
| **Must Have** | 23 |
| **Should Have** | 18 |
| **Could Have** | 7 |
| **TOTAL** | **48** |

# **Auth**

*2 user stories*

| US-001 | Registro con OAuth Social |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | registrarme con mi cuenta de Google o GitHub en un click |
| **Para** | empezar a usar la plataforma sin fricción ni crear otra contraseña |
| **Criterios** | AC1: Botones de Google y GitHub visibles en la pantalla de registro. AC2: Al autenticar, se crea el usuario en Supabase y se redirige al onboarding. AC3: Si el email ya existe con otro provider, se muestra error claro. AC4: Funciona correctamente en mobile y desktop. |
| **Prioridad** | **Must Have** |
| **Módulo** | Auth |
| **Estimación** | 3 puntos |

| US-002 | Registro con Magic Link |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | registrarme ingresando solo mi email y recibiendo un link de acceso |
| **Para** | acceder sin depender de cuentas de Google o GitHub |
| **Criterios** | AC1: Campo de email con botón 'Enviar Magic Link'. AC2: Email llega en menos de 30 segundos con link válido por 15 minutos. AC3: Al hacer click en el link, se autentica y redirige al onboarding. AC4: Link expirado muestra mensaje claro con opción de reenvío. |
| **Prioridad** | **Must Have** |
| **Módulo** | Auth |
| **Estimación** | 2 puntos |

# **Onboarding**

*6 user stories*

| US-003 | Onboarding Paso 1 — Mi Producto |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | ingresar la URL de mi sitio web para que el sistema extraiga automáticamente mi propuesta de valor, features y tono de voz |
| **Para** | no tener que describir mi producto manualmente y que la IA entienda qué vendo |
| **Criterios** | AC1: Input de URL con botón 'Analizar'. Loading state visible. AC2: En menos de 30s se muestran: propuesta de valor, features detectadas, tono. AC3: Cada campo es editable por el usuario antes de confirmar. AC4: Si no tiene web, formulario alternativo con 3 campos manuales. AC5: Botón 'Siguiente' habilitado solo cuando hay datos completos. |
| **Prioridad** | **Must Have** |
| **Módulo** | Onboarding |
| **Estimación** | 5 puntos |

| US-004 | Onboarding Paso 2 — Mi Mercado |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | seleccionar mi país específico (Argentina, Uruguay, México, Colombia, España, USA, etc.), ciudad/estado opcional, e idioma |
| **Para** | que el sistema active los filtros específicos de mi país (subreddits, jerga, instituciones) y configure el tono de las respuestas (voseo/tú/usted) |
| **Criterios** | AC1: Selector de país con lista completa (Argentina, Uruguay, México, Colombia, Chile, España, Brasil, USA, Global). Campo opcional de ciudad/estado. AC2: Selector de idioma primario y secundario. AC3: Al seleccionar un país (ej: Uruguay), se precarga automáticamente: subreddits locales (r/uruguay, r/Burises), keywords de jerga (BPS, DGI, ANTEL) y configuración de tono (voseo). AC4: Preview del estilo de escritura según la configuración elegida. |
| **Prioridad** | **Must Have** |
| **Módulo** | Onboarding |
| **Estimación** | 3 puntos |

| US-005 | Onboarding Paso 3 — Competidores |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | ingresar las URLs de hasta 3 competidores para que el sistema los analice |
| **Para** | que la IA detecte sus puntos débiles y genere keywords de competidores automáticamente |
| **Criterios** | AC1: Inputs para 1-3 URLs de competidores (según tier). AC2: Análisis muestra: nombre, puntos débiles, keywords asociadas, subreddits donde los mencionan. AC3: Resultados editables antes de confirmar. AC4: Se puede saltar este paso y completarlo después. |
| **Prioridad** | **Must Have** |
| **Módulo** | Onboarding |
| **Estimación** | 5 puntos |

| US-006 | Onboarding Paso 4 — Mapa de Intención |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | ver el mapa de intención auto-generado con keywords y subreddits sugeridos por la IA |
| **Para** | tener una estrategia lista para empezar a encontrar leads sin ser experto en Reddit |
| **Criterios** | AC1: Se muestran 15-30 keywords agrupadas por tipo: informacional, comparativa, transaccional. AC2: Se muestran 10-20 subreddits recomendados con volumen estimado. AC3: El usuario puede aceptar, editar, agregar o eliminar items. AC4: Botón 'Empezar' que dispara el primer scan. |
| **Prioridad** | **Must Have** |
| **Módulo** | Onboarding |
| **Estimación** | 5 puntos |

| US-007 | Onboarding Paso 5 — Notificaciones |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | configurar cómo y cuándo quiero recibir alertas de nuevos leads |
| **Para** | no perderme oportunidades de alto valor sin tener que estar mirando el dashboard todo el día |
| **Criterios** | AC1: Checkboxes para canales: email, Slack (Growth+), Telegram (Growth+). AC2: Selector de frecuencia: instantánea, digest diario, digest semanal. AC3: Slider o input para umbral mínimo de intent score. AC4: Botón de test que envía una notificación de prueba. |
| **Prioridad** | **Should Have** |
| **Módulo** | Onboarding |
| **Estimación** | 3 puntos |

| US-008 | Onboarding Progresivo |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | poder empezar a ver leads desde el Paso 1 sin completar todo el onboarding |
| **Para** | experimentar valor inmediato y completar la configuración a mi ritmo |
| **Criterios** | AC1: Dashboard muestra checklist de setup con % completado. AC2: Leads empiezan a aparecer después del Paso 1 con keywords básicas. AC3: Banner persistente invitando a completar los pasos restantes. AC4: Cada paso no completado tiene un indicador visual en el sidebar. |
| **Prioridad** | **Should Have** |
| **Módulo** | Onboarding |
| **Estimación** | 3 puntos |

# **Searchbox**

*9 user stories*

| US-009 | Ver Listado de Leads en Searchbox |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver todos mis leads en una vista de dos columnas con título, subreddit, link y relevance score |
| **Para** | escanear rápidamente las oportunidades y decidir cuáles atender primero |
| **Criterios** | AC1: Columna izquierda: lista scrolleable con título, subreddit, score (badge color), fecha. AC2: Columna derecha: vacía hasta seleccionar un post. AC3: Badge de color según score: rojo (\>80), naranja (60-80), gris (\<60). AC4: Indicador visual si el post es 'Fresh' (\< 2hs). AC5: Lazy loading o paginación cuando hay más de 50 leads. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 5 puntos |

| US-010 | Ver Detalle de un Lead |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | al hacer click en un lead, ver el post completo, comentarios desplegables e interacciones en la columna derecha |
| **Para** | entender el contexto completo antes de decidir si responder |
| **Criterios** | AC1: Se muestra título, body completo, autor, subreddit, fecha, upvotes. AC2: Comentarios desplegables con niveles de anidación. AC3: Intent score detallado con explicación de la IA (por qué ese puntaje). AC4: Debajo del post: área de 'Write a comment' con el Reply Generator. AC5: El lead pasa automáticamente a estado 'Reviewing' al abrirlo. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 5 puntos |

| US-011 | Filtrar Leads por Categoría |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | filtrar leads usando tabs: All, High Intent, My Keywords, Competitor Keywords, Unanswered, Trending |
| **Para** | enfocarme en las oportunidades más relevantes según mi estrategia actual |
| **Criterios** | AC1: Tabs visibles arriba del listado con contador de items en cada uno. AC2: 'High Intent': solo leads con score \> 70\. AC3: 'Unanswered': posts sin comentarios (alta oportunidad). AC4: 'Trending': posts con crecimiento rápido de upvotes en últimas 4hs. AC5: Filtros combinables con sort by relevance/recent. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 3 puntos |

| US-012 | Ordenar Leads por Relevancia o Fecha |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | cambiar el orden del listado entre relevancia (score IA) y más recientes |
| **Para** | priorizar según mi necesidad: los mejores leads o los más frescos |
| **Criterios** | AC1: Dropdown o toggle 'Sort by: Relevance | Recent'. AC2: Relevance ordena por intent\_score descendente. AC3: Recent ordena por fecha de creación del post descendente. AC4: El orden se persiste en la sesión del usuario. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 1 punto |

| US-013 | Generar Respuesta con IA (Reply Generator) |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | generar una respuesta asistida por IA eligiendo entre 3 tonos: Engaging, Direct o Balanced |
| **Para** | responder rápidamente con un mensaje que suene humano y esté adaptado al contexto del post |
| **Criterios** | AC1: 3 tabs de tono: Engaging (comunidad), Direct (pitch), Balanced (valor \+ mención). AC2: La respuesta se genera en menos de 5 segundos con loading state. AC3: La respuesta es editable en un textarea antes de copiar. AC4: Botón 'Regenerar' para obtener una versión diferente. AC5: La respuesta tiene en cuenta los comentarios existentes (context-aware). AC6: Se descuenta 1 del límite de AI replies del tier. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 8 puntos |

| US-014 | Respuesta con Tono Custom |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | definir mi propio template/tono de respuesta que la IA use como base |
| **Para** | mantener consistencia con la voz de mi marca sin tener que editar cada reply |
| **Criterios** | AC1: Tab adicional 'Custom' en el Reply Generator. AC2: Settings donde puedo escribir instrucciones de tono y un ejemplo de respuesta ideal. AC3: La IA usa mi template como base y lo adapta al contexto de cada post. AC4: Puedo tener hasta 3 templates custom guardados. |
| **Prioridad** | **Should Have** |
| **Módulo** | Searchbox |
| **Estimación** | 3 puntos |

| US-015 | Copy & Open (Acción Rápida) |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | presionar un botón que copie la respuesta al clipboard, abra el post de Reddit en nueva pestaña y marque el lead como REPLIED |
| **Para** | ejecutar la respuesta en un solo click sin pasos manuales |
| **Criterios** | AC1: Botón 'Copy & Open' prominente debajo del reply generado. AC2: Al presionar: (1) copia al clipboard, (2) abre reddit.com/post en nueva tab, (3) cambia status a Replied. AC3: Toast de confirmación: 'Copied\! Opening Reddit...' AC4: El lead desaparece del inbox y pasa al pipeline como Replied. AC5: Se registra el estilo de reply usado para A/B tracking. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 3 puntos |

| US-016 | Marcar Lead como Irrelevante |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | descartar un lead como irrelevante con un click |
| **Para** | limpiar mi inbox rápido y mantener la filosofía Inbox Zero |
| **Criterios** | AC1: Botón/icono de 'Irrelevante' (X o thumbs down) en cada lead card. AC2: El lead desaparece del listado inmediatamente (optimistic UI). AC3: Se guarda con status 'Irrelevant' en el pipeline. AC4: Opción de 'Undo' por 5 segundos después de descartar. |
| **Prioridad** | **Must Have** |
| **Módulo** | Searchbox |
| **Estimación** | 2 puntos |

| US-017 | Snooze de Lead |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | posponer un lead por X horas para que reaparezca después en mi inbox |
| **Para** | no perder leads interesantes que todavía no están listos para responder |
| **Criterios** | AC1: Botón 'Snooze' con opciones: 4hs, 12hs, 24hs, 3 días. AC2: El lead desaparece del inbox y reaparece automáticamente al vencer el snooze. AC3: Indicador visual de leads snoozed en algún lugar accesible. AC4: Se puede cancelar el snooze manualmente. |
| **Prioridad** | **Should Have** |
| **Módulo** | Searchbox |
| **Estimación** | 3 puntos |

# **New Opportunities**

*2 user stories*

| US-018 | Feed de New Opportunities |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver un feed en tiempo real de posts muy recientes (\< 2hs) que matchean mis keywords |
| **Para** | ser el primero en responder a oportunidades frescas antes que la competencia |
| **Criterios** | AC1: Feed tipo timeline con auto-refresh cada 60 segundos. AC2: Cada post muestra título, subreddit, tiempo relativo ('hace 15 min'), badge 'Fresh'. AC3: Click en un post lo abre en el Searchbox con el detalle completo. AC4: Los posts no tienen scoring profundo, solo keyword match básico. |
| **Prioridad** | **Must Have** |
| **Módulo** | New Opportunities |
| **Estimación** | 3 puntos |

| US-019 | Push Notification para Opportunities de Alto Intent |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | recibir una push notification cuando aparece una opportunity con intent score \> 80 |
| **Para** | reaccionar en tiempo real a los leads más valiosos sin estar mirando el dashboard |
| **Criterios** | AC1: Configurable en Settings (on/off) con umbral ajustable. AC2: Notification incluye: título del post, subreddit, score. AC3: Click en la notification abre directamente el detalle del lead. AC4: Rate limit: máximo 10 push notifications por hora. |
| **Prioridad** | **Should Have** |
| **Módulo** | New Opportunities |
| **Estimación** | 3 puntos |

# **Pipeline**

*3 user stories*

| US-020 | Ver Pipeline de Leads |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver mis leads organizados por estado en un pipeline visual: New → Reviewing → Replied → Won → Lost |
| **Para** | tener visibilidad de todo mi funnel de conversión de Reddit y medir resultados |
| **Criterios** | AC1: Vista tipo Kanban con columnas por estado. AC2: Cada card muestra título, subreddit, score, fecha del último cambio. AC3: Contadores por columna. AC4: Se puede acceder desde el sidebar como sección separada del Searchbox. |
| **Prioridad** | **Must Have** |
| **Módulo** | Pipeline |
| **Estimación** | 5 puntos |

| US-021 | Marcar Lead como Won |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | marcar un lead respondido como 'Won' e ingresar el valor estimado de la venta |
| **Para** | trackear el ROI real de mi inversión en Reddit Lead Radar |
| **Criterios** | AC1: Botón 'Mark as Won' disponible en leads con status Replied. AC2: Modal con campo de valor estimado (USD) y nota opcional. AC3: El lead se mueve a la columna Won del pipeline. AC4: El valor se suma a las métricas de Analytics. |
| **Prioridad** | **Must Have** |
| **Módulo** | Pipeline |
| **Estimación** | 2 puntos |

| US-022 | Marcar Lead como Lost |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | marcar un lead respondido como 'Lost' con una razón |
| **Para** | entender por qué no convierten mis leads y mejorar mi estrategia |
| **Criterios** | AC1: Botón 'Mark as Lost' en leads con status Replied. AC2: Selector de razón: No respuesta, Eligió competidor, No era lead real, Otro. AC3: Campo de nota opcional. AC4: Los datos alimentan el análisis de Insights. |
| **Prioridad** | **Should Have** |
| **Módulo** | Pipeline |
| **Estimación** | 2 puntos |

# **Mentions**

*3 user stories*

| US-023 | Brand Monitoring |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver todas las menciones de mi marca o URL en Reddit en tiempo real |
| **Para** | estar al tanto de lo que dicen sobre mi producto y actuar rápido ante feedback |
| **Criterios** | AC1: Feed de menciones con título del post, contexto, subreddit, fecha. AC2: Sentiment badge automático: Positivo (verde), Negativo (rojo), Neutral (gris). AC3: Click abre el post completo con opción de generar respuesta. AC4: Alerta instantánea para menciones con sentimiento negativo. |
| **Prioridad** | **Must Have** |
| **Módulo** | Mentions |
| **Estimación** | 5 puntos |

| US-024 | Competitor Monitoring |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | trackear menciones de mis competidores configurados en Reddit |
| **Para** | detectar oportunidades donde la gente se queja de un competidor y ofrecer mi alternativa |
| **Criterios** | AC1: Tab separado 'Competitor Mentions' dentro de Mentions. AC2: Cada mención muestra qué competidor fue mencionado y en qué contexto. AC3: Filtrable por competidor específico. AC4: Intent scoring también aplicado a menciones de competidores. |
| **Prioridad** | **Must Have** |
| **Módulo** | Mentions |
| **Estimación** | 3 puntos |

| US-025 | Alerta de Sentimiento Negativo |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | recibir una notificación instantánea cuando alguien habla negativamente de mi producto en Reddit |
| **Para** | hacer damage control rápido antes de que un post negativo escale |
| **Criterios** | AC1: Notificación inmediata por canal configurado (email/Slack/Telegram). AC2: El mensaje incluye: post, contexto negativo detectado, link directo. AC3: En el dashboard se marca con badge rojo de urgencia. |
| **Prioridad** | **Should Have** |
| **Módulo** | Mentions |
| **Estimación** | 3 puntos |

# **Analytics**

*4 user stories*

| US-026 | Dashboard de Analytics |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver un dashboard con métricas clave: total respondidos, leads won, top subreddits, conversion rate |
| **Para** | medir el ROI de mi tiempo invertido en Reddit y justificar la suscripción |
| **Criterios** | AC1: Cards con métricas principales: Total Leads, Replied, Won, Won Value, Conversion Rate. AC2: Gráfico de leads por semana (línea de tendencia). AC3: Top 5 subreddits por cantidad de leads calificados. AC4: Keyword Performance: cuáles traen leads de mayor calidad. AC5: Filtro de período: 7 días, 30 días, 90 días. |
| **Prioridad** | **Must Have** |
| **Módulo** | Analytics |
| **Estimación** | 5 puntos |

| US-027 | Reply Style A/B Performance |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver qué estilo de respuesta (Engaging/Direct/Balanced) genera más engagement y conversiones |
| **Para** | optimizar mi estrategia de respuesta basándome en datos reales |
| **Criterios** | AC1: Tabla comparativa con: replies enviados, engagement promedio, tasa de conversión por estilo. AC2: Recomendación de la IA: 'Tu mejor estilo es Balanced con 15% más conversión'. AC3: Datos disponibles después de mínimo 20 replies totales. |
| **Prioridad** | **Could Have** |
| **Módulo** | Analytics |
| **Estimación** | 3 puntos |

| US-028 | Conversion Funnel Visual |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver un funnel visual New → Replied → Won con tasas de conversión entre cada etapa |
| **Para** | identificar en qué etapa estoy perdiendo más leads y corregirlo |
| **Criterios** | AC1: Funnel chart con números absolutos y % de conversión entre etapas. AC2: Filtrable por período y por subreddit. AC3: Comparación mes vs mes anterior. |
| **Prioridad** | **Should Have** |
| **Módulo** | Analytics |
| **Estimación** | 3 puntos |

| US-029 | Best Time to Reply |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver en qué horarios mis respuestas reciben más upvotes y engagement |
| **Para** | programar mis sesiones de respuesta en los horarios más efectivos |
| **Criterios** | AC1: Heatmap de día de semana × hora del día con engagement promedio. AC2: Recomendación: 'Tus mejores horarios son Martes y Jueves 10-12 UTC'. AC3: Requiere mínimo 30 replies con tracking para mostrar datos significativos. |
| **Prioridad** | **Could Have** |
| **Módulo** | Analytics |
| **Estimación** | 3 puntos |

# **Content Lab**

*4 user stories*

| US-030 | Trend Spotting |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver qué preguntas se repiten más en mis subreddits objetivo y recibir sugerencias de contenido |
| **Para** | crear posts que respondan a demanda real y me posicionen como experto |
| **Criterios** | AC1: Lista de 'Trending Questions' por subreddit basada en datos de scraping. AC2: Cada trend muestra frecuencia, ejemplo de post, y sugerencia de la IA. AC3: Botón 'Create Draft' que lleva directo al editor con el tema pre-cargado. |
| **Prioridad** | **Should Have** |
| **Módulo** | Content Lab |
| **Estimación** | 5 puntos |

| US-031 | Generar Borrador de Post |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | generar un borrador de post para un subreddit eligiendo entre estilos: Case Study, Tutorial, Controversial Opinion |
| **Para** | publicar contenido de valor que posicione mi marca sin parecer spam |
| **Criterios** | AC1: Selector de subreddit y estilo de post. AC2: IA genera 3 opciones de título optimizado para upvotes. AC3: Borrador en Markdown con lenguaje 'human-like' (sin jerga de marketing). AC4: Si región es LATAM, usa voseo y modismos configurados. AC5: Sugerencia de dónde insertar link al website de forma orgánica. AC6: Se descuenta 1 del límite de SEO Posts del tier. |
| **Prioridad** | **Should Have** |
| **Módulo** | Content Lab |
| **Estimación** | 8 puntos |

| US-032 | Calendar View de Posts |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver en un calendario cuándo fue la última vez que posteé en cada subreddit |
| **Para** | evitar postear demasiado seguido en el mismo subreddit y ser marcado como spammer |
| **Criterios** | AC1: Vista de calendario mensual con indicadores por subreddit. AC2: Alerta si intento crear un borrador para un subreddit donde posteé hace menos de 7 días. AC3: Color coding: verde (seguro postear), amarillo (precaución), rojo (esperar). |
| **Prioridad** | **Could Have** |
| **Módulo** | Content Lab |
| **Estimación** | 3 puntos |

| US-033 | Subreddit Rules Checker |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | que antes de sugerir un post, la IA verifique las reglas del subreddit objetivo |
| **Para** | evitar que mi contenido sea removido por violar reglas que no conocía |
| **Criterios** | AC1: Antes de generar el borrador, se scrapean las rules del subreddit. AC2: Si hay conflictos (ej: 'no self-promotion'), se muestra warning con la regla específica. AC3: La IA adapta el borrador para cumplir con las reglas detectadas. |
| **Prioridad** | **Could Have** |
| **Módulo** | Content Lab |
| **Estimación** | 3 puntos |

# **Account Health**

*3 user stories*

| US-034 | Conectar Cuenta de Reddit |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | vincular mi cuenta de Reddit vía OAuth para que el sistema verifique mi karma y estado |
| **Para** | recibir recomendaciones personalizadas sobre cuándo y cómo responder sin arriesgar mi cuenta |
| **Criterios** | AC1: Botón 'Connect Reddit Account' en Settings. AC2: OAuth2 con scope: identity, read, history (NO write). AC3: Se muestra karma actual, antigüedad, y estado de la cuenta post-conexión. AC4: Opción de desconectar en cualquier momento. |
| **Prioridad** | **Should Have** |
| **Módulo** | Account Health |
| **Estimación** | 5 puntos |

| US-035 | Shadowban Checker |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | que el sistema verifique automáticamente si mi cuenta de Reddit está shadowbanneada |
| **Para** | saber si mis posts están siendo vistos o si Reddit me mandó al limbo sin avisarme |
| **Criterios** | AC1: Check automático cada 24hs consultando la página pública del perfil. AC2: Si detecta shadowban: alerta prominente en el dashboard. AC3: Recomendaciones de la IA para recuperar la cuenta. AC4: Historial de checks visible en Account Health. |
| **Prioridad** | **Should Have** |
| **Módulo** | Account Health |
| **Estimación** | 3 puntos |

| US-036 | Cooldown Timer y Posting Frequency Alert |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver un timer visual de cooldown entre respuestas y recibir alerta si estoy respondiendo demasiado rápido |
| **Para** | mantener un ritmo de actividad orgánico y evitar ser baneado por spam |
| **Criterios** | AC1: Timer visual en el Searchbox mostrando tiempo desde el último reply. AC2: Warning si respondo más de 5 posts en 1 hora. AC3: Recomendación: 'Esperá X minutos antes del próximo reply'. AC4: Configurable: el usuario puede ajustar los umbrales. |
| **Prioridad** | **Should Have** |
| **Módulo** | Account Health |
| **Estimación** | 2 puntos |

# **Settings**

*2 user stories*

| US-037 | Gestionar Keywords |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | agregar, editar, activar/desactivar y eliminar keywords desde Settings |
| **Para** | refinar mi estrategia de búsqueda a medida que aprendo qué funciona |
| **Criterios** | AC1: Lista de keywords con tipo (custom/ai\_suggested/competitor) y toggle active/inactive. AC2: Input para agregar nuevas keywords con validación de límite por tier. AC3: Sugerencias de la IA de keywords adicionales basadas en las existentes. AC4: Mensaje claro cuando se alcanza el límite del tier con CTA de upgrade. |
| **Prioridad** | **Must Have** |
| **Módulo** | Settings |
| **Estimación** | 3 puntos |

| US-038 | Gestionar Subreddits |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | agregar o quitar subreddits de mi lista de monitoreo |
| **Para** | enfocar el scraping en las comunidades más relevantes para mi negocio |
| **Criterios** | AC1: Lista de subreddits con volumen estimado y fecha del último scan. AC2: Input de búsqueda para agregar subreddits con autocompletado. AC3: Toggle para activar/desactivar sin eliminar. AC4: Badge si un subreddit es 'Regional' (detectado en onboarding). |
| **Prioridad** | **Must Have** |
| **Módulo** | Settings |
| **Estimación** | 3 puntos |

# **Billing**

*1 user stories*

| US-039 | Suscripción y Billing con LemonSqueezy |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | elegir un plan (Starter/Growth/Enterprise), pagar con tarjeta o PayPal, y gestionar mi suscripción |
| **Para** | acceder a las funcionalidades de mi tier y poder hacer upgrade/downgrade cuando quiera |
| **Criterios** | AC1: Página de pricing con los 3 tiers y feature comparison. AC2: Checkout de LemonSqueezy embebido o redirect (tarjeta, PayPal, Apple Pay). AC3: Webhooks procesan subscription\_created, subscription\_updated, subscription\_cancelled. AC4: El usuario puede gestionar su suscripción desde el portal de LemonSqueezy. AC5: Al exceder límites del tier, se muestra banner de upgrade (no se bloquea abruptamente). AC6: Free trial de 14 días del tier Growth sin tarjeta. |
| **Prioridad** | **Must Have** |
| **Módulo** | Billing |
| **Estimación** | 8 puntos |

# **Multi-Proyecto**

*1 user stories*

| US-040 | Crear y Cambiar entre Proyectos |
| :---- | :---- |
| **Como** | usuario con múltiples productos |
| **Quiero** | crear proyectos separados y switchear entre ellos desde la navbar |
| **Para** | gestionar leads de distintas marcas/productos sin mezclar datos |
| **Criterios** | AC1: Switcher de proyecto en la navbar (dropdown). AC2: Cada proyecto tiene su propio set de keywords, competidores, leads y config. AC3: Límite de proyectos según tier: Starter=1, Growth=3, Enterprise=ilimitados. AC4: Al switchear, todo el dashboard se actualiza al contexto del proyecto seleccionado. |
| **Prioridad** | **Should Have** |
| **Módulo** | Multi-Proyecto |
| **Estimación** | 5 puntos |

# **Integraciones**

*2 user stories*

| US-041 | Integración con Slack |
| :---- | :---- |
| **Como** | usuario Growth+ |
| **Quiero** | recibir notificaciones de leads nuevos en un canal de Slack |
| **Para** | que mi equipo vea las oportunidades donde ya trabaja, sin abrir otra herramienta |
| **Criterios** | AC1: OAuth con Slack para seleccionar workspace y canal. AC2: Mensaje formateado con título, subreddit, score y link al lead en la app. AC3: Configurable: qué eventos enviar (new lead, high intent, negative mention). AC4: Botón de test que envía un mensaje de prueba al canal. |
| **Prioridad** | **Could Have** |
| **Módulo** | Integraciones |
| **Estimación** | 5 puntos |

| US-042 | Webhooks Genéricos |
| :---- | :---- |
| **Como** | usuario Growth+ |
| **Quiero** | configurar URLs donde recibir webhooks cuando ocurren eventos (lead nuevo, replied, won) |
| **Para** | conectar Lead Radar con mi stack existente (CRM, automatizaciones, etc.) |
| **Criterios** | AC1: Input de URL con selector de eventos a enviar. AC2: Payload JSON documentado con firma HMAC para verificación. AC3: Log de webhooks enviados con status (success/failed) y retry automático. AC4: Botón de test webhook. |
| **Prioridad** | **Could Have** |
| **Módulo** | Integraciones |
| **Estimación** | 5 puntos |

# **Mobile UX**

*2 user stories*

| US-043 | Searchbox Mobile con Swipe Gestures |
| :---- | :---- |
| **Como** | usuario en mobile |
| **Quiero** | revisar leads con swipe: izquierda para descartar, derecha para abrir detalle |
| **Para** | limpiar mi inbox de leads rápidamente desde el celular mientras viajo |
| **Criterios** | AC1: Vista de una sola columna optimizada para mobile. AC2: Swipe left \= marcar como irrelevante con undo de 5 segundos. AC3: Swipe right \= abrir detalle del lead a pantalla completa. AC4: Bottom navigation con 5 tabs: Inbox, Mentions, Content, Analytics, Settings. AC5: Quick Reply: botones prominentes de Engaging/Direct/Balanced, un tap genera, otro copia. |
| **Prioridad** | **Should Have** |
| **Módulo** | Mobile UX |
| **Estimación** | 5 puntos |

| US-044 | Progressive Web App (PWA) |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | instalar la app como PWA en mi celular para recibir push notifications nativas |
| **Para** | tener acceso rápido desde el home screen y alertas sin depender del browser abierto |
| **Criterios** | AC1: Manifest.json y service worker configurados. AC2: Banner 'Instalar App' visible en mobile. AC3: Push notifications funcionan con la app cerrada. AC4: Offline: muestra último estado conocido con badge de 'Sin conexión'. |
| **Prioridad** | **Could Have** |
| **Módulo** | Mobile UX |
| **Estimación** | 5 puntos |

# **Founder Dashboard**

*4 user stories*

| US-045 | Monitor de Costos de API |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | ver cuánto estoy gastando en OpenAI y Apify por usuario y en total |
| **Para** | detectar usuarios que consumen más de lo que pagan y optimizar costos |
| **Criterios** | AC1: Dashboard con costo total del mes, desglosado por servicio (OpenAI, Apify). AC2: Tabla de top 10 usuarios por consumo con costo vs revenue. AC3: Alerta si un usuario excede el costo estimado de su tier. AC4: Gráfico de costo diario con tendencia. |
| **Prioridad** | **Must Have** |
| **Módulo** | Founder Dashboard |
| **Estimación** | 5 puntos |

| US-046 | Prompt Manager con Versioning |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | editar los system prompts de la IA desde un panel sin hacer deploy, con historial de versiones y rollback |
| **Para** | ajustar el comportamiento de la IA en producción sin depender de un ciclo de deploy |
| **Criterios** | AC1: Editor de texto para cada prompt (clasificación, reply, content lab). AC2: Al guardar se crea nueva versión con diff visual vs anterior. AC3: Botón de rollback a cualquier versión anterior. AC4: Opción de A/B test: servir versión A al 50% y versión B al otro 50%. |
| **Prioridad** | **Should Have** |
| **Módulo** | Founder Dashboard |
| **Estimación** | 5 puntos |

| US-047 | Impersonation Tool |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | entrar al dashboard de cualquier usuario en modo lectura |
| **Para** | dar soporte técnico sin pedir contraseñas ni acceder a datos sensibles de manera insegura |
| **Criterios** | AC1: Buscador de usuarios por email en el Founder Dashboard. AC2: Botón 'View as User' que abre el dashboard del usuario en modo read-only. AC3: Banner prominente indicando 'Viewing as \[user@email.com\] — Read Only'. AC4: Log de cada impersonation con timestamp y admin que lo ejecutó. |
| **Prioridad** | **Should Have** |
| **Módulo** | Founder Dashboard |
| **Estimación** | 3 puntos |

| US-048 | Revenue Dashboard |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | ver MRR, churn rate, LTV y cantidad de usuarios activos en un dashboard consolidado |
| **Para** | tomar decisiones de negocio basándome en métricas reales sin herramientas externas |
| **Criterios** | AC1: Cards con MRR, MRR Growth, Churn Rate, LTV estimado, Active Users. AC2: Gráfico de MRR mensual con tendencia. AC3: Breakdown por tier: cuántos usuarios en Starter, Growth, Enterprise. AC4: Datos integrados desde webhooks de LemonSqueezy. |
| **Prioridad** | **Should Have** |
| **Módulo** | Founder Dashboard |
| **Estimación** | 5 puntos |

# **Modo Discovery**

*2 user stories*

| US-049 | Modo Discovery \- Preview de Leads durante Onboarding |
| :---- | :---- |
| **Como** | usuario nuevo |
| **Quiero** | ver leads reales apareciendo en tiempo real mientras completo el onboarding, sin esperar a terminar la configuracion |
| **Para** | validar que la herramienta funciona para mi producto en los primeros 60 segundos y motivarme a completar el setup |
| **Criterios** | AC1: Al ingresar URL en Paso 1, se dispara scan paralelo con keywords inferidas automaticamente. AC2: Panel lateral (desktop) o bottom sheet (mobile) muestra leads encontrados con animacion fade-in. AC3: Cada lead preview muestra: titulo, subreddit, score preliminar (bajo/medio/alto). AC4: Contador animado: 'Ya encontramos X oportunidades para tu producto'. AC5: Los leads del Discovery se migran al Searchbox real al completar onboarding. AC6: Si no se encuentran leads en 30s, se muestra mensaje: 'Seguimos buscando. Completa la configuracion para refinar la busqueda'. |
| **Prioridad** | **Must Have** |
| **Modulo** | Modo Discovery |
| **Estimacion** | 5 puntos |

| US-050 | Transicion Discovery a Searchbox |
| :---- | :---- |
| **Como** | usuario que completo el onboarding |
| **Quiero** | que los leads encontrados durante el Discovery aparezcan automaticamente en mi Searchbox con scoring completo |
| **Para** | no perder las oportunidades que el sistema ya encontro y empezar a trabajar inmediatamente |
| **Criterios** | AC1: Al completar el ultimo paso del onboarding, redireccion automatica al Searchbox. AC2: Los leads del Discovery aparecen ya procesados con intent score completo. AC3: Banner: 'Encontramos X leads durante tu setup. Los mas calientes estan arriba'. AC4: Si el scoring completo descarta algunos leads del Discovery, no se muestran (sin notificar). |
| **Prioridad** | **Must Have** |
| **Modulo** | Modo Discovery |
| **Estimacion** | 3 puntos |

# **Battlecards Dinamicas**

*3 user stories*

| US-051 | Ver Battlecard al Detectar Competidor en un Lead |
| :---- | :---- |
| **Como** | usuario revisando un lead en el Searchbox |
| **Quiero** | que cuando un lead mencione a un competidor, aparezca automaticamente una Battlecard con 3 puntos de ataque especificos |
| **Para** | personalizar mi respuesta con argumentos concretos contra ese competidor sin tener que recordarlos de memoria |
| **Criterios** | AC1: Deteccion automatica de nombre de competidor en titulo o body del post. AC2: Battlecard aparece en la columna derecha, encima del Reply Generator. AC3: Muestra 3 puntos: debilidad de producto, sentiment negativo de comunidad, diferenciador clave. AC4: Cada punto incluye evidencia (ej: '12 quejas en r/saas este mes sobre su pricing'). AC5: Si se detectan multiples competidores, tabs para switchear entre battlecards. |
| **Prioridad** | **Should Have** |
| **Modulo** | Battlecards |
| **Estimacion** | 5 puntos |

| US-052 | Battlecard Integrada en Reply Generator |
| :---- | :---- |
| **Como** | usuario generando una respuesta para un lead que menciona competidor |
| **Quiero** | que la respuesta generada por la IA incorpore automaticamente los puntos de ataque de la Battlecard segun el tono elegido |
| **Para** | que mi respuesta sea estrategicamente efectiva contra el competidor sin tener que editarla manualmente |
| **Criterios** | AC1: Tono 'Direct': usa los puntos de ataque de forma explicita en la respuesta. AC2: Tono 'Balanced': los menciona sutilmente como contexto. AC3: Tono 'Engaging': los usa como contexto interno sin mencion directa del competidor. AC4: La respuesta nunca ataca al competidor de forma agresiva (Reddit penaliza eso). |
| **Prioridad** | **Should Have** |
| **Modulo** | Battlecards |
| **Estimacion** | 3 puntos |

| US-053 | Editar y Actualizar Battlecards Manualmente |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | editar los puntos de ataque de una Battlecard o agregar puntos propios desde Settings |
| **Para** | complementar la inteligencia automatica con mi conocimiento directo del mercado |
| **Criterios** | AC1: En Settings \> Competidores, cada competidor tiene seccion 'Battlecard'. AC2: Los 3 puntos de ataque son editables con textarea. AC3: Boton 'Restaurar automatico' para volver a la version generada por IA. AC4: Historial de cambios visible con fecha y quien edito. |
| **Prioridad** | **Could Have** |
| **Modulo** | Battlecards |
| **Estimacion** | 2 puntos |

# **Perfil de Voz**

*3 user stories*

| US-054 | Configurar Perfil de Voz para Cuenta Reddit |
| :---- | :---- |
| **Como** | usuario con cuenta Reddit vinculada |
| **Quiero** | configurar el tono, vocabulario, frases prohibidas y firma para cada cuenta de Reddit |
| **Para** | que todas las respuestas generadas mantengan un estilo consistente y creible para esa cuenta |
| **Criterios** | AC1: En Account Health \> Cuenta vinculada, seccion 'Perfil de Voz'. AC2: Selector de tono base: Formal, Casual, Tecnico, Amigable. AC3: Opcion 'Auto-detectar': la IA analiza los ultimos 20 comments y sugiere el perfil. AC4: Campos editables: vocabulario frecuente, frases prohibidas, firma tipica. AC5: Preview: boton que genera una respuesta de ejemplo con el perfil configurado. |
| **Prioridad** | **Should Have** |
| **Modulo** | Perfil de Voz |
| **Estimacion** | 5 puntos |

| US-055 | Warning de Inconsistencia de Tono |
| :---- | :---- |
| **Como** | usuario respondiendo en multiples subreddits |
| **Quiero** | recibir un aviso si estoy respondiendo con estilos muy diferentes en el mismo subreddit desde la misma cuenta |
| **Para** | evitar que moderadores detecten inconsistencias que delaten actividad automatizada |
| **Criterios** | AC1: El sistema compara el tono de la respuesta actual con las ultimas 5 respuestas en ese subreddit. AC2: Si hay inconsistencia significativa, warning amarillo: 'El tono de esta respuesta difiere de tus anteriores en r/saas'. AC3: Opcion de ajustar la respuesta o ignorar el warning. AC4: En analytics, metrica de 'consistencia de voz' por cuenta. |
| **Prioridad** | **Could Have** |
| **Modulo** | Perfil de Voz |
| **Estimacion** | 3 puntos |

| US-056 | Auto-aprendizaje del Perfil de Voz |
| :---- | :---- |
| **Como** | usuario que edita frecuentemente las respuestas generadas |
| **Quiero** | que el sistema aprenda de mis ediciones y genere respuestas cada vez mas parecidas a como yo escribiria |
| **Para** | reducir el tiempo de edicion manual con cada respuesta |
| **Criterios** | AC1: El sistema registra diff entre respuesta generada y respuesta final (post-edicion). AC2: Despues de 10+ ediciones, el sistema muestra: 'Detectamos patrones en tus ediciones. Queres actualizar tu Perfil de Voz?'. AC3: Preview de los ajustes sugeridos antes de aplicar. AC4: Metrica en analytics: '% de edicion promedio' que deberia bajar con el tiempo. |
| **Prioridad** | **Could Have** |
| **Modulo** | Perfil de Voz |
| **Estimacion** | 5 puntos |

# **Ghostwriter (Thread Management)**

*5 user stories*

| US-057 | Monitoreo de Respuestas a mis Comentarios |
| :---- | :---- |
| **Como** | usuario que respondio a un lead |
| **Quiero** | que el sistema monitoree automaticamente si el lead me respondio y me notifique cuando pase |
| **Para** | no perder conversaciones activas donde el lead mostro interes |
| **Criterios** | AC1: Al marcar un lead como Replied, se activa monitoreo automatico del hilo. AC2: Inngest job hace polling cada 15-30 min buscando replies al comment del usuario. AC3: Notificacion por canal configurado: '\[username\] te respondio en r/saas'. AC4: El mensaje incluye preview del reply del lead y link directo al hilo. AC5: El monitoreo se desactiva automaticamente despues de 7 dias sin actividad. |
| **Prioridad** | **Must Have** |
| **Modulo** | Ghostwriter |
| **Estimacion** | 5 puntos |

| US-058 | Sugerencia de Siguiente Respuesta en Hilo |
| :---- | :---- |
| **Como** | usuario que recibio respuesta de un lead |
| **Quiero** | que la IA me sugiera la siguiente respuesta manteniendo el contexto completo del hilo y siguiendo el Conversation Playbook |
| **Para** | llevar la conversacion estrategicamente hacia el DM o mi sitio web sin perder el hilo |
| **Criterios** | AC1: Al abrir la notificacion, se muestra el hilo completo con la nueva respuesta del lead. AC2: La IA genera sugerencia de respuesta con contexto: post original \+ todo el hilo \+ Battlecard (si aplica) \+ Perfil de Voz. AC3: Indicador del paso actual del Playbook: 'Paso 2 de 4 \- Mencion sutil'. AC4: Boton 'Copy & Open' que funciona igual que en Searchbox. AC5: La IA detecta si el lead esta listo para escalar y lo sugiere explicitamente. |
| **Prioridad** | **Must Have** |
| **Modulo** | Ghostwriter |
| **Estimacion** | 8 puntos |

| US-059 | Configurar Conversation Playbook |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | definir mi estrategia de escalamiento en pasos (dar valor, mencion sutil, ofrecer demo, link directo) |
| **Para** | que la IA sepa hacia donde llevar cada conversacion en vez de improvisar |
| **Criterios** | AC1: En Settings, seccion 'Conversation Playbook' con editor de pasos. AC2: Cada paso tiene: nombre, instruccion para la IA, trigger de escalamiento. AC3: Playbook default pre-cargado (4 pasos estandar) editable. AC4: Se puede tener multiples Playbooks y asignar uno por proyecto. AC5: La IA no es rigida: si el lead pregunta por precio en paso 1, salta al paso 3\. |
| **Prioridad** | **Should Have** |
| **Modulo** | Ghostwriter |
| **Estimacion** | 5 puntos |

| US-060 | Thread Inbox \- Vista de Conversaciones Activas |
| :---- | :---- |
| **Como** | usuario con multiples hilos activos |
| **Quiero** | ver todas mis conversaciones activas en una vista dedicada, ordenadas por urgencia |
| **Para** | gestionar multiples hilos simultaneos sin perder ninguna oportunidad caliente |
| **Criterios** | AC1: Tab 'Threads' en el Searchbox o seccion separada en el sidebar. AC2: Lista de hilos con: resumen del post, ultimo mensaje del lead, paso del Playbook, tiempo desde ultima respuesta. AC3: Badge rojo si el lead respondio hace menos de 1 hora (urgente). AC4: Badge amarillo si respondio hace 1-6 horas. AC5: Filtros: Activos, Esperando mi respuesta, Escalados a DM, Cerrados. |
| **Prioridad** | **Must Have** |
| **Modulo** | Ghostwriter |
| **Estimacion** | 5 puntos |

| US-061 | Metricas de Conversion por Hilo |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver metricas de mis conversaciones: numero de intercambios promedio antes de convertir, tasa de escalamiento a DM, tiempo promedio de respuesta |
| **Para** | optimizar mi estrategia conversacional basandome en datos reales |
| **Criterios** | AC1: En Analytics, seccion 'Thread Performance'. AC2: Metricas: intercambios promedio, % que escala a DM, % que convierte, tiempo promedio de respuesta. AC3: Comparacion por Playbook si hay multiples configurados. AC4: Insight de la IA: 'Tus conversaciones que convierten tienen en promedio 3 intercambios'. AC5: Requiere minimo 10 hilos completados para mostrar datos significativos. |
| **Prioridad** | **Could Have** |
| **Modulo** | Ghostwriter |
| **Estimacion** | 3 puntos |

# **Account Protection Automatica**

*3 user stories*

| US-062 | Account Score Automatico al Conectar Cuenta Reddit |
| :---- | :---- |
| **Como** | usuario con cuenta Reddit vinculada de bajo karma |
| **Quiero** | que al vincular mi cuenta Reddit, el sistema calcule automaticamente un Account Score y active protecciones si mi cuenta es nueva o de bajo karma |
| **Para** | estar protegido automaticamente contra baneos sin tener que pensar en nada |
| **Criterios** | AC1: Al vincular cuenta Reddit via OAuth, se calcula Account Score (0-100) combinando karma, antiguedad e historial. AC2: Si score menor a 50, banner automatico: 'Tu cuenta esta en periodo de calentamiento' con barra de progreso. AC3: Los limites de replies/dia, cooldown y links se ajustan automaticamente segun el score. AC4: El score se recalcula cada 24hs. A medida que crece karma, los limites se relajan solos. |
| **Prioridad** | **Must Have** |
| **Modulo** | Account Protection |
| **Estimacion** | 3 puntos |

| US-063 | Warm-up Automatico para Cuentas en Calentamiento |
| :---- | :---- |
| **Como** | usuario con Account Score menor a 50 |
| **Quiero** | recibir sugerencias diarias de hilos de bajo riesgo donde puedo comentar para subir karma de forma organica |
| **Para** | construir karma y reputacion en mis subreddits objetivo sin riesgo de ban |
| **Criterios** | AC1: El sistema presenta 3-5 hilos diarios con sugerencia de comentario para cada uno. AC2: Los hilos son de bajo riesgo: preguntas abiertas, discusiones populares, AMAs. AC3: Los comentarios sugeridos son genuinamente utiles, basados en la expertise del usuario. AC4: Nunca incluyen links ni mencionan el producto. AC5: Boton 'Copy & Open' igual que en Searchbox. AC6: Si un comentario de warm-up recibe downvotes, el sistema ajusta las sugerencias. |
| **Prioridad** | **Must Have** |
| **Modulo** | Account Protection |
| **Estimacion** | 5 puntos |

| US-064 | Graduacion Automatica del Calentamiento |
| :---- | :---- |
| **Como** | usuario cuyo Account Score supero 50 |
| **Quiero** | que el sistema desactive automaticamente las restricciones y me notifique que mi cuenta esta lista |
| **Para** | empezar a responder leads con confianza de que mis comentarios seran visibles |
| **Criterios** | AC1: Cuando el karma alcanza el umbral, notificacion: 'Tu cuenta esta lista para r/saas\!'. AC2: El Searchbox se desbloquea completamente para ese subreddit. AC3: El Warm-up sigue disponible para subreddits donde aun falta karma. AC4: Badge de 'Cuenta verificada' en el Account Health dashboard. |
| **Prioridad** | **Should Have** |
| **Modulo** | Account Protection |
| **Estimacion** | 2 puntos |

# **Collision Detection**

*3 user stories*

| US-065 | Bloqueo de Hilo por Cuenta |
| :---- | :---- |
| **Como** | miembro de un equipo Enterprise |
| **Quiero** | que cuando abro un lead, se bloquee automaticamente para las otras cuentas del proyecto |
| **Para** | evitar que dos personas del equipo respondan al mismo hilo y parezcamos brigading |
| **Criterios** | AC1: Al abrir o generar reply para un lead, se crea lock en thread\_locks. AC2: Otros miembros ven badge: 'Tomado por \[nombre\] hace 2hs' en ese lead. AC3: El lead bloqueado no aparece como accionable para otros (puede verse pero no generar reply). AC4: Lock expira automaticamente en 48hs si no hay accion. AC5: Boton 'Liberar' para soltar el lock manualmente. |
| **Prioridad** | **Must Have** |
| **Modulo** | Collision Detection |
| **Estimacion** | 5 puntos |

| US-066 | Modo Refuerzo Controlado |
| :---- | :---- |
| **Como** | miembro de equipo Enterprise |
| **Quiero** | poder entrar a un hilo donde otro companero ya respondio, pero solo para dar un comentario de apoyo natural (no de venta) |
| **Para** | reforzar la presencia de la marca sin parecer brigading |
| **Criterios** | AC1: Solo disponible despues de 6+ horas del reply original. AC2: La IA genera solo comentarios de apoyo (ej: 'Puedo confirmar, uso X y funciona'). AC3: Maximo 1 refuerzo por hilo, nunca mas de 2 cuentas total. AC4: Si el subreddit es de alto riesgo, el refuerzo se bloquea con warning. AC5: Configurable: el admin puede desactivar refuerzo para todo el proyecto. |
| **Prioridad** | **Could Have** |
| **Modulo** | Collision Detection |
| **Estimacion** | 5 puntos |

| US-067 | Dashboard de Actividad de Equipo |
| :---- | :---- |
| **Como** | admin de equipo Enterprise |
| **Quiero** | ver que leads estan tomados por cada miembro, quien respondio que, y detectar potenciales colisiones |
| **Para** | coordinar al equipo sin necesidad de comunicacion manual sobre cada lead |
| **Criterios** | AC1: Vista de tabla con: lead, asignado a, status, tiempo desde lock. AC2: Alerta si dos cuentas del equipo postearon en el mismo subreddit en menos de 1 hora. AC3: Filtro por miembro del equipo. AC4: Metricas: leads por miembro, replies por miembro, conversion rate por miembro. |
| **Prioridad** | **Could Have** |
| **Modulo** | Collision Detection |
| **Estimacion** | 3 puntos |

# **Evergreen Monitoring**

*3 user stories*

| US-068 | Marcar Hilos como Evergreen |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | marcar hilos historicos de Reddit que rankean en Google para mis keywords como 'Evergreen' para monitoreo continuo |
| **Para** | capturar leads de alta intencion que comentan en hilos viejos que aparecen en Google |
| **Criterios** | AC1: Boton 'Mark as Evergreen' en cualquier lead o input manual de URL de Reddit. AC2: Limite segun tier: Starter=5, Growth=15, Enterprise=30. AC3: Vista de 'Evergreen Threads' en sidebar o dentro de Settings. AC4: Cada hilo muestra: titulo, keyword matcheada, Google rank (si detectado), ultimo comentario nuevo. AC5: Toggle para activar/desactivar monitoreo sin eliminar el hilo. |
| **Prioridad** | **Should Have** |
| **Modulo** | Evergreen Monitoring |
| **Estimacion** | 3 puntos |

| US-069 | Alertas de Nuevos Comentarios en Hilos Evergreen |
| :---- | :---- |
| **Como** | usuario con hilos evergreen configurados |
| **Quiero** | recibir notificacion cuando hay un comentario nuevo con intencion de compra en un hilo evergreen |
| **Para** | responder rapidamente a leads de alta calidad que buscan soluciones activamente via Google |
| **Criterios** | AC1: Job cada 4-12hs (segun tier) revisa nuevos comentarios en hilos evergreen. AC2: GPT-4o-mini analiza cada comentario: tiene intencion de compra? menciona competidor? AC3: Si califica, aparece en Searchbox con badge 'Evergreen' y notificacion al usuario. AC4: El Reply Generator recibe como contexto el hilo historico completo, no solo el comentario nuevo. |
| **Prioridad** | **Should Have** |
| **Modulo** | Evergreen Monitoring |
| **Estimacion** | 5 puntos |

| US-070 | Deteccion Automatica de Hilos Evergreen via Google SERP |
| :---- | :---- |
| **Como** | usuario Enterprise |
| **Quiero** | que el sistema detecte automaticamente que hilos de Reddit rankean en Google para mis keywords y sugiera monitorearlos |
| **Para** | descubrir oportunidades evergreen que no conocia sin tener que buscar manualmente |
| **Criterios** | AC1: Job semanal busca 'site:reddit.com \[keyword\]' en Google para cada keyword del proyecto. AC2: Si un hilo rankea en top 3, sugerencia: 'Este hilo rankea \#1 para \[keyword\]. Monitorear?'. AC3: Si un hilo deja de rankear, sugerencia de desactivar para ahorrar recursos. AC4: Solo disponible en tier Enterprise. |
| **Prioridad** | **Could Have** |
| **Modulo** | Evergreen Monitoring |
| **Estimacion** | 5 puntos |

# **Reply Analytics (Tracking Real)**

*2 user stories*

| US-071 | Tracking Automatico Post-Reply |
| :---- | :---- |
| **Como** | usuario que respondio a leads |
| **Quiero** | que el sistema verifique automaticamente el estado real de mis comentarios 24-48hs despues (upvotes, replies, si fue removido) |
| **Para** | saber si mis respuestas estan funcionando con datos reales, no asumidos |
| **Criterios** | AC1: Job automatico 24hs y 48hs post-reply verifica: upvotes, replies, removido, colapsado. AC2: En Analytics, nueva seccion 'Reply Performance' con metricas reales. AC3: Si un comentario fue removido, alerta: 'Tu comentario en r/saas fue removido. Ajusta el tono'. AC4: Si el OP respondio al comentario, badge especial 'OP Engaged' en el pipeline. AC5: Datos alimentan automaticamente el A/B testing de estilos de reply. |
| **Prioridad** | **Must Have** |
| **Modulo** | Reply Analytics |
| **Estimacion** | 5 puntos |

| US-072 | Feedback Loop en Reply Generator |
| :---- | :---- |
| **Como** | usuario generando una nueva respuesta |
| **Quiero** | ver datos historicos de performance del estilo elegido en ese subreddit especifico antes de generar |
| **Para** | elegir el estilo de reply con datos reales de que funciona en cada subreddit |
| **Criterios** | AC1: Al seleccionar un tono (Engaging/Direct/Balanced), mini-tooltip: 'En r/saas, Balanced tiene 2.3x mas upvotes promedio'. AC2: Si un estilo tiene tasa de remocion alta en ese subreddit, warning. AC3: Requiere minimo 10 replies trackeados en ese subreddit para mostrar datos. |
| **Prioridad** | **Should Have** |
| **Modulo** | Reply Analytics |
| **Estimacion** | 3 puntos |

# **Subreddit Relationship Score**

*2 user stories*

| US-073 | Ver Score de Dificultad y Receptividad por Subreddit |
| :---- | :---- |
| **Como** | usuario |
| **Quiero** | ver un score de dificultad y receptividad para cada subreddit en mi lista de monitoreo |
| **Para** | saber como comportarme en cada comunidad y donde priorizar mi esfuerzo |
| **Criterios** | AC1: En la lista de subreddits (Settings o Searchbox), cada subreddit muestra: Difficulty (1-10), Receptivity (1-10). AC2: Tooltip con detalle: karma minimo, link policy, nivel de moderacion, estrategia recomendada. AC3: Color coding: verde (facil), amarillo (moderado), rojo (hostil). AC4: Recomendacion de la IA: 'En r/saas usa tono Engaging sin links'. |
| **Prioridad** | **Should Have** |
| **Modulo** | Subreddit Score |
| **Estimacion** | 5 puntos |

| US-074 | Actualizacion Crowdsourced del Subreddit Score |
| :---- | :---- |
| **Como** | usuario de la plataforma |
| **Quiero** | que mi experiencia real en un subreddit (replies exitosos, removidos, engagement) contribuya a mejorar el score para todos los usuarios |
| **Para** | beneficiarme de la experiencia colectiva de todos los usuarios de la plataforma |
| **Criterios** | AC1: Datos de engagement y remocion de todos los usuarios alimentan el score (anonimizado). AC2: Score se recalcula semanalmente. AC3: Override manual: puedo marcar un subreddit como 'hostil' o 'friendly' desde mi experiencia. AC4: Los overrides manuales pesan menos que los datos automaticos para evitar manipulacion. |
| **Prioridad** | **Could Have** |
| **Modulo** | Subreddit Score |
| **Estimacion** | 3 puntos |

# **DM Automation Assistant**

*2 user stories*

| US-075 | Generar Primer DM Asistido por IA |
| :---- | :---- |
| **Como** | usuario cuyo lead fue escalado a DM desde el Ghostwriter |
| **Quiero** | que la IA me genere el primer mensaje de DM con referencia natural al hilo y propuesta personalizada |
| **Para** | no perder el momentum de la conversacion y maximizar la conversion en el DM |
| **Criterios** | AC1: Boton 'Generar DM' disponible cuando el Ghostwriter sugiere escalar. AC2: El DM incluye: referencia al hilo, propuesta personalizada segun lo que el lead pregunto, CTA claro. AC3: 3 templates: Warm intro, Soft follow-up, Value-first. AC4: Editable antes de copiar. AC5: 'Copy & Open Reddit DM' abre la pagina de mensaje directo del usuario en Reddit. |
| **Prioridad** | **Should Have** |
| **Modulo** | DM Assistant |
| **Estimacion** | 5 puntos |

| US-076 | Tracking de Respuesta a DMs |
| :---- | :---- |
| **Como** | usuario que envio un DM a un lead |
| **Quiero** | que el sistema detecte si el lead respondio al DM y me notifique con sugerencia de siguiente mensaje |
| **Para** | cerrar el funnel de conversion sin que leads calientes se enfrien por falta de seguimiento |
| **Criterios** | AC1: Con scope 'privatemessages' autorizado, el sistema hace polling de inbox cada 30min. AC2: Si el lead respondio, notificacion con preview y sugerencia de siguiente mensaje. AC3: Si no respondio en 48hs, sugerencia de follow-up sutil. AC4: Thread marcado como 'Convertido' cuando el usuario lo confirma. AC5: Opt-in explicito: el usuario debe autorizar el scope adicional de Reddit. |
| **Prioridad** | **Could Have** |
| **Modulo** | DM Assistant |
| **Estimacion** | 5 puntos |

# **Tutorial Interactivo**

*5 user stories*

| US-077 | Product Tour Interactivo (Primera Vez) |
| :---- | :---- |
| **Como** | usuario nuevo que entra al dashboard por primera vez |
| **Quiero** | ver un tour guiado paso a paso que me muestre cada seccion del dashboard con tooltips y overlay |
| **Para** | entender la herramienta en 2 minutos sin leer documentacion |
| **Criterios** | AC1: Tour se activa automaticamente al entrar al dashboard por primera vez post-onboarding. AC2: 7 pasos con tooltips: Searchbox, Lead Card, Reply Generator, Mentions, Analytics, Content Lab, Settings. AC3: Overlay oscuro que destaca solo la seccion actual con pulso sutil. AC4: Indicador de progreso: '3 de 7'. AC5: Boton 'Saltar tour' visible en todo momento. AC6: En mobile, tooltips se adaptan a bottom sheet. AC7: Implementado con React Joyride. |
| **Prioridad** | **Must Have** |
| **Modulo** | Tutorial |
| **Estimacion** | 5 puntos |

| US-078 | Getting Started Checklist (Primera Semana) |
| :---- | :---- |
| **Como** | usuario nuevo en su primera semana |
| **Quiero** | ver un checklist de tareas guiadas que me lleven a usar cada funcionalidad clave del producto por primera vez |
| **Para** | aprender haciendo y experimentar el valor real del producto de forma progresiva |
| **Criterios** | AC1: Panel persistente (colapsable) con 7 tareas en orden. AC2: Tareas: revisa un lead, genera respuesta, responde un lead, descarta irrelevante, revisa mentions, configura notificaciones, marca un Won. AC3: Cada tarea completada: check animado \+ micro-celebracion (confetti sutil). AC4: Barra de progreso: 'Setup completado: 57% (4 de 7)'. AC5: No bloquea ninguna funcionalidad. AC6: Celebracion final al completar las 7 tareas con sugerencia de next steps. AC7: Estado persistido en Supabase (onboarding\_checklist\_json). |
| **Prioridad** | **Must Have** |
| **Modulo** | Tutorial |
| **Estimacion** | 5 puntos |

| US-079 | Tooltips Contextuales por Seccion |
| :---- | :---- |
| **Como** | usuario que visita una seccion por primera vez |
| **Quiero** | ver un mini-tutorial especifico de esa seccion la primera vez que entro |
| **Para** | entender cada feature nueva sin tener que buscar ayuda |
| **Criterios** | AC1: La primera vez que visito Content Lab: tooltip explicando que hace y como empezar. AC2: La primera vez que llega una notificacion del Ghostwriter: tooltip explicando el flujo. AC3: La primera vez que aparece una Battlecard: tooltip explicando los puntos de ataque. AC4: Cada tooltip se muestra una sola vez por seccion (guardado en sections\_visited). AC5: Boton 'Got it' para cerrar, no se repite. |
| **Prioridad** | **Should Have** |
| **Modulo** | Tutorial |
| **Estimacion** | 3 puntos |

| US-080 | Repetir Tour desde Settings |
| :---- | :---- |
| **Como** | usuario que quiere refrescar el tour o se lo salteo |
| **Quiero** | acceder a un boton en Settings para repetir el Product Tour completo |
| **Para** | repasar las funcionalidades si me olvide o si saltee el tour la primera vez |
| **Criterios** | AC1: En Settings \> General, boton 'Repetir Product Tour'. AC2: Al presionar, se reinicia el tour desde el paso 1\. AC3: Tambien resetea los tooltips contextuales si el usuario lo desea (checkbox opcional). |
| **Prioridad** | **Could Have** |
| **Modulo** | Tutorial |
| **Estimacion** | 1 punto |

| US-081 | Tracking de Drop-off del Tutorial |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | ver en que paso del Product Tour y del checklist los usuarios abandonan |
| **Para** | optimizar el onboarding y reducir friccion donde mas usuarios se pierden |
| **Criterios** | AC1: Cada paso del tour envia evento a PostHog: tour\_step\_viewed, tour\_step\_completed, tour\_skipped. AC2: Cada tarea del checklist envia evento: checklist\_task\_completed. AC3: Dashboard en PostHog con funnel de completion del tour y checklist. AC4: A/B testing via feature flags: testear variantes del tour (5 vs 7 pasos, etc). |
| **Prioridad** | **Should Have** |
| **Modulo** | Tutorial |
| **Estimacion** | 3 puntos |

# **Mobile Nativo (Capacitor)**

*3 user stories*

| US-082 | Publicar App en App Store y Play Store via Capacitor |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | generar builds nativos (.ipa y .apk) de la web app con Capacitor y publicarlos en las stores |
| **Para** | tener presencia en App Store y Play Store para generar confianza y facilitar instalacion |
| **Criterios** | AC1: Proyecto Capacitor configurado con capacitor.config.ts apuntando al build de Next.js. AC2: Build iOS funcional: npx cap open ios, compilar en Xcode, subir a App Store Connect. AC3: Build Android funcional: npx cap open android, compilar en Android Studio, subir a Play Console. AC4: Splash screen y app icon configurados con branding de Reddit Lead Radar. AC5: Deep links configurados: notificaciones abren directamente el lead en la app. |
| **Prioridad** | **Should Have** |
| **Modulo** | Mobile (Capacitor) |
| **Estimacion** | 8 puntos |

| US-083 | Push Notifications Nativas via Capacitor |
| :---- | :---- |
| **Como** | usuario con la app instalada desde store |
| **Quiero** | recibir push notifications nativas (no de browser) cuando hay leads de alto valor o respuestas del Ghostwriter |
| **Para** | nunca perderme un lead caliente, incluso con la app cerrada |
| **Criterios** | AC1: @capacitor/push-notifications integrado con Firebase (Android) y APNs (iOS). AC2: Notificaciones funcionan con la app cerrada. AC3: Tap en la notificacion abre directamente el lead o hilo relevante. AC4: Badge en el icono de la app con cantidad de leads sin leer (@capacitor/badge). AC5: Haptic feedback (@capacitor/haptics) en swipe gestures del Searchbox mobile. |
| **Prioridad** | **Should Have** |
| **Modulo** | Mobile (Capacitor) |
| **Estimacion** | 5 puntos |

| US-084 | Live Updates sin Pasar por App Store Review |
| :---- | :---- |
| **Como** | founder/admin de la plataforma |
| **Quiero** | poder pushear updates de la web app a las apps nativas sin esperar el review de Apple/Google |
| **Para** | iterar rapido y fixear bugs sin el delay de 1-3 dias del review de stores |
| **Criterios** | AC1: Capgo (o similar) configurado para live updates. AC2: Cambios que no tocan plugins nativos se pushean instantaneamente. AC3: Rollback automatico si se detecta crash rate elevado post-update. AC4: Solo cambios de UI/logica. Cambios en plugins nativos requieren build completo. |
| **Prioridad** | **Could Have** |
| **Modulo** | Mobile (Capacitor) |
| **Estimacion** | 5 puntos |

*Fin del Documento — 84 User Stories — Reddit Lead Radar*