import { Route } from '@/types/route';
import { RoutePreferences } from '../types/preferences';

/**
 * Calculates a comfort score for a route based on transfers and walking distances
 * Higher score means more comfortable route
 */
export function calculateComfortScore(
  route: Route,
  preferences: RoutePreferences
): number {
  let score = 100;

  // Penalize transfers (more if user prefers fewer transfers)
  const transferPenalty = preferences.preferFewerTransfers ? 20 : 15;
  const transfers =
    route.segments.filter((s) => s.type === 'transit').length - 1;
  score -= transfers * transferPenalty;

  // Penalize walking segments based on user preference
  const maxWalkTime = preferences.maxWalkingTime || 15;
  route.segments.forEach((segment) => {
    if (segment.type === 'walk') {
      const walkMinutes = segment.duration / 60;

      // Small penalty for any walking
      score -= 5;

      // Additional penalty for walking beyond user preference
      if (walkMinutes > maxWalkTime) {
        score -= (walkMinutes - maxWalkTime) * 3;
      }

      // Severe penalty for extremely long walks
      if (walkMinutes > maxWalkTime * 2) {
        score -= (walkMinutes - maxWalkTime * 2) * 5;
      }
    }
  });

  // Penalize routes with too many total segments (complexity penalty)
  if (route.segments.length > 3) {
    score -= (route.segments.length - 3) * 5;
  }

  // If there's a direct transit route with minimal walking, give it a bonus
  if (
    transfers === 0 &&
    route.segments.filter((s) => s.type === 'walk').length <= 2 &&
    route.segments.every((s) => s.type !== 'walk' || s.duration <= 600) // 10 minutes
  ) {
    score += 15;
  }

  return Math.max(0, score);
}
