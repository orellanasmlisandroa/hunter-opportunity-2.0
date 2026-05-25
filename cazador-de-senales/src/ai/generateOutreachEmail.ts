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
  websiteStatus?: 'none' | 'obsolete' | 'modern';
  socialMediaStatus?: 'inactive' | 'unoptimized' | 'active';
  bookingSystemStatus?: 'none' | 'basic_whatsapp' | 'automated';
  chatbotStatus?: 'none' | 'basic' | 'advanced_ai';
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

const FALLBACK: GeneratedEmail = {
  subject: 'Una idea para agilizar las reservas en tu negocio',
  body: 'Hola,\n\nEstaba viendo las excelentes opiniones de su negocio en la zona y los felicito por el gran servicio. Noté que algunos clientes comentan sobre la espera al agendar o comunicarse.\n\nDiseñamos sistemas de citas automáticas y asistentes en WhatsApp que atienden 24/7 y agendan directamente en su calendario.\n\n¿Tendrían 5 minutos esta semana para ver una demostración interactiva sin compromiso?\n\nSi no tiene sentido, no se preocupe, no los molesto de nuevo.',
};

const PAIN_LABELS: Record<PainType, string> = {
  slow_service: 'tiempos de espera o retrasos en la atención',
  bad_communication: 'dificultades en la comunicación con los clientes',
  no_answer: 'demoras o falta de respuesta a los mensajes',
  pricing_confusion: 'confusión en la información de precios o servicios',
  rude_staff: 'detalles a pulir en el servicio de atención',
  quality_issue: 'oportunidades de mejora en la consistencia del servicio',
  other: 'detalles de experiencia del cliente a optimizar',
};

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return raw.trim();
}

export async function generateOutreachEmail(input: EmailInput): Promise<GeneratedEmail> {
  const painLabel = PAIN_LABELS[input.painType] ?? 'oportunidades en la experiencia de servicio';
  const excerpts = input.reviewExcerpts
    .slice(0, 2)
    .map(e => `"${e.slice(0, 120)}"`)
    .join('\n');

  const webLabel = input.websiteStatus === 'none' ? 'No tiene sitio web activo' : input.websiteStatus === 'obsolete' ? 'Sitio web desactualizado o lento en móviles' : 'Tiene sitio web moderno';
  const socialLabel = input.socialMediaStatus === 'inactive' ? 'Sin redes sociales o inactivas hace meses' : input.socialMediaStatus === 'unoptimized' ? 'Redes poco profesionales o sin contenido reciente' : 'Redes activas y optimizadas';
  const bookingLabel = input.bookingSystemStatus === 'none' ? 'Sin agendador digital' : input.bookingSystemStatus === 'basic_whatsapp' ? 'Reservas manuales por WhatsApp' : 'Sistema de reservas en línea automatizado';
  const chatbotLabel = input.chatbotStatus === 'none' ? 'Sin chatbot ni respuestas automáticas' : input.chatbotStatus === 'basic' ? 'Chatbot básico y rígido' : 'Agente conversacional de IA avanzado';

  const prompt = `Redacta un email de prospección corto y sumamente humano para este negocio, adaptado a sus fallos digitales y reseñas.

Datos del negocio:
- Nombre: ${input.companyName}
- Tipo: ${input.category} en ${input.city}
- Problema detectado en reseñas: ${painLabel}
- Resumen de señal: ${input.signalSummary}
${excerpts ? `- Fragmentos de reseñas reales:\n${excerpts}` : ''}

Auditoría de Oportunidad Digital:
- Presencia Web: ${webLabel} (websiteStatus: ${input.websiteStatus ?? 'none'})
- Redes Sociales: ${socialLabel} (socialMediaStatus: ${input.socialMediaStatus ?? 'unoptimized'})
- Sistema de Citas: ${bookingLabel} (bookingSystemStatus: ${input.bookingSystemStatus ?? 'none'})
- Canales de Atención: ${chatbotLabel} (chatbotStatus: ${input.chatbotStatus ?? 'none'})

Servicios Midas Disponibles para ofrecer:
1. Midas Web (Rediseño de Landing Page ultra-rápida y enfocada en conversiones móviles) - Ofrecer si no tiene web o es obsoleta.
2. Midas Booking (Sistema de reservas en línea automatizado con recordatorios por WhatsApp/SMS para eliminar inasistencias) - Ofrecer si agenda manual/por WhatsApp.
3. Midas Conversational Agent (Asistente de IA GPT-4 conversacional en WhatsApp/Web disponible 24/7) - Ofrecer si hay crisis de atención lenta o no hay chatbot.
4. Midas Social Growth (Creación de Reels, TikToks y contenido optimizado por IA) - Ofrecer si sus redes están inactivas/desactualizadas.

Reglas absolutas para redactar el email:
- Máximo 120 palabras en el body.
- Tono sumamente humano, cercano, empático y respetuoso. NUNCA sonar a robot, corporativo ni a vendedor de spam agresivo.
- NO mencionar palabras como "scraping", "monitoreo automatizado", "bot de extracción", ni "hemos analizado tu base de datos". Di algo más natural como "estaba revisando opiniones locales de tu negocio" o "me topé con su perfil comercial".
- NO prometas milagros. Ofrece valor.
- Relaciona el problema de reseñas de forma fluida y ofrece la solución digital Midas más relevante de forma muy natural (máx 1-2 puntos clave).
- Si tiene problemas de reseñas y además no tiene sitio web o reservas automáticas, relaciónalos de manera lógica: "Noté que algunos clientes comentan sobre el tiempo de respuesta o agendamiento; a veces esto pasa porque falta una plataforma ágil para que reserven directamente o un asistente automático en WhatsApp".
- Ofrecer ayuda concreta o una idea rápida de mejora en una línea.
- Cerrar con UNA pregunta simple y abierta para abrir conversación (ej: ¿Les interesaría ver una maqueta de cómo luciría esto? o ¿Tiene sentido conversar 5 minutos?).
- Última línea obligatoria (en un párrafo aparte): "Si no tiene sentido, no se preocupe, no los molesto de nuevo."
- Idioma: español neutro latinoamericano natural y profesional.
- El asunto debe ser corto (máx 8 palabras), sumamente directo y real, sin emojis ni palabras de spam en mayúsculas. Ej: "idea de reservas para [Nombre]" o "reseñas de [Nombre] y su web".

Responde SOLO con este formato JSON válido (sin markdown, sin bloques de código, sin texto extra):
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
