import { Route, TransitRouteSegment } from '../types/route';

/**
 * Creates a unique signature representing the sequence of transit lines used in the route
 * Example: "blue->green" for a route using Blue Line then Green Line
 */
export function getLinePathSignature(route: Route): string {
  // Extract only transit segments
  const transitSegments = route.segments.filter(
    (segment): segment is TransitRouteSegment => segment.type === 'transit'
  );

  // Extract line IDs and create signature
  const lineIds = transitSegments.map((segment) => segment.line.id);

  // Return unique line path signature
  return lineIds.join('->');
}

/**
 * Identifies the best route from a group of routes with the same line path
 * Uses a scoring system based on transfer quality and overall duration
 */
export function selectBestRouteWithSamePath(routes: Route[]): Route {
  if (routes.length <= 1) return routes[0];

  return routes.reduce((best, current) => {
    // Simple scoring: fewer transfers and shorter duration is better
    const currentScore = current.totalDuration + current.transfers * 180;
    const bestScore = best.totalDuration + best.transfers * 180;

    return currentScore < bestScore ? current : best;
  });
}

/**
 * Groups routes by their line path signature
 */
export function groupRoutesByPath(routes: Route[]): Record<string, Route[]> {
  const routeGroups: Record<string, Route[]> = {};

  routes.forEach((route) => {
    const signature = getLinePathSignature(route);

    if (!routeGroups[signature]) {
      routeGroups[signature] = [];
    }

    routeGroups[signature].push(route);
  });

  return routeGroups;
}

/**
 * Consolidates routes with the same line path to the best option
 */
export function consolidateRoutesByPath(routes: Route[]): Route[] {
  const routeGroups = groupRoutesByPath(routes);

  return Object.values(routeGroups).map((group) =>
    selectBestRouteWithSamePath(group)
  );
}
