import type { AnalyzedReview } from '../signals/createReviewCrisisSignal';

export interface ScoringContext {
  reviews: AnalyzedReview[];
  totalReviews: number;
  overallRating: number;
  hasContactInfo: boolean;
  alreadyContacted: boolean;
}

export function scoreSignal(ctx: ScoringContext): number {
  let score = 0;

  // Puntos positivos
  const hasOneStar = ctx.reviews.some(r => r.rating <= 2);
  if (hasOneStar) score += 30;

  const recentNegative = ctx.reviews.filter(r => r.analysis.sentiment === 'negative');
  if (recentNegative.length >= 2) score += 20;

  const hasPainKeyword = ctx.reviews.some(r =>
    ['no_answer', 'bad_communication', 'slow_service'].includes(r.analysis.painType)
  );
  if (hasPainKeyword) score += 20;

  if (ctx.totalReviews > 50) score += 10;
  if (ctx.overallRating > 4.0) score += 10;
  if (ctx.hasContactInfo) score += 10;

  // Penalizaciones
  if (ctx.alreadyContacted) score -= 30;
  if (!ctx.hasContactInfo) score -= 20;

  const hasVagueReview = ctx.reviews.some(r => r.analysis.severity < 3);
  if (hasVagueReview) score -= 20;

  return Math.max(0, Math.min(100, score));
}

export type ScoreDecision = 'contact' | 'review' | 'discard';

export function getDecision(score: number): ScoreDecision {
  if (score >= 85) return 'contact';
  if (score >= 65) return 'review';
  return 'discard';
}
