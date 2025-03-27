import { Route } from '../types/route';
import { TransitGraph } from '../graph/graph';
import { calculateRouteScore } from '../routing/route-scoring';
import { optimizeRouteDiversity } from '../routing/route-diversity';

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

  for (const existingRoute of existingRoutes) {
    const existingStationIds = getRouteStationIds(existingRoute);

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
 * Process routes by removing duplicates, ranking, and optimizing for diversity
 */
export function processRoutes(routes: Route[], graph?: TransitGraph): Route[] {
  if (routes.length === 0) {
    return [];
  }

  // Remove duplicate routes
  const uniqueRoutes = removeDuplicateRoutes(routes);

  if (!graph) {
    // Fallback to simple ranking if graph is not provided
    const sortedRoutes = rankRoutes(uniqueRoutes);
    return sortedRoutes.slice(0, MAX_ROUTES);
  }

  // First sort by score
  const scoredRoutes = uniqueRoutes.sort(
    (a, b) => calculateRouteScore(a, graph) - calculateRouteScore(b, graph)
  );

  // Then optimize for diversity
  const diverseRoutes = optimizeRouteDiversity(scoredRoutes, graph, MAX_ROUTES);

  return diverseRoutes;
}
