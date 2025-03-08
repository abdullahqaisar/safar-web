import { Route } from '@/types/route';
import { RoutePreferences } from '../../../types/preferences';
import { calculateComfortScore } from './comfort-score';
import { MAX_TRANSFERS } from '@/lib/constants/config';

/**
 * Calculate a comprehensive score for a route based on multiple factors
 */
export function calculateRouteScore(
  route: Route,
  preferences: RoutePreferences,
  stats: { minDuration: number; maxDuration: number; durationRange: number }
): number {
  // Base weights
  const weights = {
    duration: preferences.prioritizeDuration ? 0.5 : 0.3,
    comfort: preferences.prioritizeComfort ? 0.4 : 0.2,
    transfers: preferences.preferFewerTransfers ? 0.2 : 0.1,
    complexity: 0.1,
  };

  // Normalize weights to sum to 1
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  Object.keys(weights).forEach((key) => {
    weights[key as keyof typeof weights] /= totalWeight;
  });

  // 1. Duration score (lower is better, normalized between 0-1 and inverted)
  const normalizedDuration =
    (route.totalDuration - stats.minDuration) / stats.durationRange;
  const durationScore = 1 - normalizedDuration;

  // 2. Comfort score
  const comfortScore = calculateComfortScore(route, preferences) / 100;

  // 3. Transfer penalty
  const transfers =
    route.segments.filter((s) => s.type === 'transit').length - 1;
  const maxTransfers = MAX_TRANSFERS;
  const transferScore = 1 - transfers / maxTransfers;

  // Maximum possible segments: MAX_TRANSFERS transit segments + (MAX_TRANSFERS + 1) walking segments
  const maxPossibleSegments = MAX_TRANSFERS * 2 + 2;
  const complexityScore = 1 - route.segments.length / maxPossibleSegments;

  // Combine all factors with their weights
  const score =
    weights.duration * durationScore +
    weights.comfort * comfortScore +
    weights.transfers * transferScore +
    weights.complexity * complexityScore;

  return score;
}
