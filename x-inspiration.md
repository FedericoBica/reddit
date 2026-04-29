# X Inspiration — Feature Definition

## Estado actual

La sección `/x/inspiration` ya existe y funciona: genera 5 drafts de tweets por día usando 5 ángulos fijos (Insight, Story, Hot Take, Question, Product), personalizados según el X Context profile del usuario.

**El problema:** la AI genera desde el vacío. No sabe qué está viralizando hoy en el nicho del usuario. Los tweets son genéricos aunque estén escritos en la voz correcta.

---

## Qué queremos construir

Agregar una capa de **contexto de mercado en tiempo real**: antes de generar, la AI lee los tweets más virales del día en el nicho del usuario y los usa como señal para decidir qué temas valen la pena cubrir y cómo enfocarlos.

### Resultado esperado para el usuario

Abrir `/x/inspiration` y ver tweets draft que:
- Responden a conversaciones que están pasando **hoy** en su nicho
- Están escritos en su voz, con sus reglas, su tono
- Se sienten oportunos, no genéricos

---

## Pipeline

```
[Inngest cron — cada día a las 3am]
  → para cada proyecto activo con X configurado:
      → X API search/recent: top tweets del nicho (filtro: min_faves:150, últimas 24hs)
      → guardar en tabla viral_tweets (project_id, text, author, metrics, fetched_at)

[Usuario abre /x/inspiration o hace "Refresh"]
  → pull de viral_tweets de las últimas 24hs del proyecto
  → OpenAI:
      input: perfil del usuario + top 20 tweets virales
      tarea 1: seleccionar los 6-8 tweets más relevantes para este usuario/nicho
      tarea 2: por cada ángulo activo, generar 1 draft inspirado en esos tweets
  → guardar drafts en x_scheduled_posts (source: "inspiration")
  → mostrar en UI
```

---

## Componentes a construir

### 1. Tabla `viral_tweets`
Almacena los tweets virales del nicho por proyecto, scrapeados diariamente.

Campos clave: `project_id`, `x_post_id`, `text`, `author_username`, `like_count`, `retweet_count`, `reply_count`, `impression_count`, `fetched_at`, `lang`

### 2. Inngest function: `fetch-viral-tweets`
- Cron diario (3am UTC)
- Itera proyectos activos con X keywords configuradas
- Llama a X API `GET /2/tweets/search/recent` con:
  - query construida desde las X keywords del proyecto + `min_faves:150 -is:retweet lang:en`
  - `sort_order=relevancy`, `max_results=25`
- Upsert en `viral_tweets` (dedup por `x_post_id`)
- Retención: borrar registros de más de 7 días

### 3. Upgrade al generador de inspiración
Modificar `generateXPost()` para aceptar `viralContext: string[]` opcional.

Cuando hay viral context, el prompt cambia:
- Antes: "generá un tweet de tipo Insight en la voz del usuario"
- Ahora: "dados estos tweets que están viralizando hoy en el nicho, generá un tweet de tipo Insight que sea oportuno y esté en la voz del usuario"

### 4. Upgrade a `generateInspirationAction`
Antes de llamar al generador, hacer:
```
viral_tweets → últimas 24hs → top 20 por like_count → pasar como contexto
```
Si no hay viral tweets aún (proyecto nuevo, cron no corrió), caer al comportamiento actual sin contexto.

### 5. UI: indicador de contexto
Mostrar en la página si los drafts fueron generados con contexto viral o sin él.
- Con contexto: "Based on X trending posts in your niche today"
- Sin contexto: "Generated from your profile — viral context not yet available"

---

## Costo X API

- Modelo: pay-per-use oficial ($0.005 / tweet leído)
- 25 tweets/día × 30 días = 750 tweets/proyecto/mes = **$3.75/proyecto/mes**
- A 100 proyectos activos: ~**$375/mes**

---

## Fuera de scope (por ahora)

- Búsqueda semántica / vector embeddings sobre viral_tweets históricos
- Selección manual de tweets virales por el usuario
- Soporte multilingüe en la query de búsqueda
- Métricas de qué drafts el usuario terminó posteando (feedback loop)
