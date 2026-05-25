# Cazador de Señales de Negocios Locales — Arquitectura Completa del MVP

**Autor:** Lisandro — Nivel Midas, Cortexia 777  
**Fecha:** 2026-05-25  
**Versión:** 1.0  

---

## 1. Stack y justificación

| Capa | Herramienta | Por qué |
|------|-------------|---------|
| Backend | Node.js + TypeScript | Tipado fuerte, ecosistema maduro, fácil de leer para IA |
| Scraping principal | Apify | Actor de Google Maps reviews ya existente, API simple, scheduling incluido |
| Scraping web | changedetection.io | Gratis para pocos URLs, API disponible, webhook al backend |
| Stack tecnológico | BuiltWith / Wappalyzer API | Detecta CRM, pixels, chatbots instalados en cualquier dominio |
| Vacantes | SerpApi Google Jobs | Resultados estructurados, sin scraping frágil |
| Base de datos | Supabase | PostgreSQL managed, row-level security, SDK TypeScript, free tier suficiente |
| IA | Claude (Anthropic) | Mejor razonamiento en texto en español, JSON output confiable |
| Email | Resend | API simple, dominio verificado, tracking de aperturas |
| Cron | GitHub Actions | Gratis, confiable, logs visibles, sin infraestructura propia |
| Dashboard | Next.js + Tailwind | App y API en un solo proyecto, deploy en Vercel gratis |

---

## 2. Estructura de carpetas

```
cazador-de-senales/
│
├── src/
│   ├── apify/
│   │   └── googleMapsReviews.ts       # Scraper principal
│   │
│   ├── scrapers/
│   │   ├── webChangeDetector.ts       # Cambios en sitios web
│   │   ├── techStackDetector.ts       # BuiltWith / Wappalyzer
│   │   └── jobPostingDetector.ts      # SerpApi Google Jobs
│   │
│   ├── ai/
│   │   ├── analyzeReview.ts           # Análisis de reseña → JSON
│   │   ├── generateOutreachEmail.ts   # Email personalizado
│   │   └── classifySignal.ts          # Resumen de señal
│   │
│   ├── signals/
│   │   ├── createReviewCrisisSignal.ts
│   │   ├── createWebChangeSignal.ts
│   │   ├── createTechAdoptionSignal.ts
│   │   └── createHiringSignal.ts
│   │
│   ├── scoring/
│   │   └── scoreSignal.ts             # Fórmula 0–100
│   │
│   ├── email/
│   │   └── sendEmail.ts               # Resend + DRY_RUN
│   │
│   ├── db/
│   │   ├── saveCompaniesAndReviews.ts
│   │   ├── saveSignal.ts
│   │   └── saveOutreachMessage.ts
│   │
│   └── jobs/
│       └── runReviewRadar.ts          # Orquestador principal
│
├── dashboard/                         # Next.js app
│   ├── app/
│   │   ├── signals/page.tsx
│   │   ├── companies/[id]/page.tsx
│   │   └── outreach/page.tsx
│   └── components/
│       ├── SignalTable.tsx
│       ├── EmailPreview.tsx
│       └── ApproveButton.tsx
│
├── config/
│   └── targets.json                   # Ciudades y categorías objetivo
│
├── supabase/
│   └── schema.sql                     # Tablas, índices, RLS
│
├── .env.example
├── .github/
│   └── workflows/
│       └── radar-cron.yml             # GitHub Actions cron
└── README.md
```

---

## 3. Base de datos — Supabase

### Tabla: `companies`

```sql
id                uuid          PRIMARY KEY DEFAULT gen_random_uuid()
name              text          NOT NULL
category          text
city              text
website           text
phone             text
email             text
google_maps_url   text          UNIQUE
rating            numeric
review_count      integer
created_at        timestamptz   DEFAULT now()
updated_at        timestamptz   DEFAULT now()

-- Índices
CREATE INDEX idx_companies_city_category ON companies(city, category);
CREATE INDEX idx_companies_rating ON companies(rating);
```

### Tabla: `reviews`

```sql
id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid()
company_id          uuid          REFERENCES companies(id) ON DELETE CASCADE
external_review_id  text          UNIQUE
rating              integer       CHECK (rating BETWEEN 1 AND 5)
text                text
author_name         text
review_date         timestamptz
detected_at         timestamptz   DEFAULT now()
sentiment           text          CHECK (sentiment IN ('negative','neutral','positive'))
pain_type           text

-- Índices
CREATE INDEX idx_reviews_company_id ON reviews(company_id);
CREATE INDEX idx_reviews_rating_date ON reviews(rating, review_date DESC);
```

### Tabla: `signals`

```sql
id              uuid          PRIMARY KEY DEFAULT gen_random_uuid()
company_id      uuid          REFERENCES companies(id) ON DELETE CASCADE
signal_type     text          CHECK (signal_type IN ('review_crisis','web_change','tech_adoption','hiring'))
signal_summary  text
severity_score  integer       CHECK (severity_score BETWEEN 0 AND 100)
detected_at     timestamptz   DEFAULT now()
status          text          DEFAULT 'new' CHECK (status IN ('new','contacted','discarded'))

-- Índices
CREATE INDEX idx_signals_company_score ON signals(company_id, severity_score DESC);
CREATE INDEX idx_signals_detected_at ON signals(detected_at DESC);
CREATE INDEX idx_signals_status_score ON signals(status, severity_score DESC);

-- Evita duplicar la misma señal para la misma empresa en 72h
CREATE UNIQUE INDEX idx_signals_no_duplicate
  ON signals(company_id, signal_type)
  WHERE detected_at > now() - interval '72 hours';
```

### Tabla: `outreach_messages`

```sql
id            uuid          PRIMARY KEY DEFAULT gen_random_uuid()
company_id    uuid          REFERENCES companies(id) ON DELETE CASCADE
signal_id     uuid          REFERENCES signals(id) ON DELETE CASCADE
channel       text          DEFAULT 'email'
subject       text
body          text
status        text          DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','discarded'))
sent_at       timestamptz
reply_status  text          DEFAULT 'none' CHECK (reply_status IN ('none','replied','bounced','unsubscribed'))

-- Índices
CREATE INDEX idx_outreach_status ON outreach_messages(status);
CREATE INDEX idx_outreach_company_id ON outreach_messages(company_id);
```

### Queries típicas

```sql
-- Señales listas para contactar, ordenadas por score
SELECT s.*, c.name, c.email, c.city
FROM signals s JOIN companies c ON s.company_id = c.id
WHERE s.status = 'new' AND s.severity_score >= 85
ORDER BY s.severity_score DESC, s.detected_at DESC;

-- Borradores pendientes de aprobación
SELECT o.*, c.name, s.signal_summary, s.severity_score
FROM outreach_messages o
  JOIN companies c ON o.company_id = c.id
  JOIN signals s ON o.signal_id = s.id
WHERE o.status = 'draft'
ORDER BY s.severity_score DESC;

-- Reviews negativas nuevas en últimas 24h
SELECT r.*, c.name, c.city, c.category
FROM reviews r JOIN companies c ON r.company_id = c.id
WHERE r.rating <= 2 AND r.detected_at > now() - interval '24 hours'
ORDER BY r.detected_at DESC;
```

---

## 4. Motor de IA

### analyzeReview.ts — Prompt al modelo

```
Analiza la siguiente reseña de negocio y responde SOLO con JSON válido.

Reseña: "{{texto}}"
Negocio: {{categoria}} en {{ciudad}}

Responde exactamente este esquema:
{
  "sentiment": "negative"|"neutral"|"positive",
  "painType": "slow_service"|"bad_communication"|"no_answer"|
               "pricing_confusion"|"rude_staff"|"quality_issue"|"other",
  "severity": 1–10,
  "summary": "una frase que describe el problema central",
  "isActionable": true|false
}

Reglas:
- No inventes información. Solo lo que dice el texto.
- Si el texto es muy vago, usa painType="other" y severity=2.
- isActionable=true solo si hay un dolor concreto que se puede resolver.
- Responde solo JSON. Sin texto adicional.
```

### generateOutreachEmail.ts — Prompt al modelo

```
Redacta un email de prospección corto para este negocio.

Datos:
- Negocio: {{nombre}}, {{categoría}}, {{ciudad}}
- Señal detectada: {{resumen_señal}}
- Tipo de dolor: {{pain_type}}
- Extractos de reseñas: {{fragmentos}}

Reglas absolutas:
- Máximo 150 palabras en el cuerpo.
- Tono humano, respetuoso, consultivo. No invasivo.
- NO mencionar scraping ni monitoreo automático.
- NO prometer resultados garantizados.
- Referenciar el problema de forma general ("vi algunas reseñas recientes").
- Ofrecer una solución concreta en 2–3 puntos.
- Cerrar con UNA pregunta simple.
- Incluir al final: "Si no tiene sentido, no te molesto de nuevo."
- Idioma: español neutro, sin regionalismos.

Responde solo JSON:
{ "subject": "...", "body": "..." }
```

---

## 5. Sistema de Scoring (0–100)

```
PUNTOS POSITIVOS
  +30  reseña de 1 o 2 estrellas
  +20  2 o más reseñas negativas en los últimos 7 días
  +20  texto menciona: no contestan / mala atención / espera / mala comunicación
  +10  negocio tiene más de 50 reseñas (tiene tamaño)
  +10  rating general > 4.0 (vale la pena recuperar)
  +10  tiene email o website detectable

PENALIZACIONES
  -30  ya fue contactado (status='contacted' en signals)
  -20  no tiene forma clara de contacto (sin email, sin web, sin teléfono)
  -20  reseña parece falsa o demasiado vaga (severity < 3)

FÓRMULA
  score = clamp(Σ positivos - Σ penalizaciones, 0, 100)

UMBRALES
  85–100  → CONTACTAR    (autopiloto si AUTOPILOT_SEND=true)
  65–84   → REVISAR      (queda como draft para aprobación manual)
  0–64    → DESCARTAR    (se guarda pero no se actúa)
```

---

## 6. Cron Job — GitHub Actions

```yaml
# .github/workflows/radar-cron.yml
name: Review Crisis Radar
on:
  schedule:
    - cron: '0 * * * *'   # cada hora
  workflow_dispatch:        # ejecución manual desde Actions

jobs:
  run-radar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx ts-node src/jobs/runReviewRadar.ts
        env:
          APIFY_TOKEN: ${{ secrets.APIFY_TOKEN }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          FROM_EMAIL: ${{ secrets.FROM_EMAIL }}
          DRY_RUN: 'true'
          AUTOPILOT_SEND: 'false'
```

---

## 7. Variables de entorno (.env.example)

```
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key

# Apify
APIFY_TOKEN=your-apify-token

# IA
ANTHROPIC_API_KEY=your-anthropic-key

# Email
RESEND_API_KEY=your-resend-key
FROM_EMAIL=outreach@tudominio.com

# Control de envío
DRY_RUN=true
AUTOPILOT_SEND=false
```

---

## 8. Dashboard — Next.js (páginas)

### `/signals` — Lista de señales
- Tabla: negocio, ciudad, tipo señal, score, fecha, estado
- Filtros: score mínimo / ciudad / categoría / status
- Botón "Ver email" → preview lateral del borrador
- Badge de color: rojo ≥85, amarillo 65–84, gris <65

### `/companies/[id]` — Perfil del negocio
- Datos del negocio: nombre, categoría, ciudad, web, teléfono, rating
- Lista de reseñas recientes con sentiment y pain_type
- Historial de señales generadas
- Mensajes enviados y estado de respuesta

### `/outreach` — Bandeja de borradores
- Lista de emails en status='draft', ordenados por score DESC
- Preview: asunto + cuerpo completo
- Botón **Aprobar** → llama API route → envía con Resend → status='sent'
- Botón **Descartar** → status='discarded'
- Métricas: total enviados / respuestas / tasa de apertura

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Apify cambia o depreca el actor | Media | Versionar el actor ID en .env, monitorear changelog |
| Claude devuelve JSON inválido | Baja-Media | try/catch con retry y fallback a `{ sentiment: "other" }` |
| Señal duplicada para la misma empresa | Alta sin control | UNIQUE index parcial en signals + ventana de 72h |
| Email enviado a empresa ya contactada | Alta sin control | Penalización -30 en scoring + check de status antes de enviar |
| Quemar dominio de email | Alta si autopiloto mal configurado | DRY_RUN primero, revisar 30+ emails a mano, usar dominio dedicado |
| Supabase free tier (500MB) lleno | Media en 2–3 meses | Archivar signals con status='discarded' cada 30 días |
| Cron de GitHub Actions falla silenciosamente | Media | Notificación de falla por email en el workflow |

---

## 10. Recomendaciones de escalabilidad y seguridad

### Seguridad — desde el día 1
- Variables de entorno: nunca hardcodeadas, siempre en GitHub Secrets o `.env` (gitignoreado)
- Row-Level Security en Supabase: activar RLS en todas las tablas desde el inicio
- Dashboard protegido: token de sesión simple (NextAuth o JWT básico) para que no sea público
- Rate limiting en Resend: máximo 50 emails/día en fase 1
- Dominio de email dedicado: `outreach@tudominio.com`, nunca el email personal

### Escalabilidad — después del MVP
- **Cola de trabajos**: cuando el volumen crezca, reemplazar el cron con BullMQ o Inngest para procesar scraping e IA en paralelo sin timeout
- **Múltiples señales**: el diseño modular de `/signals/` permite agregar `createWebChangeSignal.ts` sin tocar el orquestador
- **Cache de tech stack**: BuiltWith cobra por request — cachear resultados en Supabase con TTL de 7 días
- **Prompt caching de Claude**: reutilizar el system prompt fijo entre llamadas similares — reduce costo ~80%
- **Multi-tenant**: si se vende a agencias, agregar columna `tenant_id` en todas las tablas desde ahora

---

## 11. Prompts técnicos para construir el MVP (en orden)

### Prompt 1 — Estructura del proyecto
```
Crea la estructura inicial del proyecto "cazador-de-senales".
Stack: Node.js + TypeScript, Supabase, Apify, Claude API, Resend, Next.js.
Incluye: tsconfig.json, package.json con dependencias, .env.example con todas
las variables, y un README con pasos para correr localmente.
No construyas lógica todavía. Solo la estructura limpia y funcional.
```

### Prompt 2 — Schema SQL Supabase
```
Crea supabase/schema.sql con las tablas: companies, reviews, signals,
outreach_messages. Incluye todos los campos definidos en la arquitectura,
índices de performance, constraints UNIQUE para evitar duplicados,
y un constraint parcial en signals para evitar duplicar señales del mismo
tipo para la misma empresa en menos de 72 horas.
```

### Prompt 3 — Scraper Apify
```
Crea src/apify/googleMapsReviews.ts.
Debe recibir { searchQuery, city, maxResults } y ejecutar el actor de
Google Maps reviews de Apify. Esperar a que termine, leer el dataset
y normalizar a: { name, category, city, website, phone, googleMapsUrl,
rating, reviewCount, reviews: [{ externalReviewId, rating, text,
authorName, reviewDate }] }.
Manejo de errores con logs claros. Sin datos mock si hay API key.
```

### Prompt 4 — Guardar en Supabase sin duplicar
```
Crea src/db/saveCompaniesAndReviews.ts.
Recibe los datos normalizados del scraper. Guarda companies (upsert por
google_maps_url) y reviews (insert ignore por external_review_id).
Si la company ya existe, actualiza rating, review_count, updated_at.
Devuelve solo las reviews que son nuevas (no existían antes).
Usa supabase-js con tipos TypeScript.
```

### Prompt 5 — Análisis de reseñas con IA
```
Crea src/ai/analyzeReview.ts.
Recibe el texto de una reseña y devuelve:
{ sentiment, painType, severity(1-10), summary, isActionable }
Usa Claude API. El prompt debe ser estricto: no inventar, basarse solo
en el texto, responder solo JSON válido. Incluye try/catch con fallback
si el modelo devuelve JSON inválido.
```

### Prompt 6 — Crear señales
```
Crea src/signals/createReviewCrisisSignal.ts.
Recibe reviews nuevas por empresa. Crea una señal si: hay 1 reseña de
1 estrella con severity >= 8, o 2+ reseñas negativas en 7 días, o
reseña con painType en [no_answer, bad_communication, slow_service].
Calcula severity_score (0–100) con la fórmula de scoring definida.
Guarda en tabla signals. Evita duplicar señales en ventana de 72h.
```

### Prompt 7 — Generar email personalizado
```
Crea src/ai/generateOutreachEmail.ts.
Recibe: company name, category, city, signal summary, pain_type,
fragmentos de reseñas, descripción de oferta.
Usa Claude API para generar { subject, body }.
Reglas: máximo 150 palabras, tono humano, no mencionar scraping,
no prometer garantías, cerrar con pregunta simple e incluir frase
de salida elegante. Idioma: español neutro.
```

### Prompt 8 — Envío con Resend
```
Crea src/email/sendEmail.ts usando Resend.
Lee RESEND_API_KEY y FROM_EMAIL desde .env.
Recibe { to, subject, body, outreachMessageId }.
Si DRY_RUN=true, imprime el email y retorna sin enviar.
Si status en DB ya es 'sent', no reenvía.
Al enviar, actualiza outreach_messages con status='sent' y sent_at.
Manejo de errores con logging del error de Resend.
```

### Prompt 9 — Orquestador completo
```
Crea src/jobs/runReviewRadar.ts.
Lee targets de config/targets.json. Para cada target:
1. Apify → scraping
2. saveCompaniesAndReviews → DB
3. analyzeReview → reviews nuevas
4. createReviewCrisisSignal → señales
5. Si score >= 85 → generateOutreachEmail → guardar draft
6. Si AUTOPILOT_SEND=true → sendEmail
Al final imprime resumen: empresas procesadas, reviews nuevas,
señales creadas, emails generados, emails enviados.
Si un target falla, loguea el error y continúa con el siguiente.
```

### Prompt 10 — Dashboard Next.js
```
Crea el dashboard en dashboard/ con Next.js + Tailwind.
Tres páginas:
1. /signals: tabla con score, negocio, ciudad, tipo, estado. Filtros por
   score mínimo, ciudad, status. Botón "Ver email" que abre preview.
2. /outreach: lista de drafts con preview asunto+cuerpo, botón Aprobar
   (llama a API route que envía con Resend) y botón Descartar.
3. /companies/[id]: datos del negocio, reseñas recientes, señales e
   historial de mensajes.
Usa el cliente de Supabase directamente desde los server components.
Diseño simple y funcional, no perfecto.
```
