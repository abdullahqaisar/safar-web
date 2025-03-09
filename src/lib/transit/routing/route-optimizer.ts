import { Route, TransitSegment } from '@/types/route';
import { calculateComfortScore, calculateRouteScore } from './route-scorer';
import { MAX_TRANSFERS, MAX_ROUTES_TO_RETURN } from '@/lib/constants/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Combined function to filter, rank and ensure diversity in routes
 */
export function filterAndRankRoutes(routes: Route[]): Route[] {
  // Filter out invalid routes
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  // Early return if no valid routes exist
  if (validRoutes.length === 0) {
    return [];
  }

  // Ensure all routes have an ID
  validRoutes.forEach((route) => {
    if (!route.id) {
      route.id = uuidv4();
    }
  });

  const filteredRoutes = filterRoutesByQuality(validRoutes);
  const rankedRoutes = rankRoutes(filteredRoutes);
  return ensureRouteDiversity(rankedRoutes);
}

/**
 * Filter routes to keep only those that meet quality thresholds
 */
function filterRoutesByQuality(routes: Route[]): Route[] {
  // Find the fastest route as a baseline
  const fastestRoute = routes.reduce(
    (fastest, route) =>
      route.totalDuration < fastest.totalDuration ? route : fastest,
    routes[0]
  );

  // Consistent way to count transfers
  const countTransfers = (route: Route): number => route.transfers || 0;

  // Get the route with fewest transfers
  const minTransfersRoute = routes.reduce(
    (fewest, route) =>
      countTransfers(route) < countTransfers(fewest) ? route : fewest,
    routes[0]
  );

  const comfortScores = routes.map((route) => ({
    route,
    comfort: calculateComfortScore(route),
  }));

  const mostComfortableRoute = comfortScores.reduce(
    (most, current) => (current.comfort > most.comfort ? current : most),
    comfortScores[0]
  ).route;

  const durationMultiplier = 1.4; // Balanced

  const durationThreshold = fastestRoute.totalDuration * durationMultiplier;
  let filtered = routes.filter(
    (route) => route.totalDuration <= durationThreshold
  );

  const minTransfers = countTransfers(minTransfersRoute);
  const transfersThreshold = Math.min(
    MAX_TRANSFERS,
    minTransfers + (minTransfers < 2 ? 2 : 1) // Allow more extra transfers if the minimum is low
  );

  filtered = filtered.filter(
    (route) => countTransfers(route) <= transfersThreshold
  );

  // Early return if filtering removed all routes
  if (filtered.length === 0) {
    return [fastestRoute]; // Fall back to the fastest route if all got filtered out
  }

  // Ensure we always include these key routes
  const priorityRouteIds = new Set([
    fastestRoute.id || '',
    minTransfersRoute.id || '',
    mostComfortableRoute.id || '',
  ]);

  const result: Route[] = [];

  // Add priority routes first
  filtered.forEach((route) => {
    if (route.id && priorityRouteIds.has(route.id)) {
      result.push(route);
    }
  });

  // Fill with other routes
  filtered.forEach((route) => {
    if (!route.id || !priorityRouteIds.has(route.id)) {
      result.push(route);
    }
  });

  return result;
}

/**
 * Ranks routes using a weighted scoring system
 */
function rankRoutes(routes: Route[]): Route[] {
  // Filter out invalid routes
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  // Early return if no valid routes exist
  if (validRoutes.length === 0) {
    return [];
  }

  // Calculate scores and sort
  return validRoutes
    .map((route) => {
      const score = calculateRouteScore(route);
      return { route, score };
    })
    .sort((a, b) => b.score - a.score) // Higher score is better
    .map((item) => item.route);
}

/**
 * Ensure the returned routes are meaningfully different from each other
 */
function ensureRouteDiversity(routes: Route[]): Route[] {
  // Early return if no routes exist or just one route
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
      // Use improved similarity metric
      const similarity = calculateRouteSimilarity(candidate, selectedRoute);

      // Lower threshold to 0.5 for more diversity like Citymapper
      if (similarity > 0.5) {
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
 * Calculate how similar two routes are with an improved algorithm
 * (0-1 scale, higher means more similar)
 */
function calculateRouteSimilarity(routeA: Route, routeB: Route): number {
  // Extract transit line IDs used in each route
  const getLineIds = (route: Route): Set<string> => {
    return new Set(
      route.segments
        .filter((s) => s.type === 'transit')
        .map((s) => (s as TransitSegment).line?.id)
        .filter((id): id is string => id !== undefined)
    );
  };

  const linesA = getLineIds(routeA);
  const linesB = getLineIds(routeB);

  // No transit lines means totally different routes (likely all walking)
  if (linesA.size === 0 || linesB.size === 0) {
    // If both are walking-only routes, consider them similar
    if (linesA.size === 0 && linesB.size === 0) {
      return 0.8;
    }
    // One has transit, one doesn't - they're different
    return 0.0;
  }

  // Calculate Jaccard similarity for lines
  const lineIntersection = new Set([...linesA].filter((id) => linesB.has(id)));
  const lineUnion = new Set([...linesA, ...linesB]);
  const lineSimilarity = lineIntersection.size / (lineUnion.size || 1);

  // Also consider station sequence similarity for more accuracy
  const transitSegmentsA = routeA.segments.filter(
    (s): s is TransitSegment => s.type === 'transit'
  );
  const transitSegmentsB = routeB.segments.filter(
    (s): s is TransitSegment => s.type === 'transit'
  );

  if (transitSegmentsA.length === 0 || transitSegmentsB.length === 0) {
    return 0;
  }

  // Extract key stations (first, last and interchange stations) for each route
  const getKeyStations = (segments: TransitSegment[]): string[] => {
    const stations: string[] = [];

    segments.forEach((segment) => {
      if (segment.stations.length > 0) {
        // Always include first and last stations
        stations.push(segment.stations[0].id);
        stations.push(segment.stations[segment.stations.length - 1].id);
      }
    });

    return stations;
  };

  const keyStationsA = getKeyStations(transitSegmentsA);
  const keyStationsB = getKeyStations(transitSegmentsB);

  const stationIntersection = new Set(
    keyStationsA.filter((id) => keyStationsB.includes(id))
  );
  const stationUnion = new Set([...keyStationsA, ...keyStationsB]);

  const keySimilarity = stationIntersection.size / (stationUnion.size || 1);

  // Calculate ride segment count similarity
  const segmentCountSimilarity =
    1 -
    Math.abs(transitSegmentsA.length - transitSegmentsB.length) /
      Math.max(transitSegmentsA.length, transitSegmentsB.length, 1);

  // Weighted combination with more emphasis on line and key station similarity
  return (
    lineSimilarity * 0.5 + keySimilarity * 0.3 + segmentCountSimilarity * 0.2
  );
}
