/* eslint-disable @typescript-eslint/no-unused-vars */
import { dijkstra } from 'graphology-shortest-path';
import Graph from 'graphology';
import { v4 as uuidv4 } from 'uuid';

import { calculateHaversineDistance } from '@/lib/utils/geo';
import { EdgeData, NodeData, getTransitGraph } from './graph-builder';
import { Coordinates, Station } from '@/types/station';
import {
  Route,
  RouteSegment,
  TransitSegment,
  WalkSegment,
} from '@/types/route';
import { filterAndRankRoutes } from './route-optimizer';
import {
  buildRoute,
  calculateRouteTimes,
} from '../segments/segment-calculator';
import {
  MAX_ROUTES_TO_GENERATE,
  MAX_WALKING_DISTANCE,
  WALKING_SPEED_MPS,
} from '@/lib/constants/config';
import { metroLines } from '@/lib/constants/metro-data';
import { createWalkingSegment } from '../segments/segment-builder';

/**
 * Main function to find all possible routes between two points
 * Now handles both direct walking routes and transit routes
 */
export async function findRoutes(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  const routes: Route[] = [];

  // Calculate direct distance between origin and destination
  const directDistance = calculateHaversineDistance(origin, destination);

  // Create distance classification flags
  const isVeryShortDistance = directDistance < 500;
  const isMediumDistance = directDistance >= 500 && directDistance <= 2000;
  const isLongDistance = directDistance > 2000;

  // Step 1: Always generate direct walking route if within max walking distance
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

  // Step 2: Find transit routes
  try {
    const transitRoutes = await findTransitRoutes(origin, destination);
    if (transitRoutes.length > 0) {
      routes.push(...transitRoutes);
    }
  } catch (error) {
    console.error('Error finding transit routes:', error);
    // If we have at least a walking route, continue
    if (routes.length === 0) {
      throw error; // Re-throw if we don't have any routes
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

  return {
    ...route,
    id: `walk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isDirectWalk: true,
    // Add classification flags
    isShortWalk: walkSegment.walkingDistance < 500,
    isMediumWalk:
      walkSegment.walkingDistance >= 500 && walkSegment.walkingDistance <= 1500,
    isLongWalk: walkSegment.walkingDistance > 1500,
  };
}

/**
 * Find transit routes between two points using the transit graph
 */
async function findTransitRoutes(
  origin: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  // Use enhanced walking distance for connections to ensure proper graph connectivity
  const connectingWalkDistance = Math.max(MAX_WALKING_DISTANCE, 2500);

  const { graph, originId, destinationId } = getTransitGraph(
    origin,
    destination,
    connectingWalkDistance
  );

  // Explicitly cast the graph to correct type
  const typedGraph = graph as unknown as Graph<NodeData, EdgeData>;

  // Find multiple paths through the graph
  const paths = findMultiplePaths(typedGraph, originId, destinationId);

  // If no paths found through the graph, return empty array
  if (paths.length === 0) {
    return [];
  }

  // Convert paths to route segments
  const routes = await pathsToRoutes(paths, typedGraph);

  // Calculate accurate timings for each route
  const routesWithTimes = await calculateRouteTimes(routes);

  // Assign IDs to routes
  return routesWithTimes.map((route) => ({
    ...route,
    id: `transit-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
  }));
}

/**
 * Find multiple paths through the graph using different strategies
 */
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

  // Add safety check to ensure origin and destination exist in the graph
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

  // Try each strategy to find diverse paths
  for (const strategy of strategies) {
    try {
      // Fixed: Use proper MinimalEdgeMapper signature (edge ID + attributes)
      const result = dijkstra.bidirectional(
        graph,
        originId,
        destinationId,
        strategy.weight
      );

      // Only include the path if it was found
      if (result && result.length > 0) {
        // Get edges for this path
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

  // Generate additional paths with variations
  generateAlternativePaths(graph, originId, destinationId, paths);

  return paths;
}

/**
 * Generate alternative paths by temporarily modifying the graph
 */
function generateAlternativePaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  const graphCopy = graph.copy();

  // If we already have some paths, try to find alternatives
  if (existingPaths.length > 0) {
    // Get frequently used edges from existing paths
    const edgeCounts = new Map<string, number>();

    existingPaths.forEach(({ edges }) => {
      edges.forEach((edge) => {
        if (edge.type === 'transit' && edge.lineId) {
          const key = `${edge.source}-${edge.target}-${edge.lineId}`;
          edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
        }
      });
    });

    // Find edges that are used in multiple paths
    const commonEdges = Array.from(edgeCounts.entries())
      .filter(([_key, count]) => count > 1)
      .map(([key, _key]) => key);

    // Try to find alternative paths by penalizing common edges
    if (commonEdges.length > 0) {
      // Penalize common edges to force alternative routes
      graphCopy.forEachEdge(
        (
          edge: string,
          attributes: EdgeData,
          source: string,
          target: string
        ) => {
          if (attributes.type === 'transit' && attributes.lineId) {
            const key = `${source}-${target}-${attributes.lineId}`;
            if (commonEdges.includes(key)) {
              graphCopy.setEdgeAttribute(
                edge,
                'duration',
                attributes.duration * 2
              );
            }
          }
        }
      );

      try {
        const result = dijkstra.bidirectional(
          graphCopy,
          originId,
          destinationId,
          (_edge: string, attributes: EdgeData) => attributes.duration
        );

        if (result && result.length > 0) {
          // Get edges for this path
          const edges: Array<EdgeData & { source: string; target: string }> =
            [];
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
            // Check if this path is significantly different from existing ones
            const isUnique = !existingPaths.some((existingPath) =>
              areSimilarPaths(result, existingPath.path)
            );

            if (isUnique) {
              existingPaths.push({ path: result, edges });
            }
          }
        }
      } catch (error) {
        console.error('Error finding alternative path:', error);
      }
    }
  }

  // Limit the number of paths to avoid overwhelming the system
  while (existingPaths.length > MAX_ROUTES_TO_GENERATE) {
    existingPaths.pop();
  }
}

/**
 * Check if two paths are similar (share most of the nodes)
 */
function areSimilarPaths(path1: string[], path2: string[]): boolean {
  // Convert to sets of transit nodes (exclude virtual and walking nodes)
  const transitNodes1 = new Set(
    path1.filter(
      (node) =>
        !node.includes('_') && node !== 'origin' && node !== 'destination'
    )
  );

  const transitNodes2 = new Set(
    path2.filter(
      (node) =>
        !node.includes('_') && node !== 'origin' && node !== 'destination'
    )
  );

  // Calculate Jaccard similarity
  const intersection = new Set(
    [...transitNodes1].filter((node) => transitNodes2.has(node))
  );
  const union = new Set([...transitNodes1, ...transitNodes2]);

  // Avoid division by zero
  if (union.size === 0) return false;

  // Paths are similar if they share more than 70% of transit nodes
  return intersection.size / union.size > 0.7;
}

/**
 * Convert graph paths to route segments
 */
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

      // Calculate total metrics for the route
      let totalDistance = 0;
      let totalStops = 0;

      for (const segment of segments) {
        if (segment.type === 'transit') {
          const transitSegment = segment as TransitSegment;
          totalStops += transitSegment.stations.length - 1;
        }

        if ('walkingDistance' in segment) {
          totalDistance += (segment as WalkSegment).walkingDistance;
        } else if (segment.type === 'transit') {
          // Estimate distance for transit segments based on stations
          const transitSegment = segment as TransitSegment;
          for (let i = 0; i < transitSegment.stations.length - 1; i++) {
            const from = transitSegment.stations[i].coordinates;
            const to = transitSegment.stations[i + 1].coordinates;
            totalDistance += calculateHaversineDistance(from, to);
          }
        }
      }

      // Calculate initial total duration
      const totalDuration = segments.reduce(
        (sum, segment) => sum + segment.duration,
        0
      );

      // Build and add the route only if it has a reasonable duration
      if (totalDuration > 0) {
        const route = await buildRoute(segments, totalStops, totalDistance);
        route.id = uuidv4();
        routes.push(route);
      }
    } catch (error) {
      console.error('Error converting path to route:', error);
    }
  }

  return routes;
}

/**
 * Convert a graph path to route segments
 */
async function convertPathToSegments(
  path: string[],
  edges: Array<EdgeData & { source: string; target: string }>,
  graph: Graph<NodeData, EdgeData>
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];
  let currentTransitLine: string | null = null;
  let currentTransitStations: Station[] = [];
  let currentTransitDuration: number = 0;

  // Add helper function to identify the same line across virtual nodes
  function extractLineId(nodeId: string): string | null {
    // Extract line ID from virtual node format stationId_lineId
    return nodeId.includes('_') ? nodeId.split('_')[1] : null;
  }

  // Track virtual line IDs specifically
  let lastVirtualLineId: string | null = null;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;

    const sourceNodeData = graph.getNodeAttributes(edge.source);
    const targetNodeData = graph.getNodeAttributes(edge.target);

    // Skip if node data is missing
    if (!sourceNodeData || !targetNodeData) continue;

    const sourceStation = sourceNodeData.station;
    const targetStation = targetNodeData.station;
    if (!sourceStation || !targetStation) continue;

    // Check if this is a transfer edge between virtual nodes of the same station
    const isIntraStationTransfer =
      edge.type === 'transfer' &&
      sourceStation.id === targetStation.id &&
      edge.source.includes('_') &&
      edge.target.includes('_');

    // Get current line IDs
    const sourceLineId = extractLineId(edge.source);
    const targetLineId = extractLineId(edge.target);

    let lineId = edge.lineId || null;

    // For transit edges between virtual nodes, use their line IDs
    if (edge.type === 'transit') {
      // For transit edges, prefer explicit lineId, then source or target
      lineId = edge.lineId || sourceLineId || targetLineId;
      lastVirtualLineId = lineId;
    }
    // For transfers between virtual nodes, this is a true line transfer
    else if (isIntraStationTransfer) {
      // Complete any previous transit segment
      if (currentTransitLine !== null && currentTransitStations.length > 1) {
        // Finish previous transit segment
        const line = metroLines.find((l) => l.id === currentTransitLine);
        if (line) {
          const transitSegment: TransitSegment = {
            type: 'transit',
            line: {
              id: line.id,
              name: line.name,
              color: line.color,
            },
            stations: [...currentTransitStations],
            duration: currentTransitDuration,
          };

          segments.push(transitSegment);
        }

        currentTransitLine = null;
        currentTransitStations = [];
        currentTransitDuration = 0;
      }

      lastVirtualLineId = null; // Reset line tracking
      continue;
    }

    if (edge.type === 'transit') {
      // Handle continuation or start of transit segment
      if (currentTransitLine !== lineId) {
        // Starting a new transit segment
        if (currentTransitLine !== null && currentTransitStations.length > 1) {
          // Finish previous transit segment
          const line = metroLines.find((l) => l.id === currentTransitLine);
          if (line) {
            const transitSegment: TransitSegment = {
              type: 'transit',
              line: {
                id: line.id,
                name: line.name,
                color: line.color,
              },
              stations: [...currentTransitStations],
              duration: currentTransitDuration,
            };

            segments.push(transitSegment);
          }
        }

        // Start new transit segment
        currentTransitLine = lineId;
        currentTransitStations = [sourceStation];
        currentTransitDuration = 0;
      }

      // Add the target station to current transit segment if not already included
      if (!currentTransitStations.some((s) => s.id === targetStation.id)) {
        currentTransitStations.push(targetStation);
      }

      // Accumulate duration for this transit segment
      currentTransitDuration += edge.duration || 0;
    } else if (
      edge.type === 'walking' ||
      (edge.type === 'transfer' && sourceStation.id !== targetStation.id)
    ) {
      // Finish any ongoing transit segment
      if (currentTransitLine !== null && currentTransitStations.length > 1) {
        const line = metroLines.find((l) => l.id === currentTransitLine);
        if (line) {
          const transitSegment: TransitSegment = {
            type: 'transit',
            line: {
              id: line.id,
              name: line.name,
              color: line.color,
            },
            stations: [...currentTransitStations],
            duration: currentTransitDuration,
          };

          segments.push(transitSegment);
        }

        currentTransitLine = null;
        currentTransitStations = [];
        currentTransitDuration = 0;
      }

      // Create walking segment for actual physical movement
      const walkSegment: WalkSegment = {
        type: 'walk',
        stations: [sourceStation, targetStation],
        duration: edge.duration || 0,
        walkingTime: edge.duration || 0,
        walkingDistance: edge.distance || 0,
      };

      segments.push(walkSegment);
    }
  }

  // Handle any remaining transit segment
  if (currentTransitLine !== null && currentTransitStations.length > 1) {
    const line = metroLines.find((l) => l.id === currentTransitLine);
    if (line) {
      const transitSegment: TransitSegment = {
        type: 'transit',
        line: {
          id: line.id,
          name: line.name,
          color: line.color,
        },
        stations: [...currentTransitStations],
        duration: currentTransitDuration,
      };

      segments.push(transitSegment);
    }
  }

  // Consolidate consecutive walking segments
  const consolidatedSegments: RouteSegment[] = [];
  let currentWalkingSegment: WalkSegment | null = null;

  for (const segment of segments) {
    if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;

      if (currentWalkingSegment) {
        // Combine with the existing walking segment
        currentWalkingSegment.duration += walkSegment.duration;
        currentWalkingSegment.walkingTime += walkSegment.walkingTime;
        currentWalkingSegment.walkingDistance += walkSegment.walkingDistance;

        // Replace the end station
        currentWalkingSegment.stations[1] = walkSegment.stations[1];
      } else {
        // Start a new walking segment
        currentWalkingSegment = { ...walkSegment };
        consolidatedSegments.push(currentWalkingSegment);
      }
    } else {
      // Not a walking segment, reset the current walking segment
      currentWalkingSegment = null;
      consolidatedSegments.push(segment);
    }
  }

  return consolidatedSegments.filter((segment) => segment.duration > 0);
}
