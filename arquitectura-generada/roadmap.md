# Roadmap de 14 Días — Cazador de Señales MVP

## SEMANA 1 — Base técnica funcional

| Día | Tarea | Entregable |
|-----|-------|-----------|
| 1 | Estructura del proyecto: carpetas, .env, tsconfig, cliente Supabase | Proyecto corriendo localmente |
| 2 | Schema SQL completo en Supabase: 4 tablas, índices, constraints | Tablas creadas y verificadas |
| 3 | Módulo Apify: traer negocios y reviews de Google Maps | Script que devuelve datos reales |
| 4 | saveCompaniesAndReviews.ts: guardar sin duplicar | Datos persistidos en Supabase |
| 5 | analyzeReview.ts: IA analiza reseña → JSON con painType y severity | JSON de análisis funcionando |

## SEMANA 2 — Pipeline completo + dashboard

| Día | Tarea | Entregable |
|-----|-------|-----------|
| 6 | createReviewCrisisSignal.ts: detecta crisis, calcula score | Señales creadas en DB |
| 7 | generateOutreachEmail.ts: genera email personalizado | Email con asunto + cuerpo |
| 8 | sendEmail.ts con Resend (DRY_RUN=true primero) | Email impreso en consola |
| 9 | runReviewRadar.ts: orquestador completo + logs + manejo de errores | Pipeline end-to-end |
| 10 | GitHub Actions cron configurado y probado manualmente | Cron corriendo en Actions |
| 11 | Dashboard /signals básico en Next.js (solo lectura) | Tabla de señales visible |
| 12 | Dashboard /outreach con botones aprobar/descartar | Flujo de aprobación funcional |
| 13 | Prueba end-to-end: 1 ciudad real, 1 categoría, primeras 50 señales | 50 señales reales en DB |
| 14 | Ajuste de scoring, revisión manual de borradores, primer envío humano | Primeros emails enviados |

## Criterio de éxito (no técnico)

```
100 señales detectadas
   ↓
50 leads calificados (score ≥ 65)
   ↓
30 emails revisados y aprobados manualmente
   ↓
5 respuestas recibidas
   ↓
2 llamadas agendadas
   ↓
1 cliente beta cerrado
```

Si ese embudo se da, el sistema funciona. Si nadie responde, el problema es
el nicho, el mensaje o la oferta — no el sistema técnico. Se ajusta y se itera.

## Qué NO construir en estos 14 días

- Los scrapers de web change, tech stack y vacantes (vienen en semana 3+)
- Dashboard `/companies/[id]` completo
- Autopiloto activado (DRY_RUN=true y AUTOPILOT_SEND=false hasta día 14)
- Múltiples ciudades simultáneas (empezar con 1 ciudad, 1 categoría)
- Sistema de pricing o landing page de venta

## Semana 3 en adelante (post-MVP)

- Activar autopiloto (score > 85 + contacto válido + no contactado antes)
- Agregar scraper de cambios en sitios web (changedetection.io)
- Agregar detector de stack tecnológico (BuiltWith / Wappalyzer)
- Agregar detector de vacantes (SerpApi Google Jobs)
- Segunda ciudad / segundo nicho
- Primeros 3 clientes beta pagando setup + mensualidad
