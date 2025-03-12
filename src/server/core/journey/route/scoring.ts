import { Route, TransitSegment, WalkSegment } from '@/types/route';
import {
  OPTIMIZE,
  TRANSFER_PENALTIES,
  WALKING_SCORE_THRESHOLDS,
} from '@/lib/constants/route-config';

/**
 * Calculate a comprehensive score for a route based on various factors
 * Returns a value between 0-100, higher is better
 */
export function calculateRouteScore(route: Route): number {
  // Early return for invalid routes
  if (!route || route.totalDuration <= 0) {
    return 0;
  }

  const transferScore = calculateTransferScore(route);
  const walkingScore = calculateWalkingScore(route);

  // Weighted score calculation
  const weightedScore =
    transferScore * OPTIMIZE.TRANSFER_WEIGHT +
    walkingScore * OPTIMIZE.WALKING_WEIGHT;

  return Math.min(100, Math.max(0, weightedScore));
}

/**
 * Calculate score based on number of transfers (fewer is better)
 * Returns 0-100 (100 = no transfers)
 */
function calculateTransferScore(route: Route): number {
  if (!route) return 0;

  let transferCount = 0;
  let previousLineId: string | undefined = undefined;

  for (const segment of route.segments) {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      const currentLineId = transitSegment.line?.id;

      // Only count as transfer if changing to a different line
      if (previousLineId && currentLineId && previousLineId !== currentLineId) {
        transferCount++;
      }

      // Update previous line ID
      previousLineId = currentLineId;
    }
  }

  // Get penalty based on transfer count
  const penalty =
    TRANSFER_PENALTIES[Math.min(transferCount, TRANSFER_PENALTIES.length - 1)];
  return Math.max(0, 100 - penalty);
}

/**
 * Calculate score based on walking distance (less walking is better)
 * Returns 0-100 (100 = minimum walking)
 */
function calculateWalkingScore(route: Route): number {
  if (!route) return 0;

  // Calculate total walking distance
  const walkingDistance = route.segments
    .filter((segment) => segment.type === 'walk')
    .reduce(
      (total, segment) => total + (segment as WalkSegment).walkingDistance,
      0
    );

  const { EXCELLENT, GOOD, ACCEPTABLE, FAIR, POOR } = WALKING_SCORE_THRESHOLDS;

  // Score based on walking distance thresholds
  if (walkingDistance <= EXCELLENT) return 100;
  if (walkingDistance <= GOOD)
    return 90 + (100 - 90) * (1 - walkingDistance / GOOD);
  if (walkingDistance <= ACCEPTABLE)
    return (
      80 + (90 - 80) * (1 - (walkingDistance - GOOD) / (ACCEPTABLE - GOOD))
    );
  if (walkingDistance <= FAIR)
    return (
      60 +
      (80 - 60) * (1 - (walkingDistance - ACCEPTABLE) / (FAIR - ACCEPTABLE))
    );
  if (walkingDistance <= POOR)
    return 0 + 60 * (1 - (walkingDistance - FAIR) / (POOR - FAIR));

  return 0;
}

/**
 * Calculate comfort score for a route
 */
export function calculateComfortScore(route: Route): number {
  if (!route || !route.segments || route.segments.length === 0) {
    return 0;
  }

  const transitSegments = route.segments.filter(
    (segment) => segment.type === 'transit'
  ) as TransitSegment[];

  // If no transit segments, score is neutral
  if (transitSegments.length === 0) {
    return 50;
  }

  // Calculate weighted score
  let totalScore = 0;
  let totalDuration = 0;

  for (const segment of transitSegments) {
    if (!segment.line) continue;

    const segmentDuration = segment.duration;
    totalDuration += segmentDuration;
    totalScore += segmentDuration;
  }

  return totalDuration > 0 ? totalScore / totalDuration : 50;
}
