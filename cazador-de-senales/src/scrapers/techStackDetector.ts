// TODO: Semana 3+ — detectar cambios de stack tecnológico
// Herramienta: BuiltWith API o Wappalyzer API
// Señales: nuevo CRM, nuevo pixel, nuevo chatbot, herramienta faltante

export interface TechSignal {
  domain: string;
  tool: string;
  changeType: 'installed' | 'removed';
  category: 'crm' | 'pixel' | 'chat' | 'booking' | 'ecommerce' | 'other';
  detectedAt: string;
}

export async function detectTechChanges(_domains: string[]): Promise<TechSignal[]> {
  throw new Error('Not implemented — Semana 3+');
}
