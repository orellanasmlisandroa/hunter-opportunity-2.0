// TODO: Semana 3+ — detectar cambios en sitios web
// Herramienta: changedetection.io API o Playwright
// Señales: nueva página de servicio, cambio de precios, nueva ubicación

export interface WebChange {
  url: string;
  changeType: 'new_page' | 'price_change' | 'new_service' | 'new_location' | 'other';
  summary: string;
  detectedAt: string;
}

export async function detectWebChanges(_domains: string[]): Promise<WebChange[]> {
  throw new Error('Not implemented — Semana 3+');
}
