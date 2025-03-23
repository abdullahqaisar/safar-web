import { dijkstra } from 'graphology-shortest-path';
import Graph from 'graphology';
import { v4 as uuidv4 } from 'uuid';

import { calculateDistanceSync } from '@/server/core/shared/distance';
import { EdgeData, NodeData, getTransitGraph } from './graph';
import { Coordinates, Station } from '@/types/station';
import { Route, RouteSegment } from '@/types/route';
import { buildRoute, calculateRouteTimes } from '../segment/calculator';
import {
  MAX_ROUTES_TO_GENERATE,
  MAX_WALKING_DISTANCE,
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import { DISTANCE_THRESHOLDS } from '@/lib/constants/route-config';
import { metroLines } from '@/lib/constants/metro-data';
import { createWalkingSegment } from '../segment/builder';
import {
  getEdgeCounts,
  extractEdgesFromPath,
  areSimilarPaths,
  penalizeCommonEdges,
} from '@/server/core/shared/graph';
import { MetroLine } from '@/types/metro';

export async function findRoutes(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  const routes: Route[] = [];

  const directDistance = calculateDistanceSync(origin, destination);

  if (directDistance <= MAX_WALKING_DISTANCE) {
    try {
      const walkingRoute = await createDirectWalkingRoute(origin, destination);
      if (walkingRoute) {
        routes.push(walkingRoute);
      }
    } catch (error) {
      console.error('Error creating direct walking route:', error);
    }
  }

  try {
    const transitRoutes = await findTransitRoutes(origin, destination);
    if (transitRoutes.length > 0) {
      routes.push(...transitRoutes);
    }
  } catch (error) {
    console.error('Error finding transit routes:', error);

    if (routes.length === 0) {
      throw error;
    }
  }

  return routes;
}

/**
 * Create a direct walking route between two points
 */
async function createDirectWalkingRoute(
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

  const route = await buildRoute([walkSegment], 0, walkSegment.walkingDistance);
  const { VERY_SHORT, MEDIUM_MIN, MEDIUM_MAX } = DISTANCE_THRESHOLDS;

  return {
    ...route,
    id: `walk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isDirectWalk: true,
    isShortWalk: walkSegment.walkingDistance < VERY_SHORT,
    isMediumWalk:
      walkSegment.walkingDistance >= MEDIUM_MIN &&
      walkSegment.walkingDistance <= MEDIUM_MAX,
    isLongWalk: walkSegment.walkingDistance > MEDIUM_MAX,
  };
}

async function findTransitRoutes(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  const directDistance = calculateDistanceSync(origin, destination);

  const stationDistances = await calculateStationDistances(origin, destination);

  const walkingThresholds = determineWalkingThresholds(
    stationDistances,
    directDistance
  );

  console.log(
    `Walking thresholds calculated: origin=${walkingThresholds.origin}m, destination=${walkingThresholds.destination}m`
  );

  const { graph, originId, destinationId } = getTransitGraph(
    origin,
    destination,
    walkingThresholds.origin,
    walkingThresholds.destination
  );

  const typedGraph = graph;

  const paths = findMultiplePaths(typedGraph, originId, destinationId);

  if (paths.length === 0) {
    return [];
  }

  const routes = await pathsToRoutes(paths, typedGraph);

  const routesWithTimes = await calculateRouteTimes(routes);

  return routesWithTimes.map((route) => ({
    ...route,
    id: `transit-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`,
  }));
}

async function calculateStationDistances(
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

function determineWalkingThresholds(
  stationDistances: {
    originDistances: { stationId: string; distance: number }[];
    destinationDistances: { stationId: string; distance: number }[];
    minOriginDistance: number;
    minDestDistance: number;
    closestOriginStation: string;
    closestDestStation: string;
  },
  directDistance: number
): { origin: number; destination: number } {
  let originThreshold = MAX_ORIGIN_WALKING_DISTANCE;
  let destinationThreshold = MAX_DESTINATION_WALKING_DISTANCE;

  const {
    originDistances,
    destinationDistances,
    minOriginDistance,
    minDestDistance,
  } = stationDistances;

  const baseThreshold = Math.max(
    directDistance * 0.33,

    Math.max(minOriginDistance, minDestDistance) * 1.5,

    // But never less than 1km to ensure connectivity in sparse areas
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

  originThreshold = Math.max(
    baseThreshold,
    Math.min(originDensity * 1.2, 3000)
  );

  destinationThreshold = Math.max(
    baseThreshold,
    Math.min(destDensity * 1.2, 3000)
  );

  const symmetricThreshold = Math.max(originThreshold, destinationThreshold);

  const isLongJourney = directDistance > 5000;
  if (isLongJourney) {
    return {
      origin: Math.min(symmetricThreshold * 1.2, MAX_ORIGIN_WALKING_DISTANCE),
      destination: Math.min(
        symmetricThreshold * 1.2,
        MAX_DESTINATION_WALKING_DISTANCE
      ),
    };
  }

  return {
    origin: symmetricThreshold,
    destination: symmetricThreshold,
  };
}

function findMultiplePaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string
): {
  path: string[];
  edges: Array<EdgeData & { source: string; target: string }>;
}[] {
  const paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[] = [];

  if (!graph.hasNode(originId) || !graph.hasNode(destinationId)) {
    console.error('Origin or destination node not found in graph');
    return [];
  }
  const strategies = [
    // Default strategy - balanced consideration of all factors
    { weight: (_edge: string, attributes: EdgeData) => attributes.duration },

    // Minimize transfers (heavily penalize transfer edges)
    {
      weight: (_edge: string, attributes: EdgeData) =>
        attributes.duration * (attributes.type === 'transfer' ? 5 : 1),
    },

    // Prefer transit over walking (penalize walking edges)
    {
      weight: (_edge: string, attributes: EdgeData) =>
        attributes.duration * (attributes.type === 'walking' ? 2 : 1),
    },

    // Direct walking path when possible
    {
      weight: (_edge: string, attributes: EdgeData) =>
        attributes.duration * (attributes.type === 'walking' ? 0.8 : 1.5),
    },
  ];

  for (const strategy of strategies) {
    try {
      const result = dijkstra.bidirectional(
        graph,
        originId,
        destinationId,
        strategy.weight
      );

      if (result && result.length > 0) {
        const edges: Array<EdgeData & { source: string; target: string }> = [];
        for (let i = 0; i < result.length - 1; i++) {
          const edgeKey = graph.edge(result[i], result[i + 1]);
          if (edgeKey) {
            const edgeData = graph.getEdgeAttributes(edgeKey);
            edges.push({
              source: result[i],
              target: result[i + 1],
              ...edgeData,
            });
          }
        }

        if (edges.length > 0) {
          paths.push({ path: result, edges });
        }
      }
    } catch (error) {
      console.error('Error finding path with strategy:', error);
    }
  }

  generateAlternativePaths(graph, originId, destinationId, paths);

  return paths.slice(0, MAX_ROUTES_TO_GENERATE);
}

function generateAlternativePaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  if (existingPaths.length === 0) return;

  const graphCopy = graph.copy();
  const edgeCounts = getEdgeCounts(existingPaths);
  const commonEdges = Array.from(edgeCounts.entries())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_key, count]) => count > 1)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([key, _count]) => key);

  if (commonEdges.length === 0) return;

  penalizeCommonEdges(graphCopy, commonEdges);
  findAlternativePath(graphCopy, originId, destinationId, existingPaths);
}

function findAlternativePath(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  try {
    const result = dijkstra.bidirectional(
      graph,
      originId,
      destinationId,
      (_edge: string, attributes: EdgeData) => attributes.duration
    );

    if (!result || result.length === 0) return;

    const edges = extractEdgesFromPath(graph, result);
    if (edges.length === 0) return;

    const isUnique = !existingPaths.some((existingPath) =>
      areSimilarPaths(result, existingPath.path)
    );

    if (isUnique) {
      existingPaths.push({ path: result, edges });
    }
  } catch (error) {
    console.error('Error finding alternative path:', error);
  }
}

async function pathsToRoutes(
  paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[],
  graph: Graph<NodeData, EdgeData>
): Promise<Route[]> {
  const { calculateRouteMetrics } = await import('../segment/calculator');
  const routes: Route[] = [];

  for (const { path, edges } of paths) {
    try {
      const segments = await convertPathToSegments(path, edges, graph);
      if (segments.length === 0) continue;

      const metrics = calculateRouteMetrics(segments);

      if (metrics.totalDuration > 0) {
        const route = await buildRoute(
          segments,
          metrics.totalStops,
          metrics.totalDistance
        );
        route.id = uuidv4();
        routes.push(route);
      }
    } catch (error) {
      console.error('Error converting path to route:', error);
    }
  }

  return routes;
}

async function convertPathToSegments(
  path: string[],
  edges: Array<EdgeData & { source: string; target: string }>,
  graph: Graph<NodeData, EdgeData>
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];

  const {
    createTransitSegment,
    createWalkingSegment,
    getLineById,
    consolidateWalkingSegments,
  } = await import('../segment/builder');

  let currentTransitLine: string | null = null;
  let currentTransitStations: Station[] = [];

  function extractLineId(nodeId: string): string | null {
    return nodeId.includes('_') ? nodeId.split('_')[1] : null;
  }

  // Helper function to find all stations between two stations on a metro line
  function findStationsBetween(
    line: MetroLine,
    sourceId: string,
    targetId: string
  ): Station[] {
    const stations = line.stations;
    const sourceIndex = stations.findIndex((s) => s.id === sourceId);
    const targetIndex = stations.findIndex((s) => s.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return [];

    // Handle both directions (forward and backward)
    if (sourceIndex < targetIndex) {
      return stations.slice(sourceIndex, targetIndex + 1);
    } else {
      return stations.slice(targetIndex, sourceIndex + 1).reverse();
    }
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;

    const sourceNodeData = graph.getNodeAttributes(edge.source);
    const targetNodeData = graph.getNodeAttributes(edge.target);

    if (!sourceNodeData || !targetNodeData) continue;

    const sourceStation = sourceNodeData.station;
    const targetStation = targetNodeData.station;
    if (!sourceStation || !targetStation) continue;

    const isIntraStationTransfer =
      edge.type === 'transfer' &&
      sourceStation.id === targetStation.id &&
      edge.source.includes('_') &&
      edge.target.includes('_');

    const sourceLineId = extractLineId(edge.source);
    const targetLineId = extractLineId(edge.target);
    const lineId = edge.lineId || sourceLineId || targetLineId;

    if (isIntraStationTransfer) {
      if (currentTransitLine !== null && currentTransitStations.length > 1) {
        const line = getLineById(currentTransitLine);
        if (line) {
          const transitSegment = await createTransitSegment(line, [
            ...currentTransitStations,
          ]);
          if (transitSegment) segments.push(transitSegment);
        }

        currentTransitLine = null;
        currentTransitStations = [];
      }
      continue;
    }

    if (edge.type === 'transit') {
      if (currentTransitLine !== lineId) {
        // Process previous transit segment if it exists
        if (currentTransitLine !== null && currentTransitStations.length > 1) {
          const line = getLineById(currentTransitLine);
          if (line) {
            const transitSegment = await createTransitSegment(line, [
              ...currentTransitStations,
            ]);
            if (transitSegment) segments.push(transitSegment);
          }
        }

        // Start a new transit segment
        currentTransitLine = lineId;
        currentTransitStations = [sourceStation];
      }

      // Add intermediate stations if we're continuing on the same line
      if (currentTransitLine) {
        const line = getLineById(currentTransitLine);
        if (line) {
          // Get all stations between source and target on this line
          const intermediateStations = findStationsBetween(
            line,
            sourceStation.id,
            targetStation.id
          );

          // Skip first station if we already have stations in our current segment
          // to avoid duplicates
          const stationsToAdd =
            currentTransitStations.length > 0
              ? intermediateStations.slice(1)
              : intermediateStations;

          // Add all stations that aren't already in our list
          for (const station of stationsToAdd) {
            if (!currentTransitStations.some((s) => s.id === station.id)) {
              currentTransitStations.push(station);
            }
          }
        } else {
          // If we can't find the line, fall back to just adding the target
          if (!currentTransitStations.some((s) => s.id === targetStation.id)) {
            currentTransitStations.push(targetStation);
          }
        }
      }
    } else if (
      edge.type === 'walking' ||
      (edge.type === 'transfer' && sourceStation.id !== targetStation.id)
    ) {
      if (currentTransitLine !== null && currentTransitStations.length > 1) {
        const line = getLineById(currentTransitLine);
        if (line) {
          const transitSegment = await createTransitSegment(line, [
            ...currentTransitStations,
          ]);
          if (transitSegment) segments.push(transitSegment);
        }

        currentTransitLine = null;
        currentTransitStations = [];
      }

      const walkSegment = await createWalkingSegment(
        sourceStation,
        targetStation,
        sourceStation.coordinates,
        targetStation.coordinates
      );

      if (walkSegment) segments.push(walkSegment);
    }
  }

  if (currentTransitLine !== null && currentTransitStations.length > 1) {
    const line = getLineById(currentTransitLine);
    if (line) {
      const transitSegment = await createTransitSegment(line, [
        ...currentTransitStations,
      ]);
      if (transitSegment) segments.push(transitSegment);
    }
  }

  return consolidateWalkingSegments(
    segments.filter((segment) => segment.duration > 0)
  );
}
