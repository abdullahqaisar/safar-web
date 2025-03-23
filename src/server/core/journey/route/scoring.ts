import { Route, TransitSegment, WalkSegment } from '@/types/route';
import {
  OPTIMIZE,
  TRANSFER_PENALTIES,
  WALKING_SCORE_THRESHOLDS,
  WALKING_SHORTCUTS,
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
  let shortcutWalkingUsed = false;
  let explicitShortcutUsed = false;
  let totalPriority = 0;
  let explicitShortcutCount = 0;

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
    } else if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;

      // Track if the route uses walking shortcuts between stations
      if (walkSegment.isShortcut) {
        shortcutWalkingUsed = true;

        // Check if this is an explicit shortcut with priority
        if (walkSegment.isExplicitShortcut) {
          explicitShortcutUsed = true;
          explicitShortcutCount++;
          totalPriority += walkSegment.priority || 0;
        }
      }
    }
  }

  // Get penalty based on transfer count
  const penalty =
    TRANSFER_PENALTIES[Math.min(transferCount, TRANSFER_PENALTIES.length - 1)];

  // Give a bonus for routes that use walking shortcuts to reduce transfers
  let shortcutBonus = 0;

  if (explicitShortcutUsed) {
    // Larger bonus for explicit shortcuts based on their priority
    // Calculate average priority of shortcuts used
    const avgPriority = totalPriority / explicitShortcutCount;

    // Increase the bonus for routes with fewer transfers (they're using shortcuts effectively)
    const transferEfficiencyFactor = Math.max(0, 3 - transferCount) * 0.5;

    shortcutBonus = Math.min(
      25,
      10 + avgPriority + transferEfficiencyFactor * 5
    );
  } else if (shortcutWalkingUsed) {
    // Smaller bonus for dynamic shortcuts
    shortcutBonus = Math.max(0, 10 - transferCount * 2);
  }

  return Math.min(100, Math.max(0, 100 - penalty + shortcutBonus));
}

/**
 * Calculate walking score based on walking distance (less walking is better)
 * Returns 0-100 (100 = minimum walking)
 */
function calculateWalkingScore(route: Route): number {
  if (!route) return 0;

  // Calculate total walking distance and segment types
  let totalWalkingDistance = 0;
  let shortcutWalkingDistance = 0;
  let explicitShortcutWalkingDistance = 0;
  let longWalkingDistance = 0; // Specifically track long walks

  // Use consistent threshold from config
  const LONG_WALK_THRESHOLD = WALKING_SHORTCUTS.LONG_THRESHOLD;

  for (const segment of route.segments) {
    if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;
      totalWalkingDistance += walkSegment.walkingDistance;

      // Track different types of walking segments
      if (walkSegment.isShortcut) {
        shortcutWalkingDistance += walkSegment.walkingDistance;

        if (walkSegment.isExplicitShortcut) {
          explicitShortcutWalkingDistance += walkSegment.walkingDistance;
        }
      }
      // Heavily penalize long walking segments that aren't shortcuts
      else if (walkSegment.walkingDistance > LONG_WALK_THRESHOLD) {
        longWalkingDistance += walkSegment.walkingDistance;
      }
    }
  }

  // Adjust effective walking distance with varying weights:
  // - Explicit shortcuts get a 60% discount (up from 50%)
  // - Dynamic shortcuts get a 30% discount (unchanged)
  // - Long walking segments get a 20% penalty to discourage them
  const effectiveWalkingDistance =
    totalWalkingDistance -
    explicitShortcutWalkingDistance * 0.6 - // Increased discount for explicit shortcuts
    (shortcutWalkingDistance - explicitShortcutWalkingDistance) * 0.3 +
    longWalkingDistance * 0.2; // Additional penalty for long non-shortcut walks

  const { EXCELLENT, GOOD, ACCEPTABLE, FAIR, POOR } = WALKING_SCORE_THRESHOLDS;

  // Score based on walking distance thresholds
  if (effectiveWalkingDistance <= EXCELLENT) return 100;
  if (effectiveWalkingDistance <= GOOD)
    return 90 + (100 - 90) * (1 - effectiveWalkingDistance / GOOD);
  if (effectiveWalkingDistance <= ACCEPTABLE)
    return (
      80 +
      (90 - 80) * (1 - (effectiveWalkingDistance - GOOD) / (ACCEPTABLE - GOOD))
    );
  if (effectiveWalkingDistance <= FAIR)
    return (
      60 +
      (80 - 60) *
        (1 - (effectiveWalkingDistance - ACCEPTABLE) / (FAIR - ACCEPTABLE))
    );
  if (effectiveWalkingDistance <= POOR)
    return 0 + 60 * (1 - (effectiveWalkingDistance - FAIR) / (POOR - FAIR));

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
