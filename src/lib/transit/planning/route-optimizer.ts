import { Route } from '@/types/route';
import { RoutePreferences, MAX_ROUTES_TO_RETURN } from '../types/preferences';

import { calculateRouteScore } from '../scoring/route-scorer';
import { calculateComfortScore } from '../scoring/comfort-score';
import { MAX_TRANSFERS } from '@/constants/config';

/**
 * Ranks routes using a weighted scoring system similar to real-world mapping applications
 */
export function rankRoutes(
  routes: Route[],
  preferences: RoutePreferences
): Route[] {
  // Filter out invalid routes
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  // Find min/max values for normalization
  const maxDuration = Math.max(...validRoutes.map((r) => r.totalDuration));
  const minDuration = Math.min(...validRoutes.map((r) => r.totalDuration));
  const durationRange = maxDuration - minDuration || 1;

  // Calculate scores and sort
  return validRoutes
    .map((route) => {
      const score = calculateRouteScore(route, preferences, {
        minDuration,
        maxDuration,
        durationRange,
      });
      return { route, score };
    })
    .sort((a, b) => b.score - a.score) // Higher score is better
    .map((item) => item.route);
}

/**
 * Filter routes to keep only those that make sense to display to users
 */
export function filterRoutes(
  routes: Route[],
  preferences: RoutePreferences
): Route[] {
  // Filter out invalid routes first
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  if (validRoutes.length <= MAX_ROUTES_TO_RETURN) {
    return validRoutes;
  }

  // Find the fastest route as a baseline
  const fastestRoute = validRoutes.reduce(
    (fastest, route) =>
      route.totalDuration < fastest.totalDuration ? route : fastest,
    validRoutes[0]
  );

  // Get the route with fewest transfers
  const minTransfersRoute = validRoutes.reduce((fewest, route) => {
    const fewestTransfers =
      route.segments.filter((s) => s.type === 'transit').length - 1;
    const currentTransfers =
      fewest.segments.filter((s) => s.type === 'transit').length - 1;
    return fewestTransfers < currentTransfers ? route : fewest;
  }, validRoutes[0]);

  // Get the most comfortable route
  const comfortScores = validRoutes.map((route) => ({
    route,
    comfort: calculateComfortScore(route, preferences),
  }));

  const mostComfortableRoute = comfortScores.reduce(
    (most, current) => (current.comfort > most.comfort ? current : most),
    comfortScores[0]
  ).route;

  // First, filter out routes that are significantly worse than the fastest route
  const durationThreshold = fastestRoute.totalDuration * 1.4;
  let filteredRoutes = validRoutes.filter(
    (route) => route.totalDuration <= durationThreshold
  );

  // Also filter out routes with excessive transfers compared to the min transfers route
  const transfersThreshold = Math.min(
    MAX_TRANSFERS,
    Math.max(
      2,
      minTransfersRoute.segments.filter((s) => s.type === 'transit').length + 1 // Allow 1 more transfer than the minimum
    )
  );

  filteredRoutes = filteredRoutes.filter(
    (route) =>
      route.segments.filter((s) => s.type === 'transit').length - 1 <=
      transfersThreshold
  );

  // Calculate preliminary scores to identify the best candidates
  const scoredRoutes = filteredRoutes.map((route) => {
    const score = calculateRouteScore(route, preferences, {
      minDuration: fastestRoute.totalDuration,
      maxDuration: durationThreshold,
      durationRange: durationThreshold - fastestRoute.totalDuration,
    });
    return { route, score };
  });

  // Ensure we always include these key routes
  const priorityRoutes = new Set([
    fastestRoute.totalDuration,
    minTransfersRoute.totalDuration,
    mostComfortableRoute.totalDuration,
  ]);

  const result: Route[] = [];

  // Add priority routes first
  filteredRoutes.forEach((route) => {
    if (
      priorityRoutes.has(route.totalDuration) &&
      result.length < MAX_ROUTES_TO_RETURN
    ) {
      result.push(route);
    }
  });

  // Fill remaining slots with highest scoring routes
  scoredRoutes
    .sort((a, b) => b.score - a.score)
    .forEach(({ route }) => {
      if (result.length < MAX_ROUTES_TO_RETURN && !result.includes(route)) {
        result.push(route);
      }
    });

  return result;
}

/**
 * Ensure the returned routes are meaningfully different from each other
 */
export function ensureRouteDiversity(routes: Route[]): Route[] {
  if (routes.length <= 1) return routes;

  const result: Route[] = [routes[0]]; // Always include the top-ranked route

  for (
    let i = 1;
    i < routes.length && result.length < MAX_ROUTES_TO_RETURN;
    i++
  ) {
    const candidate = routes[i];
    let isSignificantlyDifferent = true;

    // Compare with already selected routes
    for (const selectedRoute of result) {
      // Check if the routes share most of the same stations or lines
      const similarity = calculateRouteSimilarity(candidate, selectedRoute);

      if (similarity > 0.7) {
        isSignificantlyDifferent = false;
        break;
      }
    }

    if (isSignificantlyDifferent) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Calculate how similar two routes are (0-1 scale, higher means more similar)
 */
export function calculateRouteSimilarity(routeA: Route, routeB: Route): number {
  const transitSegmentsA = routeA.segments.filter((s) => s.type === 'transit');
  const transitSegmentsB = routeB.segments.filter((s) => s.type === 'transit');

  if (transitSegmentsA.length === 0 || transitSegmentsB.length === 0) {
    return 0;
  }

  const stationsA = new Set(
    transitSegmentsA.flatMap((s) => s.stations.map((station) => station.id))
  );

  const stationsB = new Set(
    transitSegmentsB.flatMap((s) => s.stations.map((station) => station.id))
  );

  const intersection = new Set(
    [...stationsA].filter((id) => stationsB.has(id))
  );
  const union = new Set([...stationsA, ...stationsB]);

  return intersection.size / union.size;
}
