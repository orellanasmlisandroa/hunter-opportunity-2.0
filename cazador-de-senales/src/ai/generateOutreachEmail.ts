import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

import type { PainType } from './analyzeReview';

export interface EmailInput {
  companyName: string;
  category: string;
  city: string;
  signalSummary: string;
  painType: PainType;
  reviewExcerpts: string[];
  offerDescription: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

const FALLBACK: GeneratedEmail = {
  subject: 'Una herramienta que puede ayudar a tu negocio',
  body: 'Hola, vi algunas reseñas recientes sobre tu negocio y creo que podría ayudarte. ¿Tienes 5 minutos para conversar?\n\nSi no tiene sentido, no te molesto de nuevo.',
};

const PAIN_LABELS: Record<PainType, string> = {
  slow_service: 'tiempos de espera largos',
  bad_communication: 'problemas de comunicación con los clientes',
  no_answer: 'dificultad para contactarlos',
  pricing_confusion: 'confusión con precios o servicios',
  rude_staff: 'experiencias negativas con el equipo',
  quality_issue: 'inconformidades con el servicio',
  other: 'experiencias que mejorar',
};

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return raw.trim();
}

export async function generateOutreachEmail(input: EmailInput): Promise<GeneratedEmail> {
  const painLabel = PAIN_LABELS[input.painType] ?? 'algunas experiencias recientes';
  const excerpts = input.reviewExcerpts
    .slice(0, 2)
    .map(e => `"${e.slice(0, 100)}"`)
    .join('\n');

  const prompt = `Redacta un email de prospección corto y humano para este negocio.

Datos del negocio:
- Nombre: ${input.companyName}
- Tipo: ${input.category} en ${input.city}
- Problema detectado: ${painLabel}
- Resumen de señal: ${input.signalSummary}
${excerpts ? `- Fragmentos de reseñas recientes:\n${excerpts}` : ''}

Reglas absolutas:
- Máximo 120 palabras en el body.
- Tono humano, cercano y respetuoso. NO sonar a robot ni a vendedor agresivo.
- NO mencionar scraping, monitoreo automático ni herramientas de IA.
- NO prometer resultados garantizados ni usar superlativos.
- Referenciar el problema de forma natural ("noté algunas reseñas recientes").
- Ofrecer ayuda concreta en 2 puntos máximo.
- Cerrar con UNA pregunta simple y directa.
- Última línea siempre: "Si no tiene sentido, no te molesto de nuevo."
- Idioma: español neutro latinoamericano.
- El asunto debe ser corto (máx 8 palabras), directo, sin emojis.

Responde SOLO con este JSON (sin markdown, sin texto extra):
{ "subject": "...", "body": "..." }`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const json = JSON.parse(extractJson(raw));

    return {
      subject: typeof json.subject === 'string' ? json.subject.slice(0, 100) : FALLBACK.subject,
      body: typeof json.body === 'string' ? json.body.slice(0, 1000) : FALLBACK.body,
    };
  } catch {
    console.error('  ⚠️  Error generando email — usando fallback');
    return FALLBACK;
  }
}
