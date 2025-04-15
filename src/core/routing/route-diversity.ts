import { Route } from '../types/route';
import { calculateRouteScore, calculateNormalizedScore } from './route-scoring';
import {
  getRouteStationIds,
  calculateStationOverlap,
} from '../utils/route-comparison';
import { TransitGraph } from '../graph/graph';
import { getLinePathSignature } from '../utils/route-signature';

/**
 * Optimize a set of routes to ensure diversity
 * @returns A subset of routes that are sufficiently diverse
 */
export function optimizeRouteDiversity(
  routes: Route[],
  graph: TransitGraph,
  maxRoutes: number = 5
): Route[] {
  console.log(
    `[Diversity] Optimizing diversity for ${routes.length} routes (max: ${maxRoutes})`
  );

  if (routes.length <= maxRoutes) {
    console.log(
      `[Diversity] No optimization needed, returning all ${routes.length} routes`
    );
    return routes;
  }

  // Calculate scores for all routes
  const routesWithScores = routes.map((route) => ({
    route,
    score: calculateRouteScore(route, graph),
    normalizedScore: calculateNormalizedScore(route, routes, graph),
  }));

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

  // Get line path signature for candidate
  const candidateSignature = getLinePathSignature(candidate);

  // Check if we already have a route with the same line path signature
  const hasSamePathRoute = selectedRoutes.some(
    (route) => getLinePathSignature(route) === candidateSignature
  );

  // Heavily penalize routes with the same line path (decrease diversity value)
  if (hasSamePathRoute) {
    return routeQualityScore * 0.3; // 70% penalty for duplicate path strategy
  }

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

  // If candidate has fewer transfers than all selected routes, give it a big boost
  const hasFewerTransfers = selectedRoutes.every(
    (r) => candidate.transfers < r.transfers
  );

  if (hasFewerTransfers) {
    transferDiversity = 50; // Major bonus for routes with fewer transfers
  }
  // If candidate has a different transfer count than all selected routes
  else if (!selectedRoutes.some((r) => r.transfers === candidate.transfers)) {
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

  // Calculate line diversity score
  const lineDiversity = calculateLineDiversity(candidate, selectedRoutes);

  // Calculate weighted diversity value
  // Weight formula gives higher importance to route quality and station diversity
  const weightedValue =
    routeQualityScore * 0.35 + // 35% route quality
    diversityScore * 0.2 + // 20% station diversity (down from 25%)
    lineDiversity * 0.15 + // 15% line diversity score (down from 20%)
    durationDiversityScore * 0.1 + // 10% duration diversity
    transferDiversity * 0.15 + // 15% transfer diversity (up from 5%)
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

/**
 * Calculate line diversity score by comparing transit line usage
 */
function calculateLineDiversity(
  candidate: Route,
  selectedRoutes: Route[]
): number {
  // Extract all line IDs used in candidate route
  const candidateLines = new Set<string>();

  candidate.segments.forEach((segment) => {
    if (segment.type === 'transit') {
      candidateLines.add(segment.line.id);
    }
  });

  // For each selected route, calculate line overlap
  let totalLineOverlap = 0;

  for (const selectedRoute of selectedRoutes) {
    const selectedLines = new Set<string>();

    selectedRoute.segments.forEach((segment) => {
      if (segment.type === 'transit') {
        selectedLines.add(segment.line.id);
      }
    });

    // Count common lines
    let commonLines = 0;
    candidateLines.forEach((line) => {
      if (selectedLines.has(line)) commonLines++;
    });

    // Calculate overlap ratio
    const overlapRatio =
      commonLines / Math.max(candidateLines.size, selectedLines.size);

    totalLineOverlap += overlapRatio;
  }

  const avgLineOverlap = totalLineOverlap / selectedRoutes.length;

  // Return diversity score (0-100) where higher means more diverse
  return 100 * (1 - avgLineOverlap);
}
