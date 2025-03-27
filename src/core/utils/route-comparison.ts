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
      if (overlap > 0.7) {
        return true;
      }
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
 * Rank routes by weighted score
 */
export function rankRoutes(routes: Route[]): Route[] {
  return routes.sort((a, b) => {
    // Prioritize by number of transfers first
    if (a.transfers !== b.transfers) {
      return a.transfers - b.transfers;
    }

    // Then by duration
    if (Math.abs(a.totalDuration - b.totalDuration) > 60) {
      // If difference > 1 minute
      return a.totalDuration - b.totalDuration;
    }

    // If transfers and duration are very similar, prefer routes with fewer segments
    return a.segments.length - b.segments.length;
  });
}

const MAX_ROUTES = 5; // Maximum number of routes to return

/**
 * Process routes by pruning, optimizing for diversity, and limiting results
 */
export function processRoutes(routes: Route[], graph?: TransitGraph): Route[] {
  if (routes.length === 0) {
    return [];
  }

  // Apply validation and optimization to fix bugs
  if (graph) {
    routes = validateAndOptimizeRoutes(routes, graph);
  }

  // Remove duplicate routes - station-based
  routes = removeDuplicateRoutes(routes);

  // Consolidate routes with identical line paths
  routes = consolidateRoutesByPath(routes);

  if (!graph) {
    // Fallback to simple ranking if graph is not provided
    const sortedRoutes = rankRoutes(routes);
    return sortedRoutes.slice(0, MAX_ROUTES);
  }

  // Apply intelligent pruning to filter inefficient routes
  const prunedRoutes = pruneRoutes(routes, graph, MAX_ROUTES * 2);

  // Then optimize for diversity among the remaining candidates
  const diverseRoutes = optimizeRouteDiversity(prunedRoutes, graph, MAX_ROUTES);

  return diverseRoutes;
}
