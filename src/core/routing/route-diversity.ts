import { Route } from '../types/route';
import { calculateRouteScore, calculateNormalizedScore } from './route-scoring';
import {
  getRouteStationIds,
  calculateStationOverlap,
} from '../utils/route-comparison';
import { TransitGraph } from '../graph/graph';

/**
 * Optimize a set of routes to ensure diversity
 * @returns A subset of routes that are sufficiently diverse
 */
export function optimizeRouteDiversity(
  routes: Route[],
  graph: TransitGraph,
  maxRoutes: number = 5
): Route[] {
  if (routes.length <= maxRoutes) return routes;

  // Calculate scores for all routes
  const routesWithScores = routes.map((route) => ({
    route,
    score: calculateRouteScore(route, graph),
    normalizedScore: 0, // Will be calculated after all scores are computed
  }));

  // Calculate normalized scores
  routesWithScores.forEach((item) => {
    item.normalizedScore = calculateNormalizedScore(item.route, routes, graph);
  });

  // Sort by score (best first)
  routesWithScores.sort((a, b) => a.score - b.score);

  // Always include the best route
  const selected: Route[] = [routesWithScores[0].route];
  const remainingCandidates = routesWithScores.slice(1);

  // Build the diverse set
  while (selected.length < maxRoutes && remainingCandidates.length > 0) {
    let bestDiverseIndex = -1;
    let bestDiversityScore = -1;

    // Find the candidate with the best combination of:
    // 1. Route quality (score)
    // 2. Diversity from already selected routes
    for (let i = 0; i < remainingCandidates.length; i++) {
      const candidate = remainingCandidates[i];
      const diversityScore = calculateDiversityValue(
        candidate.route,
        selected,
        candidate.normalizedScore
      );

      if (diversityScore > bestDiversityScore) {
        bestDiversityScore = diversityScore;
        bestDiverseIndex = i;
      }
    }

    // Add the most diverse valuable route to selected
    if (bestDiverseIndex >= 0) {
      selected.push(remainingCandidates[bestDiverseIndex].route);
      remainingCandidates.splice(bestDiverseIndex, 1);
    } else {
      // No good candidates left
      break;
    }
  }

  return selected;
}

/**
 * Calculate diversity value of a candidate route compared to already selected routes
 * @returns Value from 0-100 where higher means more diverse and valuable
 */
function calculateDiversityValue(
  candidate: Route,
  selectedRoutes: Route[],
  routeQualityScore: number
): number {
  // If selected is empty, return the route quality score
  if (selectedRoutes.length === 0) return routeQualityScore;

  // Get station IDs for candidate route
  const candidateStationIds = getRouteStationIds(candidate);

  // Calculate average overlap with existing routes
  let totalOverlap = 0;
  for (const selected of selectedRoutes) {
    const selectedStationIds = getRouteStationIds(selected);
    totalOverlap += calculateStationOverlap(
      candidateStationIds,
      selectedStationIds
    );
  }

  const avgOverlap = totalOverlap / selectedRoutes.length;

  // Calculate diversity score (higher means more different)
  // 0 = identical route, 100 = completely different route
  const diversityScore = 100 * (1 - avgOverlap);

  // Calculate duration difference
  let avgDurationDiff = 0;
  for (const selected of selectedRoutes) {
    avgDurationDiff += Math.abs(
      candidate.totalDuration - selected.totalDuration
    );
  }
  avgDurationDiff = avgDurationDiff / selectedRoutes.length;

  // Normalize duration difference to 0-100 scale
  // Higher value = more different in duration
  const durationDiversityScore = Math.min(100, (avgDurationDiff / 60) * 20);

  // Calculate transfer count diversity
  let transferDiversity = 20; // Default value
  // If candidate has a different transfer count than all selected routes
  const hasUniqueTransferCount = !selectedRoutes.some(
    (r) => r.transfers === candidate.transfers
  );
  if (hasUniqueTransferCount) {
    transferDiversity = 40; // Bonus for routes with unique transfer counts
  }

  // Compare transit modes used (walking vs transit ratio)
  const candidateWalkRatio = calculateWalkRatio(candidate);
  let walkRatioDiversity = 0;
  for (const selected of selectedRoutes) {
    const selectedWalkRatio = calculateWalkRatio(selected);
    walkRatioDiversity += Math.abs(candidateWalkRatio - selectedWalkRatio) * 50;
  }
  walkRatioDiversity = Math.min(
    100,
    walkRatioDiversity / selectedRoutes.length
  );

  // Calculate weighted diversity value
  // Weight formula gives higher importance to route quality and station diversity
  const weightedValue =
    routeQualityScore * 0.4 + // 40% route quality
    diversityScore * 0.35 + // 35% station diversity
    durationDiversityScore * 0.1 + // 10% duration diversity
    transferDiversity * 0.1 + // 10% transfer diversity
    walkRatioDiversity * 0.05; // 5% walk ratio diversity

  return weightedValue;
}

/**
 * Calculate ratio of walking distance to total distance
 * @returns Value 0-1 representing portion of route spent walking
 */
function calculateWalkRatio(route: Route): number {
  let walkingDistance = 0;

  route.segments.forEach((segment) => {
    if (segment.type === 'walk') {
      walkingDistance += segment.walkingDistance;
    }
  });

  return walkingDistance / route.totalDistance;
}
