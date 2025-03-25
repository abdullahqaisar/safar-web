import { v4 as uuidv4 } from 'uuid';
import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { calculateDistanceSync } from './distance';
import { EdgeData, NodeData } from '../journey/route/graph';
import { Route } from '@/types/route';
import { Coordinates } from '@/types/station';
import { metroLines } from '@/lib/constants/metro-data';
import { createWalkingSegment } from '../journey/segment/builder';
import { areSimilarPaths, extractEdgesFromPath } from './graph-utils';

export async function createDirectWalkingRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route | null> {
  const walkSegment = await createWalkingSegment(
    { id: 'origin', name: 'Origin', coordinates: origin },
    { id: 'destination', name: 'Destination', coordinates: destination },
    origin,
    destination
  );

  if (!walkSegment) return null;

  const { buildRoute } = await import('../journey/segment/calculator');
  const route = await buildRoute([walkSegment], 0, walkSegment.walkingDistance);

  return {
    ...route,
    id: `walk-${uuidv4()}`,
    isDirectWalk: true,
  };
}

export async function calculateStationDistances(
  origin: Coordinates,
  destination: Coordinates
): Promise<{
  originDistances: { stationId: string; distance: number }[];
  destinationDistances: { stationId: string; distance: number }[];
  minOriginDistance: number;
  minDestDistance: number;
  closestOriginStation: string;
  closestDestStation: string;
}> {
  const originDistances: { stationId: string; distance: number }[] = [];
  const destinationDistances: { stationId: string; distance: number }[] = [];

  let minOriginDistance = Infinity;
  let minDestDistance = Infinity;
  let closestOriginStation = '';
  let closestDestStation = '';

  const stationIds = new Set<string>();
  for (const line of metroLines) {
    for (const station of line.stations) {
      stationIds.add(station.id);
    }
  }

  for (const stationId of stationIds) {
    let stationCoords: Coordinates | null = null;
    for (const line of metroLines) {
      const station = line.stations.find((s) => s.id === stationId);
      if (station) {
        stationCoords = station.coordinates;
        break;
      }
    }

    if (stationCoords) {
      const originDistance = calculateDistanceSync(origin, stationCoords);
      const destDistance = calculateDistanceSync(destination, stationCoords);

      originDistances.push({ stationId, distance: originDistance });
      destinationDistances.push({ stationId, distance: destDistance });

      if (originDistance < minOriginDistance) {
        minOriginDistance = originDistance;
        closestOriginStation = stationId;
      }

      if (destDistance < minDestDistance) {
        minDestDistance = destDistance;
        closestDestStation = stationId;
      }
    }
  }

  originDistances.sort((a, b) => a.distance - b.distance);
  destinationDistances.sort((a, b) => a.distance - b.distance);

  return {
    originDistances,
    destinationDistances,
    minOriginDistance,
    minDestDistance,
    closestOriginStation,
    closestDestStation,
  };
}

export function determineWalkingThresholds(
  stationDistances: {
    originDistances: { stationId: string; distance: number }[];
    destinationDistances: { stationId: string; distance: number }[];
    minOriginDistance: number;
    minDestDistance: number;
  },
  directDistance: number,
  maxOriginWalkingDistance: number,
  maxDestinationWalkingDistance: number
): { origin: number; destination: number } {
  const {
    originDistances,
    destinationDistances,
    minOriginDistance,
    minDestDistance,
  } = stationDistances;

  const baseThreshold = Math.max(
    directDistance * 0.33,
    Math.max(minOriginDistance, minDestDistance) * 1.5,
    1000
  );

  const originDensity =
    originDistances.length >= 3
      ? originDistances[2].distance
      : minOriginDistance * 2;

  const destDensity =
    destinationDistances.length >= 3
      ? destinationDistances[2].distance
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
