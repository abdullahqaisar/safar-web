import { Route, TransitSegment, WalkSegment } from '@/types/route';

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

  // Modified weighting: transfers are more important than walking distance
  // similar to Google Maps prioritization
  const weightedScore = transferScore * 0.65 + walkingScore * 0.35;

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

      // Only count as transfer if we're changing to a different line
      if (previousLineId && currentLineId && previousLineId !== currentLineId) {
        transferCount++;
      }

      // Update previous line ID
      previousLineId = currentLineId;
    }
  }

  // Adjusted transfer penalty (more exponential)
  // 0 transfers = 100, 1 transfer = 85, 2 transfers = 60, 3 transfers = 30, 4+ = 0
  const penaltyPoints = [0, 15, 40, 70, 100];
  const penalty =
    penaltyPoints[Math.min(transferCount, penaltyPoints.length - 1)];

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

  // More realistic scoring based on research of Google Maps preferences:
  // 0m = 100, 300m = 90, 500m = 80, 1000m = 60, 2000m = 0
  if (walkingDistance <= 0) return 100;
  if (walkingDistance <= 300)
    return 90 + (100 - 90) * (1 - walkingDistance / 300);
  if (walkingDistance <= 500)
    return 80 + (90 - 80) * (1 - (walkingDistance - 300) / 200);
  if (walkingDistance <= 1000)
    return 60 + (80 - 60) * (1 - (walkingDistance - 500) / 500);
  if (walkingDistance <= 2000)
    return 0 + 60 * (1 - (walkingDistance - 1000) / 1000);
  return 0;
}

export function calculateComfortScore(route: Route): number {
  // Early return for invalid routes
  if (!route || !route.segments || route.segments.length === 0) {
    return 0;
  }

  const segments = route.segments.filter(
    (segment) => segment.type === 'transit'
  );

  const transitSegments = segments as TransitSegment[];

  // If no transit segments, score is neutral
  if (transitSegments.length === 0) {
    return 50;
  }

  // Calculate weighted score for each line used
  let totalScore = 0;
  let totalDuration = 0;

  for (const segment of transitSegments) {
    const line = segment.line;
    if (!line) continue;

    const segmentDuration = segment.duration;
    totalDuration += segmentDuration;

    totalScore += segmentDuration;
  }

  return totalDuration > 0 ? totalScore / totalDuration : 50;
}
