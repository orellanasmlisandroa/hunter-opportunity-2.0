import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Sentiment = 'negative' | 'neutral' | 'positive';

export type PainType =
  | 'slow_service'
  | 'bad_communication'
  | 'no_answer'
  | 'pricing_confusion'
  | 'rude_staff'
  | 'quality_issue'
  | 'other';

export interface ReviewAnalysis {
  sentiment: Sentiment;
  painType: PainType;
  severity: number;
  summary: string;
  isActionable: boolean;
}

export interface ReviewInput {
  text: string;
  category: string;
  city: string;
}

const FALLBACK: ReviewAnalysis = {
  sentiment: 'neutral',
  painType: 'other',
  severity: 1,
  summary: 'No se pudo analizar la reseña.',
  isActionable: false,
};

const VALID_SENTIMENTS: Sentiment[] = ['negative', 'neutral', 'positive'];
const VALID_PAIN_TYPES: PainType[] = [
  'slow_service', 'bad_communication', 'no_answer',
  'pricing_confusion', 'rude_staff', 'quality_issue', 'other',
];

function extractJson(raw: string): string {
  // Elimina bloques de markdown ```json ... ``` o ``` ... ```
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Si no hay bloque, busca el primer { ... }
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return raw.trim();
}

function parseAnalysis(raw: string): ReviewAnalysis {
  const json = JSON.parse(extractJson(raw));

  return {
    sentiment: VALID_SENTIMENTS.includes(json.sentiment) ? json.sentiment : 'neutral',
    painType: VALID_PAIN_TYPES.includes(json.painType) ? json.painType : 'other',
    severity: typeof json.severity === 'number'
      ? Math.max(1, Math.min(10, Math.round(json.severity)))
      : 1,
    summary: typeof json.summary === 'string' ? json.summary.slice(0, 200) : '',
    isActionable: json.isActionable === true,
  };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });
      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('429') && i < retries - 1) {
        const wait = (i + 1) * 15000; // 15s, 30s
        console.log(`  ⏳ Rate limit — esperando ${wait / 1000}s antes de reintentar...`);
        await sleep(wait);
      } else {
        throw error;
      }
    }
  }
  return '';
}

export async function analyzeReview(input: ReviewInput): Promise<ReviewAnalysis> {
  if (!input.text || input.text.trim().length < 5) return FALLBACK;

  const prompt = `Analiza la siguiente reseña de un negocio y responde SOLO con JSON válido.

Reseña: "${input.text}"
Tipo de negocio: ${input.category} en ${input.city}

Responde exactamente con este esquema JSON:
{
  "sentiment": "negative" | "neutral" | "positive",
  "painType": "slow_service" | "bad_communication" | "no_answer" | "pricing_confusion" | "rude_staff" | "quality_issue" | "other",
  "severity": <número entre 1 y 10>,
  "summary": "<una frase que describe el problema central>",
  "isActionable": <true | false>
}

Reglas:
- Basarte SOLO en el texto de la reseña. No inventar.
- Si el texto es muy corto o vago, usar painType "other" y severity 2.
- isActionable es true solo si hay un problema concreto que se puede resolver.
- Responde SOLO el JSON. Sin texto adicional, sin markdown, sin bloques de código.`;

  try {
    const raw = await callWithRetry(prompt);
    return parseAnalysis(raw);
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('JSON')) {
      console.error('  ⚠️  JSON inválido del modelo — usando fallback');
    } else {
      console.error('  ⚠️  Error de IA:', error.message);
    }
    return FALLBACK;
  }
}
