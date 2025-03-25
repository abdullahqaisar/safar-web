import { dijkstra } from 'graphology-shortest-path';
import Graph from 'graphology';
import { v4 as uuidv4 } from 'uuid';

import { calculateDistanceSync } from '@/server/core/shared/distance';
import {
  EdgeData,
  NodeData,
  getTransitGraph,
  connectAccessPoints,
} from './graph';
import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import {
  MAX_ROUTES_TO_GENERATE,
  MAX_WALKING_DISTANCE,
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import { PATH_STRATEGIES } from './path-strategies';
import {
  extractEdgesFromPath,
  areSimilarPaths,
} from '@/server/core/shared/graph-utils';
import {
  createDirectWalkingRoute,
  calculateStationDistances,
  determineWalkingThresholds,
  filterRoutesByLineUniqueness,
} from '@/server/core/shared/route-utils';
import {
  buildRoute,
  calculateRouteMetrics,
  calculateRouteTimes,
} from '../segment/calculator';
import {
  generateAggressiveAlternativePaths,
  forceLineDiversityPaths,
  findMajorLineCombinationPaths,
} from './path-diversity';
import { convertPathToSegments } from './segment-converter';

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

async function findTransitRoutes(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  const directDistance = calculateDistanceSync(origin, destination);
  const stationDistances = await calculateStationDistances(origin, destination);

  const walkingThresholds = determineWalkingThresholds(
    stationDistances,
    directDistance,
    MAX_ORIGIN_WALKING_DISTANCE,
    MAX_DESTINATION_WALKING_DISTANCE
  );

  // Phase 1: Get transit-only graph (without origin/destination)
  const {
    graph: transitGraph,
    nearestOriginStations,
    nearestDestStations,
  } = getTransitGraph(
    origin,
    destination,
    walkingThresholds.origin,
    walkingThresholds.destination,
    false // exclude access points
  );

  // If we don't have nearby stations, use legacy approach
  if (!nearestOriginStations?.length || !nearestDestStations?.length) {
    console.log('No nearby stations found, using legacy approach');
    const legacyGraph = getTransitGraph(
      origin,
      destination,
      walkingThresholds.origin * 1.5,
      walkingThresholds.destination * 1.5
    );
    return findLegacyRoutes(
      legacyGraph.graph,
      legacyGraph.originId,
      legacyGraph.destinationId,
      directDistance
    );
  }

  // Find transit-only paths between nearby stations
  const transitPaths = findTransitOnlyPaths(
    transitGraph,
    nearestOriginStations,
    nearestDestStations
  );

  if (transitPaths.length === 0) {
    console.log('No transit paths found, using legacy approach');
    const legacyGraph = getTransitGraph(
      origin,
      destination,
      walkingThresholds.origin,
      walkingThresholds.destination
    );
    return findLegacyRoutes(
      legacyGraph.graph,
      legacyGraph.originId,
      legacyGraph.destinationId,
      directDistance
    );
  }

  // Phase 2: Connect origin/destination to transit paths
  const routes: Route[] = [];

  for (const path of transitPaths) {
    // Connect origin/destination to this transit path
    const {
      graph: accessGraph,
      originId,
      destinationId,
    } = connectAccessPoints(
      transitGraph,
      origin,
      destination,
      path.path,
      walkingThresholds.origin,
      walkingThresholds.destination
    );

    // Find complete path including access points
    try {
      const completePath = dijkstra.bidirectional(
        accessGraph,
        originId,
        destinationId,
        (_edge: string, attributes: EdgeData) => attributes.duration
      );

      if (completePath && completePath.length > 0) {
        const edges = extractEdgesFromPath(accessGraph, completePath);
        if (edges.length > 0) {
          // Convert to route
          const segments = await convertPathToSegments(
            completePath,
            edges,
            accessGraph
          );
          if (segments.length > 0) {
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
          }
        }
      }
    } catch (error) {
      console.error('Error finding complete path:', error);
    }
  }

  // If we couldn't create any routes, fall back to legacy approach
  if (routes.length === 0) {
    console.log('No routes created, using legacy approach');
    const legacyGraph = getTransitGraph(
      origin,
      destination,
      walkingThresholds.origin,
      walkingThresholds.destination
    );
    return findLegacyRoutes(
      legacyGraph.graph,
      legacyGraph.originId,
      legacyGraph.destinationId,
      directDistance
    );
  }

  // Process routes and add direct distance
  const routesWithTimes = await calculateRouteTimes(routes);
  return routesWithTimes.map((route) => ({
    ...route,
    id: `transit-${uuidv4()}`,
    directDistance,
  }));
}

/**
 * Find transit-only paths between nearby stations of origin and destination
 */
function findTransitOnlyPaths(
  graph: Graph<NodeData, EdgeData>,
  originStations: { id: string; distance: number }[],
  destStations: { id: string; distance: number }[]
): {
  path: string[];
  edges: Array<EdgeData & { source: string; target: string }>;
}[] {
  const paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[] = [];

  // Try paths between each pair of nearby stations
  for (const originStation of originStations) {
    for (const destStation of destStations) {
      if (originStation.id === destStation.id) continue;

      try {
        // Find path using various strategies
        for (const strategy of PATH_STRATEGIES) {
          const path = dijkstra.bidirectional(
            graph,
            originStation.id,
            destStation.id,
            strategy.weight
          );

          if (path && path.length > 0) {
            const edges = extractEdgesFromPath(graph, path);

            if (edges.length > 0) {
              const isSignificantlyDifferent = !paths.some((existingPath) =>
                areSimilarPaths(path, existingPath.path, 0.7)
              );

              if (isSignificantlyDifferent) {
                paths.push({ path, edges });
              }
            }
          }
        }
      } catch (error) {
        // Continue to next pair if this one fails
      }
    }
  }

  // Apply diversity strategies to generate more paths
  for (const origin of originStations.slice(0, 2)) {
    for (const dest of destStations.slice(0, 2)) {
      try {
        generateAggressiveAlternativePaths(graph, origin.id, dest.id, paths);
        forceLineDiversityPaths(graph, origin.id, dest.id, paths);
      } catch (error) {
        // Continue if strategies fail
      }
    }
  }

  return paths.length <= 3 ? paths : paths.slice(0, MAX_ROUTES_TO_GENERATE);
}

/**
 * Legacy approach for finding routes (preserved for backward compatibility)
 */
async function findLegacyRoutes(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  directDistance: number
): Promise<Route[]> {
  const paths = findMultiplePaths(graph, originId, destinationId);

  if (paths.length === 0) {
    console.warn('No paths found between origin and destination');
    return [];
  }

  const validPaths = paths.filter(
    (path) =>
      path.path.includes(originId) &&
      path.path.includes(destinationId) &&
      path.edges.length > 0
  );

  const routes = await pathsToRoutes(validPaths, graph);
  const routesWithTimes = await calculateRouteTimes(routes);

  return routesWithTimes.map((route) => ({
    ...route,
    id: `transit-${uuidv4()}`,
    directDistance,
  }));
}

function findMultiplePaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string
): {
  path: string[];
  edges: Array<EdgeData & { source: string; target: string }>;
}[] {
  // Legacy implementation (simplified)
  const paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[] = [];

  if (!graph.hasNode(originId) || !graph.hasNode(destinationId)) {
    return [];
  }

  try {
    // Find initial path
    const initialResult = dijkstra.bidirectional(
      graph,
      originId,
      destinationId,
      (_edge: string, attributes: EdgeData) => attributes.duration
    );

    if (initialResult && initialResult.length > 0) {
      const edges = extractEdgesFromPath(graph, initialResult);
      if (edges.length > 0) {
        paths.push({ path: initialResult, edges });
      }
    }

    // Apply different strategies for diversity
    for (const strategy of PATH_STRATEGIES) {
      const result = dijkstra.bidirectional(
        graph,
        originId,
        destinationId,
        strategy.weight
      );

      if (result && result.length > 0) {
        const edges = extractEdgesFromPath(graph, result);
        if (
          edges.length > 0 &&
          !paths.some((p) => areSimilarPaths(result, p.path, 0.7))
        ) {
          paths.push({ path: result, edges });
        }
      }
    }

    // Generate additional alternatives
    generateAggressiveAlternativePaths(graph, originId, destinationId, paths);
    forceLineDiversityPaths(graph, originId, destinationId, paths);
    findMajorLineCombinationPaths(graph, originId, destinationId, paths);
  } catch (error) {
    console.error('Error finding paths:', error);
  }

  return paths.length <= 3 ? paths : paths.slice(0, MAX_ROUTES_TO_GENERATE);
}

async function pathsToRoutes(
  paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[],
  graph: Graph<NodeData, EdgeData>
): Promise<Route[]> {
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

  return filterRoutesByLineUniqueness(routes);
}
