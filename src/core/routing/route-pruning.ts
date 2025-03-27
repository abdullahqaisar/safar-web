import { Route } from '../types/route';
import { PruningThresholds, PruningWeights } from '../utils/pruning-config';
import { LineQualityFactors } from '../utils/scoring-config';
import { getRouteStationIds } from '../utils/route-comparison';
import { TransitGraph } from '../graph/graph';

/**
 * Types of route inefficiencies that can be detected during pruning
 */
export type RouteIssue =
  | 'EXCESSIVE_DURATION'
  | 'EXCESSIVE_DISTANCE'
  | 'EXCESSIVE_WALKING'
  | 'INEFFICIENT_TRANSFERS'
  | 'REDUNDANT_SIMILAR_ROUTE'
  | 'EXCESSIVE_COMPLEXITY'
  | 'POOR_QUALITY_LINES'
  | 'PRESERVED_ROUTE'
  | 'UNNECESSARY_TRANSFER'
  | 'SELF_LOOP_SEGMENT'
  | 'INVALID_SEGMENT_LENGTH';

/**
 * Container for route with analysis data
 */
interface AnalyzedRoute {
  route: Route;
  issues: RouteIssue[];
  efficiencyScore: number;
  preserved: boolean;
}

/**
 * Apply intelligent pruning to routes to remove inefficient or redundant options
 */
export function pruneRoutes(
  routes: Route[],
  graph: TransitGraph,
  maxRoutes: number = 5
): Route[] {
  if (routes.length <= maxRoutes) {
    return routes;
  }

  // Step 1: Analyze all routes
  const analyzedRoutes = analyzeRoutes(routes);

  // Step 2: Mark routes that should be preserved (special cases)
  markPreservedRoutes(analyzedRoutes);

  // Step 3: Apply progressive filtering
  const filteredRoutes = applyProgressiveFiltering(analyzedRoutes, maxRoutes);

  // Return the final set of routes
  return filteredRoutes.map((ar) => ar.route);
}

/**
 * Analyze all routes and calculate efficiency metrics
 */
function analyzeRoutes(routes: Route[]): AnalyzedRoute[] {
  // Find min values for normalization
  const minDuration = Math.min(...routes.map((r) => r.totalDuration));
  const minDistance = Math.min(...routes.map((r) => r.totalDistance));
  const minTransfers = Math.min(...routes.map((r) => r.transfers));

  return routes.map((route) => {
    // Calculate efficiency score (lower is better)
    const durationRatio = route.totalDuration / minDuration;
    const distanceRatio = route.totalDistance / minDistance;
    const transferRatio =
      route.transfers === 0 ? 1 : route.transfers / minTransfers;

    const efficiencyScore =
      durationRatio * PruningWeights.DURATION +
      distanceRatio * PruningWeights.DISTANCE +
      transferRatio * PruningWeights.TRANSFERS;

    // Initial analysis with no issues
    return {
      route,
      issues: [],
      efficiencyScore,
      preserved: false,
    };
  });
}

/**
 * Mark routes that should be preserved regardless of other factors
 */
function markPreservedRoutes(analyzedRoutes: AnalyzedRoute[]): void {
  if (analyzedRoutes.length === 0) return;

  // Find and mark fastest route
  const fastestRoute = analyzedRoutes.reduce((fastest, current) =>
    current.route.totalDuration < fastest.route.totalDuration
      ? current
      : fastest
  );
  fastestRoute.preserved = true;
  fastestRoute.issues.push('PRESERVED_ROUTE');

  // Find and mark route with least walking
  const routesWithWalking = analyzedRoutes.map((ar) => {
    let walkingDistance = 0;
    ar.route.segments.forEach((segment) => {
      if (segment.type === 'walk') {
        walkingDistance += segment.walkingDistance;
      }
    });
    return { analyzedRoute: ar, walkingDistance };
  });

  if (routesWithWalking.some((r) => r.walkingDistance > 0)) {
    const leastWalkingRoute = routesWithWalking.reduce((least, current) =>
      current.walkingDistance < least.walkingDistance ? current : least
    );
    leastWalkingRoute.analyzedRoute.preserved = true;
    leastWalkingRoute.analyzedRoute.issues.push('PRESERVED_ROUTE');
  }

  // Find and mark simplest route (fewest segments)
  const simplestRoute = analyzedRoutes.reduce((simplest, current) =>
    current.route.segments.length < simplest.route.segments.length
      ? current
      : simplest
  );
  simplestRoute.preserved = true;
  simplestRoute.issues.push('PRESERVED_ROUTE');
}

/**
 * Apply progressive filtering to routes
 */
function applyProgressiveFiltering(
  analyzedRoutes: AnalyzedRoute[],
  maxRoutes: number
): AnalyzedRoute[] {
  // Step 1: First pass - identify route issues
  identifyExcessiveDuration(analyzedRoutes);
  identifyExcessiveDistance(analyzedRoutes);
  identifyExcessiveWalking(analyzedRoutes);
  identifyInefficientTransfers(analyzedRoutes);
  identifyRedundantSimilarRoutes(analyzedRoutes);
  identifyExcessiveComplexity(analyzedRoutes);
  identifyPoorQualityLines(analyzedRoutes);
  // Add new checks
  identifyUnnecessaryTransfers(analyzedRoutes);
  identifySelfLoops(analyzedRoutes);

  // Step 2: Filter out routes with multiple issues first (unless preserved)
  let filteredRoutes = [...analyzedRoutes].sort((a, b) => {
    // Preserved routes always come first (lowest priority for removal)
    if (a.preserved && !b.preserved) return -1;
    if (!a.preserved && b.preserved) return 1;

    // Otherwise, sort by number of issues then by efficiency score
    if (a.issues.length !== b.issues.length) {
      return b.issues.length - a.issues.length; // More issues = higher priority for removal
    }
    return b.efficiencyScore - a.efficiencyScore; // Higher efficiency score = higher priority for removal
  });

  // Step 3: If we still have too many routes, keep removing the worst ones
  if (filteredRoutes.length > maxRoutes) {
    filteredRoutes = filteredRoutes
      .filter((r) => r.preserved || r.issues.length === 0)
      .slice(0, maxRoutes);
  }

  // If still too many, keep the most efficient ones
  if (filteredRoutes.length > maxRoutes) {
    filteredRoutes.sort((a, b) => a.efficiencyScore - b.efficiencyScore);
    filteredRoutes = filteredRoutes.slice(0, maxRoutes);
  }

  // If we have too few routes now (because too many were preserved), add back some
  if (filteredRoutes.length < maxRoutes) {
    const additionalRoutes = analyzedRoutes
      .filter((ar) => !filteredRoutes.includes(ar))
      .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
      .slice(0, maxRoutes - filteredRoutes.length);

    filteredRoutes = [...filteredRoutes, ...additionalRoutes];
  }

  return filteredRoutes;
}

/**
 * Identify routes that take significantly longer than necessary
 */
function identifyExcessiveDuration(analyzedRoutes: AnalyzedRoute[]): void {
  if (analyzedRoutes.length < 2) return;

  const minDuration = Math.min(
    ...analyzedRoutes.map((ar) => ar.route.totalDuration)
  );

  analyzedRoutes.forEach((ar) => {
    if (
      !ar.preserved &&
      ar.route.totalDuration >
        minDuration * PruningThresholds.MAX_DURATION_DEVIATION
    ) {
      ar.issues.push('EXCESSIVE_DURATION');
    }
  });
}

/**
 * Identify routes that cover significantly more distance than necessary
 */
function identifyExcessiveDistance(analyzedRoutes: AnalyzedRoute[]): void {
  if (analyzedRoutes.length < 2) return;

  const minDistance = Math.min(
    ...analyzedRoutes.map((ar) => ar.route.totalDistance)
  );

  analyzedRoutes.forEach((ar) => {
    if (
      !ar.preserved &&
      ar.route.totalDistance >
        minDistance * PruningThresholds.MAX_DISTANCE_DEVIATION
    ) {
      ar.issues.push('EXCESSIVE_DISTANCE');
    }
  });
}

/**
 * Identify routes with excessive walking compared to other options
 */
function identifyExcessiveWalking(analyzedRoutes: AnalyzedRoute[]): void {
  // Calculate walking distance for each route
  const routeWalkingDistances = analyzedRoutes.map((ar) => {
    let walkingDistance = 0;
    ar.route.segments.forEach((segment) => {
      if (segment.type === 'walk') {
        walkingDistance += segment.walkingDistance;
      }
    });
    return { analyzedRoute: ar, walkingDistance };
  });

  // Find minimum walking distance among routes that have walking segments
  const routesWithWalking = routeWalkingDistances.filter(
    (r) => r.walkingDistance > 0
  );
  if (routesWithWalking.length < 2) return;

  const minWalkingDistance = Math.min(
    ...routesWithWalking.map((r) => r.walkingDistance)
  );

  routeWalkingDistances.forEach((rwd) => {
    if (
      rwd.walkingDistance > 0 &&
      !rwd.analyzedRoute.preserved &&
      rwd.walkingDistance >
        minWalkingDistance * PruningThresholds.MAX_WALKING_DETOUR_RATIO
    ) {
      rwd.analyzedRoute.issues.push('EXCESSIVE_WALKING');
    }
  });
}

/**
 * Identify routes with transfers that don't significantly improve the route
 */
function identifyInefficientTransfers(analyzedRoutes: AnalyzedRoute[]): void {
  if (analyzedRoutes.length < 2) return;

  // Group routes by transfer count
  const routesByTransfer: Record<number, AnalyzedRoute[]> = {};
  analyzedRoutes.forEach((ar) => {
    const transfers = ar.route.transfers;
    routesByTransfer[transfers] = routesByTransfer[transfers] || [];
    routesByTransfer[transfers].push(ar);
  });

  const transferCounts = Object.keys(routesByTransfer).map(Number).sort();
  if (transferCounts.length < 2) return;

  // For each transfer count (except the lowest), check if the routes are efficient
  for (let i = 1; i < transferCounts.length; i++) {
    const currentTransferCount = transferCounts[i];
    const lowerTransferCount = transferCounts[i - 1];

    const currentRoutes = routesByTransfer[currentTransferCount];
    const lowerRoutes = routesByTransfer[lowerTransferCount];

    // Find fastest time in lower transfer group
    const fastestLowerTime = Math.min(
      ...lowerRoutes.map((ar) => ar.route.totalDuration)
    );

    // Check each route in current group
    currentRoutes.forEach((ar) => {
      if (!ar.preserved) {
        // If the route with more transfers isn't significantly faster,
        // mark it as inefficient
        const improvementRatio = fastestLowerTime / ar.route.totalDuration;
        if (
          improvementRatio <
          1 + PruningThresholds.TRANSFER_JUSTIFICATION_THRESHOLD
        ) {
          ar.issues.push('INEFFICIENT_TRANSFERS');
        }
      }
    });
  }
}

/**
 * Identify routes that are very similar to other routes but worse
 */
function identifyRedundantSimilarRoutes(analyzedRoutes: AnalyzedRoute[]): void {
  if (analyzedRoutes.length < 2) return;

  // Calculate station sequence similarity between routes
  for (let i = 0; i < analyzedRoutes.length; i++) {
    if (analyzedRoutes[i].preserved) continue;

    const routeA = analyzedRoutes[i].route;
    const stationsA = getRouteStationIds(routeA);

    for (let j = 0; j < analyzedRoutes.length; j++) {
      if (i === j || analyzedRoutes[j].preserved) continue;

      const routeB = analyzedRoutes[j].route;
      const stationsB = getRouteStationIds(routeB);

      // Calculate station sequence similarity (ordered)
      const similarity = calculateOrderedStationSimilarity(
        stationsA,
        stationsB
      );

      if (similarity > PruningThresholds.ROUTE_SIMILARITY_THRESHOLD) {
        // If routes are very similar, keep the more efficient one
        if (
          analyzedRoutes[i].efficiencyScore > analyzedRoutes[j].efficiencyScore
        ) {
          analyzedRoutes[i].issues.push('REDUNDANT_SIMILAR_ROUTE');
        }
      }
    }
  }
}

/**
 * Calculate how similar two routes are in terms of station sequence
 */
function calculateOrderedStationSimilarity(
  stationsA: string[],
  stationsB: string[]
): number {
  // If either array is empty, return 0 similarity
  if (stationsA.length === 0 || stationsB.length === 0) {
    return 0;
  }

  // Count stations in the same order
  let matchCount = 0;
  let lastMatchIndexB = -1;

  for (const stationA of stationsA) {
    // Find this station in B, but only after the last match
    for (let i = lastMatchIndexB + 1; i < stationsB.length; i++) {
      if (stationsB[i] === stationA) {
        matchCount++;
        lastMatchIndexB = i;
        break;
      }
    }
  }

  // Calculate similarity ratio
  return matchCount / Math.max(stationsA.length, stationsB.length);
}

/**
 * Identify routes that are unnecessarily complex in terms of segment pattern
 */
function identifyExcessiveComplexity(analyzedRoutes: AnalyzedRoute[]): void {
  analyzedRoutes.forEach((ar) => {
    if (ar.preserved) return;

    // Count number of segment type alternations (transit->walk->transit->walk...)
    let alternations = 0;
    const segments = ar.route.segments;

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].type !== segments[i - 1].type) {
        alternations++;
      }
    }

    if (alternations > PruningThresholds.MAX_SEGMENT_ALTERNATIONS) {
      ar.issues.push('EXCESSIVE_COMPLEXITY');
    }
  });
}

/**
 * Identify routes that primarily use low-quality lines
 */
function identifyPoorQualityLines(analyzedRoutes: AnalyzedRoute[]): void {
  analyzedRoutes.forEach((ar) => {
    if (ar.preserved) return;

    let totalDuration = 0;
    let qualityWeightedDuration = 0;

    // Calculate quality-weighted duration for transit segments
    ar.route.segments.forEach((segment) => {
      if (segment.type === 'transit') {
        const lineQuality =
          LineQualityFactors[segment.line.id] || LineQualityFactors.DEFAULT;
        totalDuration += segment.duration;
        qualityWeightedDuration += segment.duration * lineQuality;
      }
    });

    // If transit duration is significant and quality is poor
    if (totalDuration > 0) {
      const averageLineQuality = qualityWeightedDuration / totalDuration;

      // If mostly using poor quality lines (< 0.85 avg quality) and
      // there are better routes available
      if (
        averageLineQuality < 0.85 &&
        analyzedRoutes.some(
          (other) =>
            other !== ar &&
            !other.issues.includes('POOR_QUALITY_LINES') &&
            other.route.totalDuration <= ar.route.totalDuration * 1.2
        )
      ) {
        ar.issues.push('POOR_QUALITY_LINES');
      }
    }
  });
}

/**
 * Identify routes with unnecessary transfers (transfers at same station)
 */
function identifyUnnecessaryTransfers(analyzedRoutes: AnalyzedRoute[]): void {
  analyzedRoutes.forEach((ar) => {
    if (ar.preserved) return;

    const route = ar.route;
    // Skip routes with no transfers
    if (route.segments.length <= 1) return;

    // Check for adjacent segments with same start/end stations
    for (let i = 0; i < route.segments.length - 1; i++) {
      // Get last station of current segment and first of next segment
      const currentSegment = route.segments[i];
      const nextSegment = route.segments[i + 1];

      const lastStationCurrent =
        currentSegment.stations[currentSegment.stations.length - 1];
      const firstStationNext = nextSegment.stations[0];

      // If stations are the same and both segments are transit, this is potentially an unnecessary transfer
      if (
        lastStationCurrent.id === firstStationNext.id &&
        currentSegment.type === 'transit' &&
        nextSegment.type === 'transit'
      ) {
        ar.issues.push('UNNECESSARY_TRANSFER');
        break;
      }
    }
  });
}

/**
 * Identify segments that have identical start and end stations (self-loops)
 */
function identifySelfLoops(analyzedRoutes: AnalyzedRoute[]): void {
  analyzedRoutes.forEach((ar) => {
    if (ar.preserved) return;

    // Check each segment for self-loops
    for (const segment of ar.route.segments) {
      if (
        segment.stations.length >= 2 &&
        segment.stations[0].id ===
          segment.stations[segment.stations.length - 1].id
      ) {
        ar.issues.push('SELF_LOOP_SEGMENT');
        break;
      }
    }

    // Also check for segments with only one station
    if (ar.route.segments.some((segment) => segment.stations.length < 2)) {
      ar.issues.push('INVALID_SEGMENT_LENGTH');
    }
  });
}
