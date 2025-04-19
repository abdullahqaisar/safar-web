import { Route } from '../types/route';
import { TransitGraph } from '../graph/graph';
import { optimizeRouteDiversity } from '../routing/route-diversity';
import { pruneRoutes } from '../routing/route-pruning';
import { validateAndOptimizeRoutes } from '../routing/route-validator';
import { consolidateRoutesByPath } from '../utils/route-signature';

/**
 * Extract all station IDs from a route
 */
export function getRouteStationIds(route: Route): string[] {
  const stationIds: Set<string> = new Set();

  route.segments.forEach((segment) => {
    segment.stations.forEach((station) => {
      stationIds.add(station.id);
    });
  });

  return Array.from(stationIds);
}

/**
 * Calculate overlap ratio between two sets of station IDs
 */
export function calculateStationOverlap(
  ids1: string[],
  ids2: string[]
): number {
  // Find common station IDs
  const commonIds = ids1.filter((id) => ids2.includes(id));

  // Calculate overlap ratio
  return commonIds.length / Math.max(ids1.length, ids2.length);
}

/**
 * Check if a route is too similar to any existing routes
 */
export function isRouteDuplicate(
  route: Route,
  existingRoutes: Route[]
): boolean {
  // Get station IDs from route
  const routeStationIds = getRouteStationIds(route);

  // Extract transit line IDs for this route
  const routeLineIds = new Set<string>();
  route.segments.forEach((segment) => {
    if (segment.type === 'transit') {
      routeLineIds.add(segment.line.id);
    }
  });

  // Count walking segments in this route
  const routeWalkingSegments = route.segments.filter(
    (segment) => segment.type === 'walk'
  ).length;

  // Special case: direct routes (0 transfers) with a single transit line
  // should never be considered duplicates of each other if they use different lines
  const isDirectSingleLineRoute =
    route.transfers === 0 && routeLineIds.size === 1;

  for (const existingRoute of existingRoutes) {
    const existingStationIds = getRouteStationIds(existingRoute);

    // Extract transit line IDs for the existing route
    const existingLineIds = new Set<string>();
    existingRoute.segments.forEach((segment) => {
      if (segment.type === 'transit') {
        existingLineIds.add(segment.line.id);
      }
    });

    // Count walking segments in the existing route
    const existingWalkingSegments = existingRoute.segments.filter(
      (segment) => segment.type === 'walk'
    ).length;

    // Special case: If one route has walking transfers and the other doesn't,
    // don't consider them duplicates, even if they share most stations
    // This ensures routes with walking transfers aren't filtered out in favor of routes with transit transfers
    if (routeWalkingSegments > 0 && existingWalkingSegments === 0) {
      // Route with walking transfers competing against a route with only transit transfers
      continue;
    }

    if (routeWalkingSegments === 0 && existingWalkingSegments > 0) {
      // Route with only transit transfers competing against a route with walking transfers
      continue;
    }

    // If both routes have the same number of transfers but one has walking segments
    // and they have different numbers of segments, don't consider them duplicates
    if (
      route.transfers === existingRoute.transfers &&
      routeWalkingSegments !== existingWalkingSegments &&
      route.segments.length !== existingRoute.segments.length
    ) {
      continue;
    }

    // If both routes are direct routes with a single line, compare line IDs
    if (
      isDirectSingleLineRoute &&
      existingRoute.transfers === 0 &&
      existingLineIds.size === 1
    ) {
      // Check if they use different lines
      const routeLineId = Array.from(routeLineIds)[0];
      const existingLineId = Array.from(existingLineIds)[0];

      // If lines are different, these are not duplicates, even if they follow the same path
      if (routeLineId !== existingLineId) {
        continue;
      }
    }

    // If routes are within 10% duration of each other
    const durationDifference = Math.abs(
      route.totalDuration - existingRoute.totalDuration
    );
    const durationThreshold = 0.1 * existingRoute.totalDuration;

    if (durationDifference <= durationThreshold) {
      // Check for station overlap
      const overlap = calculateStationOverlap(
        routeStationIds,
        existingStationIds
      );

      // If more than 70% of stations are the same, consider it duplicate
      // unless they have different types of transfers (walking vs transit)
      if (overlap > 0.7) {
        // Additional check for transfer modes to avoid filtering out walking transfers
        const hasWalkingTransfer = hasWalkingTransferSegment(route);
        const existingHasWalkingTransfer =
          hasWalkingTransferSegment(existingRoute);

        // If transfer types differ, don't consider them duplicates
        if (hasWalkingTransfer !== existingHasWalkingTransfer) {
          continue;
        }

        return true;
      }
    }
  }

  return false;
}

/**
 * Helper function to check if a route has a walking transfer segment
 * (as opposed to walking-only route or transit-only route)
 */
function hasWalkingTransferSegment(route: Route): boolean {
  // Check if the route has a walking segment between transit segments (a walking transfer)
  for (let i = 1; i < route.segments.length - 1; i++) {
    if (
      route.segments[i].type === 'walk' &&
      route.segments[i - 1].type === 'transit' &&
      route.segments[i + 1].type === 'transit'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Remove duplicate or very similar routes
 */
export function removeDuplicateRoutes(routes: Route[]): Route[] {
  if (routes.length <= 1) return routes;

  const uniqueRoutes: Route[] = [];

  for (const route of routes) {
    if (!isRouteDuplicate(route, uniqueRoutes)) {
      uniqueRoutes.push(route);
    }
  }

  return uniqueRoutes;
}

/**
 * Calculate a weighted score for route sorting
 * Lower score is better
 */
function calculateRouteSortScore(route: Route): number {
  const TIME_WEIGHT = 0.75; // 75% weight for duration
  const TRANSFER_WEIGHT = 0.15; // 15% weight for transfers
  const FARE_WEIGHT = 0.1; // 10% weight for fare

  // Normalize duration (assuming most trips are under 2 hours = 7200 seconds)
  const normalizedDuration = route.totalDuration / 7200;

  // Normalize transfers (assuming max 5 transfers)
  const normalizedTransfers = route.transfers / 5;

  // Normalize fare (assuming max fare around 200)
  const normalizedFare = (route.totalFare || 0) / 200;

  // Calculate weighted score
  const score =
    normalizedDuration * TIME_WEIGHT +
    normalizedTransfers * TRANSFER_WEIGHT +
    normalizedFare * FARE_WEIGHT;

  return score;
}

/**
 * Sort routes by multiple factors:
 * 1. Time (50% weight)
 * 2. Number of transfers (30% weight)
 * 3. Total fare (20% weight)
 */
export function sortRoutesByTime(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => {
    const scoreA = calculateRouteSortScore(a);
    const scoreB = calculateRouteSortScore(b);
    return scoreA - scoreB;
  });
}

/**
 * Sort routes strictly by time (fastest first)
 * @deprecated Use sortRoutesByTime which considers multiple factors
 */
export function sortRoutesByTimeOnly(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => a.totalDuration - b.totalDuration);
}

const MAX_ROUTES = 5; // Maximum number of routes to return

/**
 * Process routes by pruning, optimizing for diversity, and limiting results
 */
export function processRoutes(routes: Route[], graph?: TransitGraph): Route[] {
  if (routes.length === 0) {
    return [];
  }

  console.log(`[Process Routes] Processing ${routes.length} routes`); 
  // Apply validation and optimization to fix bugs
  if (graph) {
    routes = validateAndOptimizeRoutes(routes);
  }

  // Remove duplicate routes - station-based
  routes = removeDuplicateRoutes(routes);

  // Consolidate routes with identical line paths
  routes = consolidateRoutesByPath(routes);

  if (!graph) {
    // Fallback to simple sorting if graph is not provided
    const sortedRoutes = sortRoutesByTime(routes);
    return sortedRoutes.slice(0, MAX_ROUTES);
  }

  // Apply intelligent pruning to filter inefficient routes
  const prunedRoutes = pruneRoutes(routes, graph, MAX_ROUTES * 2);

  // Then optimize for diversity among the remaining candidates
  const diverseRoutes = optimizeRouteDiversity(prunedRoutes, graph, MAX_ROUTES);

  // As a final step, sort routes by time for consistent user experience
  return sortRoutesByTime(diverseRoutes);
}
