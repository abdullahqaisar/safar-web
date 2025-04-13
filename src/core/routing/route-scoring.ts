import { Route, WalkingRouteSegment } from '../types/route';

import {
  ScoringWeights,
  ScoringThresholds,
  InterchangeImportance,
  LineQualityFactors,
} from '../utils/scoring-config';
import { TransitGraph } from '../graph/graph';

/**
 * Calculate a comprehensive score for a route
 * Lower scores are better (represents a weighted penalty)
 */
export function calculateRouteScore(route: Route, graph: TransitGraph): number {
  // Base factors
  const timeScore = calculateTimeScore(route);
  const transferScore = calculateTransferScore(route, graph);
  const walkingScore = calculateWalkingScore(route);
  const complexityScore = calculateComplexityScore(route);
  const stopsScore = calculateStopsScore(route);

  // Origin station penalty
  let originPenalty = 0;

  // Check if the route starts at the requested origin
  if (
    route.requestedOrigin &&
    route.segments.length > 0 &&
    route.segments[0].stations[0].id !== route.requestedOrigin
  ) {
    // Add a substantial penalty for routes not starting at the requested origin
    originPenalty = 100; // High penalty to override transfer benefits
  }

  // Combine weighted scores
  const totalScore =
    timeScore * ScoringWeights.TIME +
    transferScore * ScoringWeights.TRANSFERS +
    walkingScore * ScoringWeights.WALKING +
    complexityScore * ScoringWeights.COMPLEXITY +
    stopsScore * ScoringWeights.STOPS +
    originPenalty; // Add the origin penalty to the total score

  return totalScore;
}

/**
 * Calculate score component based on total journey time
 */
function calculateTimeScore(route: Route): number {
  // For time, we use a non-linear scaling to reflect that
  // time differences matter more for shorter journeys
  const baseTimeScore = route.totalDuration / 60; // Convert to minutes

  // Apply non-linear scaling:
  // - For trips < 15 min: more sensitive to small time differences
  // - For trips > 30 min: less sensitive to small time differences
  if (baseTimeScore < 15) {
    return baseTimeScore * 1.2; // Increase sensitivity
  } else if (baseTimeScore > 30) {
    return Math.sqrt(baseTimeScore) * 3; // Decrease sensitivity
  }

  return baseTimeScore;
}

/**
 * Calculate score component based on transfers
 */
function calculateTransferScore(route: Route, graph: TransitGraph): number {
  const transferCount = route.transfers;

  // No transfers is ideal
  if (transferCount === 0) {
    return 0;
  }

  let score = transferCount * 10; // Base transfer penalty

  // Add penalty for multiple transfers
  if (transferCount > 1) {
    score +=
      (transferCount - 1) * ScoringWeights.MULTIPLE_TRANSFER_PENALTY * 10;
  }

  for (let i = 0; i < route.segments.length - 1; i++) {
    const currentSegment = route.segments[i];
    const nextSegment = route.segments[i + 1];

    // Only analyze transit-to-transit or walking-to-transit transfers
    if (currentSegment.type === 'transit' || nextSegment.type === 'transit') {
      // If this is a walking transfer
      if (currentSegment.type === 'walk' || nextSegment.type === 'walk') {
        const walkSegment =
          currentSegment.type === 'walk'
            ? (currentSegment as WalkingRouteSegment)
            : (nextSegment as WalkingRouteSegment);

        // Penalize long walking transfers more heavily
        if (
          walkSegment.walkingDistance > ScoringThresholds.MEDIUM_WALK_METERS
        ) {
          score += ScoringWeights.TRANSFER_DISTANCE_PENALTY * 10;
        }

        if (walkSegment.walkingDistance > ScoringThresholds.LONG_WALK_METERS) {
          score += ScoringWeights.TRANSFER_DISTANCE_PENALTY * 15;
        }
      } else {
        // This is a station-to-station transfer
        const transferStation =
          currentSegment.stations[currentSegment.stations.length - 1];

        // Check if this is a recognized interchange with an importance factor
        if (
          transferStation &&
          graph.stations[transferStation.id]?.isInterchange
        ) {
          const importanceFactor =
            InterchangeImportance[transferStation.id] ||
            InterchangeImportance.DEFAULT_INTERCHANGE;

          // Better interchanges get a discount on their transfer penalty
          score -= importanceFactor * 0.5;
        }
      }
    }
  }

  return Math.max(0, score); // Ensure non-negative score
}

/**
 * Calculate score component based on walking distance
 */
function calculateWalkingScore(route: Route): number {
  let totalWalkingDistance = 0;

  // Sum all walking distances and count walking segments
  route.segments.forEach((segment) => {
    if (segment.type === 'walk') {
      const walkSegment = segment as WalkingRouteSegment;
      totalWalkingDistance += walkSegment.walkingDistance;
    }
  });

  let score = totalWalkingDistance / 100; // Base walking score

  // Penalize routes with long individual walking segments
  route.segments.forEach((segment) => {
    if (segment.type === 'walk') {
      const walkSegment = segment as WalkingRouteSegment;
      if (walkSegment.walkingDistance > ScoringThresholds.LONG_WALK_METERS) {
        score += ScoringWeights.LONG_WALK_PENALTY * 5;
      }
    }
  });

  return score;
}

/**
 * Calculate score based on route complexity
 * More complex routes are harder for users to follow
 */
function calculateComplexityScore(route: Route): number {
  let score = 0;
  const segmentTypes = route.segments.map((s) => s.type);

  // Penalize alternating segment types (walk-transit-walk-transit is complex)
  for (let i = 1; i < segmentTypes.length; i++) {
    if (segmentTypes[i] !== segmentTypes[i - 1]) {
      score += 2;
    }
  }

  // Penalize routes with many distinct lines
  const uniqueLines = new Set<string>();
  route.segments.forEach((segment) => {
    if (segment.type === 'transit') {
      uniqueLines.add(segment.line.id);
    }
  });

  score += uniqueLines.size * 3;

  // Account for line quality factors
  let qualityPenalty = 0;
  route.segments.forEach((segment) => {
    if (segment.type === 'transit') {
      const lineQuality =
        LineQualityFactors[segment.line.id] || LineQualityFactors.DEFAULT;
      // Penalize segments on less reliable lines
      qualityPenalty += (1 - lineQuality) * 5 * (segment.duration / 60);
    }
  });

  score += qualityPenalty;

  return score;
}

/**
 * Calculate score component based on number of stops
 */
function calculateStopsScore(route: Route): number {
  return route.totalStops * 0.2; // Small penalty per stop
}

/**
 * Calculate normalized score for a route within a collection
 * Normalized to a 0-100 scale where 100 is best
 */
export function calculateNormalizedScore(
  route: Route,
  allRoutes: Route[],
  graph: TransitGraph
): number {
  if (allRoutes.length === 0) return 100;
  if (allRoutes.length === 1) return 100;

  // Calculate raw scores for all routes
  const scores = allRoutes.map((r) => calculateRouteScore(r, graph));

  // Find min and max scores
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Find the score for this specific route
  const routeIndex = allRoutes.findIndex((r) => r.id === route.id);
  const routeScore = scores[routeIndex];

  // Normalize to 0-100 scale, where 100 is best (lower raw score)
  // In case all scores are the same, assign 100
  if (maxScore === minScore) return 100;

  return 100 - ((routeScore - minScore) / (maxScore - minScore)) * 100;
}
