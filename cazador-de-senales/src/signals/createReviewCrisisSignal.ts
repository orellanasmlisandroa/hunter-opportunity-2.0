import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../db/saveCompaniesAndReviews';
import type { SavedReview } from '../db/saveCompaniesAndReviews';
import type { ReviewAnalysis } from '../ai/analyzeReview';

export interface AnalyzedReview extends SavedReview {
  analysis: ReviewAnalysis;
}

export interface Signal {
  id?: string;
  companyId: string;
  signalType: 'review_crisis';
  signalSummary: string;
  severityScore: number;
}

const PAIN_TYPES_TRIGGER = ['no_answer', 'bad_communication', 'slow_service'];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function calculateScore(reviews: AnalyzedReview[], companyReviewCount: number, companyRating: number): number {
  let score = 0;

  const hasOneTwoStar = reviews.some(r => r.rating <= 2);
  if (hasOneTwoStar) score += 30;

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const recentNegative = reviews.filter(r =>
    r.analysis.sentiment === 'negative' &&
    new Date(r.reviewDate) >= sevenDaysAgo
  );
  if (recentNegative.length >= 2) score += 20;

  const hasPainKeyword = reviews.some(r =>
    PAIN_TYPES_TRIGGER.includes(r.analysis.painType)
  );
  if (hasPainKeyword) score += 20;

  if (companyReviewCount > 50) score += 10;
  if (companyRating > 4.0) score += 10;

  const hasContact = reviews.some(r => r.companyId);
  if (hasContact) score += 10;

  const hasVague = reviews.some(r => r.analysis.severity < 3);
  if (hasVague) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function buildSummary(reviews: AnalyzedReview[]): string {
  const negative = reviews.filter(r => r.analysis.sentiment === 'negative');
  const painTypes = [...new Set(negative.map(r => r.analysis.painType))];

  const painLabels: Record<string, string> = {
    slow_service: 'servicio lento',
    bad_communication: 'mala comunicación',
    no_answer: 'no contestan',
    pricing_confusion: 'confusión de precios',
    rude_staff: 'personal grosero',
    quality_issue: 'problemas de calidad',
    other: 'otros problemas',
  };

  const labels = painTypes.map(p => painLabels[p] ?? p).join(', ');
  return `${negative.length} reseña(s) negativa(s) reciente(s). Problemas: ${labels}.`;
}

async function alreadySignaledIn72h(companyId: string): Promise<boolean> {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('signals')
    .select('id')
    .eq('company_id', companyId)
    .eq('signal_type', 'review_crisis')
    .gte('detected_at', since)
    .maybeSingle();

  return !!data;
}

function triggersCrisis(reviews: AnalyzedReview[]): boolean {
  const hasHighSeverityOneStar = reviews.some(
    r => r.rating <= 1 && r.analysis.severity >= 8
  );
  if (hasHighSeverityOneStar) return true;

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const recentNegativeCount = reviews.filter(
    r => r.analysis.sentiment === 'negative' && new Date(r.reviewDate) >= sevenDaysAgo
  ).length;
  if (recentNegativeCount >= 2) return true;

  const hasTriggerPain = reviews.some(r =>
    r.analysis.sentiment === 'negative' &&
    PAIN_TYPES_TRIGGER.includes(r.analysis.painType)
  );
  if (hasTriggerPain) return true;

  return false;
}

export async function createReviewCrisisSignal(
  companyId: string,
  analyzedReviews: AnalyzedReview[],
  companyReviewCount = 0,
  companyRating = 0
): Promise<Signal | null> {
  if (!triggersCrisis(analyzedReviews)) return null;

  const alreadyDone = await alreadySignaledIn72h(companyId);
  if (alreadyDone) {
    console.log(`  ⏭️  Señal reciente ya existe para esta empresa (ventana 72h)`);
    return null;
  }

  const severityScore = calculateScore(analyzedReviews, companyReviewCount, companyRating);
  const signalSummary = buildSummary(analyzedReviews);

  const { data, error } = await supabase
    .from('signals')
    .insert({
      company_id: companyId,
      signal_type: 'review_crisis',
      signal_summary: signalSummary,
      severity_score: severityScore,
      detected_at: new Date().toISOString(),
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    console.error('  ⚠️  Error guardando señal:', error.message);
    return null;
  }

  return {
    id: data.id,
    companyId,
    signalType: 'review_crisis',
    signalSummary,
    severityScore,
  };
}
