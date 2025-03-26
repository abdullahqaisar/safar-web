import { Route, TransitSegment, WalkSegment } from '@/types/route';
import { SIMILARITY_WEIGHTS } from '@/lib/constants/route-config';
import { extractLineIdsFromRoute, calculateLineSimilarity } from './line-utils';

export function findFastestRoute(routes: Route[]): Route {
  return routes.reduce(
    (fastest, route) =>
      route.totalDuration < fastest.totalDuration ? route : fastest,
    routes[0]
  );
}

export function findMinTransfersRoute(routes: Route[]): Route {
  return routes.reduce(
    (fewest, route) =>
      countTransfers(route) < countTransfers(fewest) ? route : fewest,
    routes[0]
  );
}

export function countTransfers(route: Route): number {
  return route.transfers || 0;
}

export function findTransitRoute(routes: Route[]): Route | undefined {
  return routes.find((route) =>
    route.segments.some((s) => s.type === 'transit')
  );
}

export function calculateRouteSimilarity(routeA: Route, routeB: Route): number {
  // Use our centralized line extraction utility
  const linesA = extractLineIdsFromRoute(routeA);
  const linesB = extractLineIdsFromRoute(routeB);

  if (linesA.size === 0 || linesB.size === 0) {
    if (linesA.size === 0 && linesB.size === 0) {
      return 0.8; // Both are walking-only routes
    }
    return 0.0;
  }

  // Use our line similarity calculation
  const lineSimilarity = calculateLineSimilarity(linesA, linesB);

  const transitSegmentsA = routeA.segments.filter(
    (s): s is TransitSegment => s.type === 'transit'
  );
  const transitSegmentsB = routeB.segments.filter(
    (s): s is TransitSegment => s.type === 'transit'
  );

  if (transitSegmentsA.length === 0 || transitSegmentsB.length === 0) {
    return 0;
  }

  const getKeyStations = (segments: TransitSegment[]): string[] => {
    const stations: string[] = [];
    segments.forEach((segment) => {
      if (segment.stations.length > 0) {
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

  const segmentCountSimilarity =
    1 -
    Math.abs(transitSegmentsA.length - transitSegmentsB.length) /
      Math.max(transitSegmentsA.length, transitSegmentsB.length, 1);

  // Use the calculated lineSimilarity with existing weights
  return (
    lineSimilarity * SIMILARITY_WEIGHTS.LINE +
    keySimilarity * SIMILARITY_WEIGHTS.KEY_STATION +
    segmentCountSimilarity * SIMILARITY_WEIGHTS.SEGMENT_COUNT
  );
}

export function handleWalkingTransitFiltering(routes: Route[]): Route[] {
  const hasTransitRoutes = routes.some((route) =>
    route.segments.some((segment) => segment.type === 'transit')
  );

  const routesWithWalkingDistance = routes.map((route) => {
    const totalWalking = route.segments
      .filter((segment) => segment.type === 'walk')
      .reduce(
        (sum, segment) => sum + (segment as WalkSegment).walkingDistance,
        0
      );

    return { route, totalWalking };
  });

  if (hasTransitRoutes) {
    const viableTransitRoutes = routesWithWalkingDistance.filter((r) =>
      r.route.segments.some((segment) => segment.type === 'transit')
    );

    if (viableTransitRoutes.length > 0) {
      return routesWithWalkingDistance
        .filter((item) => {
          const isLongWalkOnly =
            !item.route.segments.some(
              (segment) => segment.type === 'transit'
            ) && item.totalWalking > 2000;

          if (isLongWalkOnly) {
            return !viableTransitRoutes.some(
              (tr) => tr.route.totalDuration <= item.route.totalDuration * 1.8
            );
          }
          return true;
        })
        .map((item) => item.route);
    }
  }

  return routes;
}

export function getFallbackRoutes(
  routes: Route[],
  fastestRoute: Route
): Route[] {
  if (routes.length > 0) {
    if (fastestRoute) {
      return [fastestRoute];
    }

    const transitRoute = findTransitRoute(routes);
    if (transitRoute) {
      return [transitRoute];
    }

    return [routes[0]];
  }
  return [];
}

export function ensurePriorityRoutes(
  filtered: Route[],
  fastestRoute: Route,
  minTransfersRoute: Route,
  mostComfortableRoute: Route
): Route[] {
  const priorityRouteIds = new Set([
    fastestRoute.id || '',
    minTransfersRoute.id || '',
    mostComfortableRoute.id || '',
  ]);

  const result: Route[] = [];

  filtered.forEach((route) => {
    if (route.id && priorityRouteIds.has(route.id)) {
      result.push(route);
    }
  });

  filtered.forEach((route) => {
    if (!route.id || !priorityRouteIds.has(route.id)) {
      result.push(route);
    }
  });

  return result;
}
