// TODO: Semana 3+ — detectar nuevas vacantes
// Herramienta: SerpApi Google Jobs o Apify LinkedIn/Indeed scraper
// Señales: vacante de soporte, recepcionista, ventas, operaciones

export interface JobPosting {
  company: string;
  title: string;
  roleType: 'sales' | 'support' | 'receptionist' | 'operations' | 'marketing' | 'other';
  location: string;
  postedAt: string;
  url: string;
}

export async function detectJobPostings(
  _keywords: string[],
  _city: string
): Promise<JobPosting[]> {
  throw new Error('Not implemented — Semana 3+');
}
