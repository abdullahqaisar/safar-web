import { v4 as uuidv4 } from 'uuid';
import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { calculateDistanceSync } from './distance';
import { EdgeData, NodeData } from '../journey/route/graph';
import { Route } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { createWalkingSegment } from '../journey/segment/builder';
import { areSimilarPaths, extractEdgesFromPath } from './graph-utils';
import { stationManager } from '../journey/station/station';

export async function createDirectWalkingRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route | null> {
  try {
    const originStation: Station = {
      id: 'origin',
      name: 'Origin',
      coordinates: origin,
    };

    const destinationStation: Station = {
      id: 'destination',
      name: 'Destination',
      coordinates: destination,
    };

    const walkSegment = await createWalkingSegment(
      originStation,
      destinationStation,
      origin,
      destination
    );

    if (!walkSegment) return null;

    const { buildRoute } = await import('../journey/segment/calculator');
    const route = await buildRoute(
      [walkSegment],
      0,
      walkSegment.walkingDistance
    );

    return {
      ...route,
      id: `walk-${uuidv4()}`,
      isDirectWalk: true,
      directDistance: calculateDistanceSync(origin, destination),
    };
  } catch (error) {
    console.error('Error creating direct walking route:', error);
    return null;
  }
}

export function determineWalkingThresholds(
  origin: Coordinates,
  destination: Coordinates,
  maxOriginWalkingDistance: number,
  maxDestinationWalkingDistance: number
): { origin: number; destination: number } {
  // Get station distances
  const stationDistances = stationManager.findStationDistances(
    origin,
    destination
  );
  const directDistance = calculateDistanceSync(origin, destination);

  const minOriginDistance = stationDistances.originDistances[0]?.distance || 0;
  const minDestDistance =
    stationDistances.destinationDistances[0]?.distance || 0;

  const baseThreshold = Math.max(
    directDistance * 0.33,
    Math.max(minOriginDistance, minDestDistance) * 1.5,
    1000
  );

  const originDensity =
    stationDistances.originDistances.length >= 3
      ? stationDistances.originDistances[2].distance
      : minOriginDistance * 2;

  const destDensity =
    stationDistances.destinationDistances.length >= 3
      ? stationDistances.destinationDistances[2].distance
      : minDestDistance * 2;

  const originThreshold = Math.max(
    baseThreshold,
    Math.min(originDensity * 1.2, 3000)
  );

  const destinationThreshold = Math.max(
    baseThreshold,
    Math.min(destDensity * 1.2, 3000)
  );

  const symmetricThreshold = Math.max(originThreshold, destinationThreshold);

  const isLongJourney = directDistance > 5000;
  if (isLongJourney) {
    return {
      origin: Math.min(symmetricThreshold * 1.2, maxOriginWalkingDistance),
      destination: Math.min(
        symmetricThreshold * 1.2,
        maxDestinationWalkingDistance
      ),
    };
  }

  return {
    origin: symmetricThreshold,
    destination: symmetricThreshold,
  };
}

export function findAlternativePathWithTimeout(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[],
  similarityThreshold: number = 0.6
): void {
  const timeout = setTimeout(() => {
    console.warn('Path finding operation timed out');
  }, 2000);

  try {
    const result = dijkstra.bidirectional(
      graph,
      originId,
      destinationId,
      (_edge: string, attributes: EdgeData) => attributes.duration
    );

    clearTimeout(timeout);

    if (!result || result.length === 0) return;

    const edges = extractEdgesFromPath(graph, result);
    if (edges.length === 0) return;

    const isUnique = !existingPaths.some((existingPath) =>
      areSimilarPaths(result, existingPath.path, similarityThreshold)
    );

    if (isUnique) {
      existingPaths.push({ path: result, edges });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error('Error finding alternative path:', error);
  }
}

export async function filterRoutesByLineUniqueness(
  routes: Route[]
): Promise<Route[]> {
  if (routes.length <= 1) return routes;

  const routesByLines = new Map<string, Route[]>();

  for (const route of routes) {
    const transitLines = new Set<string>();

    for (const segment of route.segments) {
      if (segment.type === 'transit' && 'line' in segment && segment.line?.id) {
        transitLines.add(segment.line.id);
      }
    }

    const lineKey = Array.from(transitLines).sort().join(',');

    if (!routesByLines.has(lineKey)) {
      routesByLines.set(lineKey, []);
    }

    routesByLines.get(lineKey)?.push(route);
  }

  const uniqueRoutes: Route[] = [];

  for (const routesWithSameLines of routesByLines.values()) {
    if (routesWithSameLines.length > 0) {
      routesWithSameLines.sort((a, b) => a.totalDuration - b.totalDuration);
      uniqueRoutes.push(routesWithSameLines[0]);
    }
  }

  return uniqueRoutes;
}
