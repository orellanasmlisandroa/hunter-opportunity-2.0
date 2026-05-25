# Cazador de Señales de Negocios Locales

Sistema de prospección trigger-based: detecta señales públicas en negocios locales LATAM,
analiza el dolor con IA, asigna un puntaje y genera emails de outreach personalizados.

## Requisitos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com) (free tier alcanza)
- Cuenta en [Apify](https://apify.com) (free tier alcanza para MVP)
- API key de [Anthropic](https://console.anthropic.com)
- Cuenta en [Resend](https://resend.com) con dominio verificado

## Instalación

```bash
# 1. Clonar / descomprimir el proyecto
cd cazador-de-senales

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus keys reales

# 4. Crear tablas en Supabase
# Copia y pega el contenido de supabase/schema.sql en el SQL Editor de Supabase
```

## Correr el radar

```bash
# Modo borrador (recomendado al inicio — no envía emails)
npm run radar

# Con DRY_RUN=false en .env → envía emails reales
npm run radar
```

## Estructura del proyecto

```
src/
├── apify/          → scraper de Google Maps reviews
├── scrapers/       → web change, tech stack, vacantes (Semana 3+)
├── ai/             → análisis de reseñas y generación de emails
├── signals/        → detección y creación de señales
├── scoring/        → fórmula de scoring 0–100
├── email/          → envío con Resend
├── db/             → guardado en Supabase sin duplicar
└── jobs/           → orquestador principal (runReviewRadar.ts)

config/
└── targets.json    → ciudades y categorías a monitorear

supabase/
└── schema.sql      → tablas, índices y constraints

dashboard/          → Next.js (Día 11–12)
```

## Flujo de fases

| Fase | Configuración | Comportamiento |
|------|--------------|----------------|
| 1 — Aprendizaje | `DRY_RUN=true` | Detecta, redacta, imprime. Tú revisas. |
| 2 — Revisión | `DRY_RUN=false`, `AUTOPILOT_SEND=false` | Guarda borradores. Tú apruebas desde el dashboard. |
| 3 — Autopiloto | `DRY_RUN=false`, `AUTOPILOT_SEND=true` | Envía solo si score ≥ 85 + contacto válido + no contactado antes. |

**Recomendación:** no pasar a Fase 3 hasta haber revisado y aprobado al menos 30 emails manualmente.
