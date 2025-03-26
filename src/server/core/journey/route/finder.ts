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
import { extractEdgesFromPath } from '@/server/core/shared/graph-utils';
import {
  createDirectWalkingRoute,
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
import { convertPathToSegments } from '../segment/converter';
import { MAJOR_INTERCHANGES } from '@/lib/constants/metro-data';
import { extractLineIdsFromEdges } from '../../shared/line-utils';

const PRIMARY_LINES: readonly string[] = [
  'red',
  'orange',
  'green',
  'blue',
] as const;
const PATH_PRIORITY_WEIGHTS: readonly number[] = [0.4, 0.7, 1.0] as const;
const CRITICAL_LINE_WEIGHT = 0.5;
const MAX_STATIONS_TO_CHECK = 3;

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

  const walkingThresholds = determineWalkingThresholds(
    origin,
    destination,
    MAX_ORIGIN_WALKING_DISTANCE,
    MAX_DESTINATION_WALKING_DISTANCE
  );

  const {
    graph: transitGraph,
    nearestOriginStations,
    nearestDestStations,
  } = getTransitGraph(
    origin,
    destination,
    walkingThresholds.origin,
    walkingThresholds.destination,
    false
  );

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

  // Map stations to their lines for intelligent path generation
  const stationLineMap = buildStationLineMap(transitGraph);

  // Find transit-only paths between nearby stations with explicit line combination consideration
  const transitPaths = findTransitOnlyPaths(
    transitGraph,
    nearestOriginStations,
    nearestDestStations,
    stationLineMap
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

  const routes: Route[] = [];
  const lineCombinationFingerprints = new Set<string>();

  // Process each path to create routes
  for (const path of transitPaths) {
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

    try {
      // Use the costMultiplier in pathfinding
      const completePath = dijkstra.bidirectional(
        accessGraph,
        originId,
        destinationId,
        (_edge: string, attributes: EdgeData) =>
          attributes.duration * (attributes.costMultiplier || 1.0)
      );

      if (completePath && completePath.length > 0) {
        const edges = extractEdgesFromPath(accessGraph, completePath);
        if (edges.length > 0) {
          // Create a line combination fingerprint to ensure route diversity
          const lineFingerprint = generateLineFingerprint(edges);

          // Skip this path if we already have a similar line combination
          if (lineCombinationFingerprints.has(lineFingerprint)) {
            continue;
          }

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

              // Record this line combination
              lineCombinationFingerprints.add(lineFingerprint);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding complete path:', error);
    }
  }

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

  const routesWithTimes = await calculateRouteTimes(routes);
  return routesWithTimes.map((route) => ({
    ...route,
    id: `transit-${uuidv4()}`,
    directDistance,
  }));
}

function buildStationLineMap(
  graph: Graph<NodeData, EdgeData>
): Map<string, string[]> {
  const stationLineMap = new Map<string, string[]>();

  graph.forEachNode((nodeId, attrs) => {
    // Skip virtual nodes
    if (nodeId.includes('_')) return;

    // Get lines for this station by checking all connected edges
    const lines = new Set<string>();

    graph.forEachOutEdge(nodeId, (edgeId, attributes) => {
      if (attributes.lineId) {
        lines.add(attributes.lineId);
      }
    });

    // Also check node attributes for lineId
    if (attrs.lineId) {
      lines.add(attrs.lineId);
    }

    if (lines.size > 0) {
      stationLineMap.set(nodeId, Array.from(lines));
    }
  });

  return stationLineMap;
}

function generateLineFingerprint(
  edges: Array<EdgeData & { source: string; target: string }>
): string {
  // Extract transit line usage
  const lines = new Set<string>();

  for (const edge of edges) {
    if (edge.type === 'transit' && edge.lineId) {
      lines.add(edge.lineId);
    }
  }

  return Array.from(lines).sort().join('-');
}

function findTransitOnlyPaths(
  graph: Graph<NodeData, EdgeData>,
  originStations: { id: string; distance: number }[],
  destStations: { id: string; distance: number }[],
  stationLineMap: Map<string, string[]>
): {
  path: string[];
  edges: Array<EdgeData & { source: string; target: string }>;
}[] {
  const paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
    lineFingerprint?: string;
    pathType?: string; // Add path type for better fingerprinting
  }[] = [];

  const lineCombinationFingerprints = new Set<string>();

  // PHASE 0: Check for special well-known routes like secretariat-airport
  try {
    const secretariatId = findStationIdByName(
      originStations,
      destStations,
      'Secretariat'
    );
    const airportId = findStationIdByName(
      originStations,
      destStations,
      'Airport'
    );

    // If we have secretariat and airport, force a path through faizAhmadFaiz
    if (secretariatId && airportId) {
      console.log(
        'Found secretariat and airport in stations - attempting special routing'
      );
      const path = findPathViaInterchange(
        graph,
        secretariatId === 'secretariat' ? secretariatId : airportId,
        'faizAhmadFaiz',
        secretariatId === 'secretariat' ? airportId : secretariatId
      );

      if (path) {
        const fingerprint = 'special-secretariat-faizAhmadFaiz-airport';
        paths.push({
          ...path,
          lineFingerprint: fingerprint,
          pathType: 'special-critical',
        });
        lineCombinationFingerprints.add(fingerprint);
        console.log('Successfully added special secretariat-airport path');
      }
    }
  } catch (error) {
    console.error('Error finding special route:', error);
  }

  // PHASE 1: First try to generate paths through major interchanges
  for (const originStation of originStations.slice(0, MAX_STATIONS_TO_CHECK)) {
    for (const destStation of destStations.slice(0, MAX_STATIONS_TO_CHECK)) {
      if (originStation.id === destStation.id) continue;

      // Get lines for origin and destination
      const originLines = stationLineMap.get(originStation.id) || [];
      const destLines = stationLineMap.get(destStation.id) || [];

      // Check if direct path possible (stations on same line)
      const commonLines = originLines.filter((line) =>
        destLines.includes(line)
      );

      // Try direct connection if stations are on the same line
      for (const commonLine of commonLines) {
        try {
          const path = dijkstra.bidirectional(
            graph,
            originStation.id,
            destStation.id,
            (_edge: string, attributes: EdgeData) => {
              // Prioritize transit edges on this line
              if (
                attributes.type === 'transit' &&
                attributes.lineId === commonLine
              ) {
                return attributes.duration * CRITICAL_LINE_WEIGHT;
              }
              return attributes.duration * (attributes.costMultiplier || 1.0);
            }
          );

          if (path && path.length > 0) {
            const edges = extractEdgesFromPath(graph, path);
            if (edges.length > 0) {
              // Enhanced fingerprint with more structural information
              const lineFingerprint = `direct-${commonLine}-${originStation.id}-${destStation.id}`;

              if (!lineCombinationFingerprints.has(lineFingerprint)) {
                paths.push({
                  path,
                  edges,
                  lineFingerprint,
                  pathType: 'direct-line',
                });
                lineCombinationFingerprints.add(lineFingerprint);
              }
            }
          }
        } catch (error) {
          console.log('Direct path finding failed:', error);
        }
      }

      // Try paths via major interchanges for transfers between lines
      for (const interchange of MAJOR_INTERCHANGES) {
        // Skip if this is already the origin or destination
        if (
          interchange.stationId === originStation.id ||
          interchange.stationId === destStation.id
        )
          continue;

        // Check if this interchange connects lines that might help
        const originCanReachInterchange = originLines.some((line) =>
          interchange.lines.includes(line)
        );
        const destCanReachFromInterchange = destLines.some((line) =>
          interchange.lines.includes(line)
        );

        // Skip if interchange doesn't connect lines from both stations
        if (!originCanReachInterchange || !destCanReachFromInterchange)
          continue;

        // Find origin line that connects to interchange
        for (const originLine of originLines) {
          if (!interchange.lines.includes(originLine)) continue;

          // Find destination line that connects from interchange
          for (const destLine of destLines) {
            if (!interchange.lines.includes(destLine)) continue;

            // Skip if same line - already handled by direct path
            if (originLine === destLine) continue;

            // Check if this is a critical transfer pair
            const isCriticalPair =
              (originLine === 'red' && destLine === 'orange') ||
              (originLine === 'orange' && destLine === 'red') ||
              (originLine === 'green' && destLine === 'blue') ||
              (originLine === 'blue' && destLine === 'green');

            try {
              // Find path: origin → interchange
              const path1 = dijkstra.bidirectional(
                graph,
                originStation.id,
                interchange.stationId,
                (_edge: string, attributes: EdgeData) => {
                  // Prefer transit on origin line going to interchange
                  if (
                    attributes.type === 'transit' &&
                    attributes.lineId === originLine
                  ) {
                    // Even more aggressive weighting for critical pairs
                    return (
                      attributes.duration *
                      (isCriticalPair ? 0.3 : CRITICAL_LINE_WEIGHT)
                    );
                  }
                  return (
                    attributes.duration * (attributes.costMultiplier || 1.0)
                  );
                }
              );

              // Find path: interchange → destination
              const path2 = dijkstra.bidirectional(
                graph,
                interchange.stationId,
                destStation.id,
                (_edge: string, attributes: EdgeData) => {
                  // Prefer transit on destination line from interchange
                  if (
                    attributes.type === 'transit' &&
                    attributes.lineId === destLine
                  ) {
                    // Even more aggressive weighting for critical pairs
                    return (
                      attributes.duration *
                      (isCriticalPair ? 0.3 : CRITICAL_LINE_WEIGHT)
                    );
                  }
                  return (
                    attributes.duration * (attributes.costMultiplier || 1.0)
                  );
                }
              );

              if (path1?.length > 0 && path2?.length > 0) {
                // Create combined path (removing duplicate interchange node)
                const combinedPath = [...path1.slice(0, -1), ...path2];
                const edges = extractEdgesFromPath(graph, combinedPath);

                if (edges.length > 0) {
                  // Enhanced fingerprint with more structural information
                  const lineFingerprint = `via-${interchange.stationId}-${originLine}-${destLine}-${originStation.id}-${destStation.id}`;

                  // Add path type for additional diversity
                  const pathType = isCriticalPair
                    ? 'critical-interchange'
                    : 'major-interchange';

                  // Only add if this line combination is new
                  if (!lineCombinationFingerprints.has(lineFingerprint)) {
                    paths.push({
                      path: combinedPath,
                      edges,
                      lineFingerprint,
                      pathType,
                    });
                    lineCombinationFingerprints.add(lineFingerprint);
                  }
                }
              }
            } catch (error) {
              console.log(
                `Path via interchange ${interchange.stationId} failed:`,
                error
              );
            }
          }
        }
      }
    }
  }

  // PHASE 2: Apply all path strategies, including the new ones
  for (const originStation of originStations.slice(0, MAX_STATIONS_TO_CHECK)) {
    for (const destStation of destStations.slice(0, MAX_STATIONS_TO_CHECK)) {
      if (originStation.id === destStation.id) continue;

      try {
        // Try different path strategies to find routes
        for (const strategy of PATH_STRATEGIES) {
          const path = dijkstra.bidirectional(
            graph,
            originStation.id,
            destStation.id,
            (edge: string, attributes: EdgeData) =>
              strategy.weight(
                edge,
                attributes,
                graph.source(edge),
                graph.target(edge),
                graph
              )
          );

          if (path && path.length > 0) {
            const edges = extractEdgesFromPath(graph, path);

            if (edges.length > 0) {
              // Extract line information for fingerprinting
              const lineIds = new Set<string>();
              let hasTransit = false;

              for (const edge of edges) {
                if (edge.type === 'transit' && edge.lineId) {
                  lineIds.add(edge.lineId);
                  hasTransit = true;
                }
              }

              // Create fingerprint with strategy name for more diversity
              const linesStr = Array.from(lineIds).sort().join('-');
              const lineFingerprint = `${strategy.name}-${linesStr}-${originStation.id}-${destStation.id}`;

              // Only add this path if the line combination is new
              if (
                !lineCombinationFingerprints.has(lineFingerprint) &&
                hasTransit
              ) {
                paths.push({
                  path,
                  edges,
                  lineFingerprint,
                  pathType: `strategy-${strategy.name}`,
                });
                lineCombinationFingerprints.add(lineFingerprint);
              }
            }
          }
        }
      } catch (error) {
        console.log('Path strategy failed:', error);
      }
    }
  }

  // PHASE 3: Apply diversity strategies with improved fingerprinting
  for (const origin of originStations.slice(0, 2)) {
    for (const dest of destStations.slice(0, 2)) {
      try {
        // Use existing diversity strategies but track line combinations
        const pathsBeforeCount = paths.length;

        generateAggressiveAlternativePaths(graph, origin.id, dest.id, paths);
        forceLineDiversityPaths(graph, origin.id, dest.id, paths);
        findMajorLineCombinationPaths(graph, origin.id, dest.id, paths);

        // For new paths, compute and check line fingerprints
        for (let i = pathsBeforeCount; i < paths.length; i++) {
          const path = paths[i];

          // Create more detailed fingerprint
          const lineIds = extractLineIdsFromEdges(path.edges);
          const linesStr = Array.from(lineIds).sort().join('-');
          const lineFingerprint = `diverse-${linesStr}-${origin.id}-${dest.id}`;

          // If this fingerprint already exists, remove the path
          if (lineCombinationFingerprints.has(lineFingerprint)) {
            paths.splice(i, 1);
            i--;
          } else {
            lineCombinationFingerprints.add(lineFingerprint);
            path.lineFingerprint = lineFingerprint;
            path.pathType = 'diversity';
          }
        }
      } catch (error) {
        console.log('Diversity strategy failed:', error);
      }
    }
  }

  // Sort paths to prioritize critical exchanges and direct lines
  paths.sort((a, b) => {
    // Priority order: special-critical > critical-interchange > direct-line > others
    const pathTypePriority = {
      'special-critical': 0,
      'critical-interchange': 1,
      'direct-line': 2,
      'major-interchange': 3,
      'strategy-criticalConnections': 4,
      'strategy-majorInterchanges': 5,
      'strategy-preferPrimary': 6,
    };

    const typeA = a.pathType || '';
    const typeB = b.pathType || '';

    // Get priority, default to 100 if not in the map
    const priorityA = pathTypePriority[typeA] ?? 100;
    const priorityB = pathTypePriority[typeB] ?? 100;

    return priorityA - priorityB;
  });

  // Return paths, ensuring we have enough diversity but not too many paths
  // For critical routes, return more options
  const hasCriticalRoutes = paths.some(
    (p) =>
      p.pathType === 'critical-interchange' || p.pathType === 'special-critical'
  );

  const limit = hasCriticalRoutes
    ? Math.max(4, MAX_ROUTES_TO_GENERATE)
    : MAX_ROUTES_TO_GENERATE;

  return paths.length <= limit ? paths : paths.slice(0, limit);
}

/**
 * Helper function to find a station ID by name
 */
function findStationIdByName(
  originStations: { id: string; distance: number }[],
  destStations: { id: string; distance: number }[],
  stationName: string
): string | null {
  // Match any station with the given name
  const lowerName = stationName.toLowerCase();

  // Check origins first
  for (const station of originStations) {
    if (station.id.toLowerCase().includes(lowerName)) {
      return station.id;
    }
  }

  // Then check destinations
  for (const station of destStations) {
    if (station.id.toLowerCase().includes(lowerName)) {
      return station.id;
    }
  }

  return null;
}

/**
 * Helper function to find a path via specific interchange
 */
function findPathViaInterchange(
  graph: Graph<NodeData, EdgeData>,
  sourceId: string,
  interchangeId: string,
  targetId: string
): {
  path: string[];
  edges: Array<EdgeData & { source: string; target: string }>;
} | null {
  try {
    // Custom weight function to heavily prioritize this specific route
    const weightFn = (_edge: string, attributes: EdgeData) => {
      if (attributes.isCriticalTransfer) {
        return attributes.duration * 0.1; // 90% reduction
      }

      // For transit edges to/from the interchange
      if (attributes.type === 'transit') {
        // Check if this edge connects to the interchange
        const [source, target] = _edge.split('~');
        if (source.includes(interchangeId) || target.includes(interchangeId)) {
          return attributes.duration * 0.2; // 80% reduction
        }
      }

      return attributes.duration * (attributes.costMultiplier || 0.5);
    };

    // First test if the interchange exists
    if (!graph.hasNode(interchangeId)) {
      console.log(`Interchange ${interchangeId} not found in graph`);
      return null;
    }

    // Find path: source → interchange
    const path1 = dijkstra.bidirectional(
      graph,
      sourceId,
      interchangeId,
      weightFn
    );

    if (!path1 || path1.length === 0) {
      console.log(
        `No path found from ${sourceId} to interchange ${interchangeId}`
      );
      return null;
    }

    // Find path: interchange → target
    const path2 = dijkstra.bidirectional(
      graph,
      interchangeId,
      targetId,
      weightFn
    );

    if (!path2 || path2.length === 0) {
      console.log(
        `No path found from interchange ${interchangeId} to ${targetId}`
      );
      return null;
    }

    // Create combined path (removing duplicate interchange node)
    const combinedPath = [...path1.slice(0, -1), ...path2];
    const edges = extractEdgesFromPath(graph, combinedPath);

    if (edges.length === 0) {
      console.log('No edges in combined path');
      return null;
    }

    return { path: combinedPath, edges };
  } catch (error) {
    console.error(
      `Error finding path through interchange ${interchangeId}:`,
      error
    );
    return null;
  }
}

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
  const paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
    lineFingerprint?: string;
  }[] = [];

  const lineCombinationFingerprints = new Set<string>();

  if (!graph.hasNode(originId) || !graph.hasNode(destinationId)) {
    return [];
  }

  try {
    // PHASE 1: Try to find paths via each major interchange
    for (const interchange of MAJOR_INTERCHANGES) {
      const interchangeId = interchange.stationId;

      if (interchangeId === originId || interchangeId === destinationId)
        continue;

      try {
        const path1 = dijkstra.bidirectional(
          graph,
          originId,
          interchangeId,
          (_edge: string, attrs: EdgeData) =>
            attrs.duration * (attrs.costMultiplier || 1.0)
        );

        const path2 = dijkstra.bidirectional(
          graph,
          interchangeId,
          destinationId,
          (_edge: string, attrs: EdgeData) =>
            attrs.duration * (attrs.costMultiplier || 1.0)
        );

        if (path1?.length > 0 && path2?.length > 0) {
          const combinedPath = [...path1.slice(0, -1), ...path2];
          const edges = extractEdgesFromPath(graph, combinedPath);

          if (edges.length > 0) {
            const lineFingerprint = generateLineFingerprint(edges);

            if (!lineCombinationFingerprints.has(lineFingerprint)) {
              paths.push({ path: combinedPath, edges, lineFingerprint });
              lineCombinationFingerprints.add(lineFingerprint);
            }
          }
        }
      } catch (error) {
        console.log(`Path via interchange ${interchangeId} failed:`, error);
      }
    }

    // PHASE 2: Find direct paths using primary transit lines
    for (const priority of PATH_PRIORITY_WEIGHTS) {
      const result = dijkstra.bidirectional(
        graph,
        originId,
        destinationId,
        (_edge: string, attributes: EdgeData) => {
          let multiplier = attributes.costMultiplier || 1.0;
          // Boost primary lines
          if (attributes.type === 'transit' && attributes.lineId) {
            if (PRIMARY_LINES.includes(attributes.lineId)) {
              multiplier *= priority;
            }
          }
          return attributes.duration * multiplier;
        }
      );

      if (result && result.length > 0) {
        const edges = extractEdgesFromPath(graph, result);
        if (edges.length > 0) {
          const lineFingerprint = generateLineFingerprint(edges);

          if (!lineCombinationFingerprints.has(lineFingerprint)) {
            paths.push({ path: result, edges, lineFingerprint });
            lineCombinationFingerprints.add(lineFingerprint);
          }
        }
      }
    }

    // PHASE 3: Apply standard path strategies
    for (const strategy of PATH_STRATEGIES) {
      const result = dijkstra.bidirectional(
        graph,
        originId,
        destinationId,
        strategy.weight
      );

      if (result && result.length > 0) {
        const edges = extractEdgesFromPath(graph, result);
        if (edges.length > 0) {
          const lineFingerprint = generateLineFingerprint(edges);

          if (!lineCombinationFingerprints.has(lineFingerprint)) {
            paths.push({ path: result, edges, lineFingerprint });
            lineCombinationFingerprints.add(lineFingerprint);
          }
        }
      }
    }

    // PHASE 4: Apply diversity strategies, but with line fingerprinting
    const pathsBeforeCount = paths.length;

    generateAggressiveAlternativePaths(graph, originId, destinationId, paths);
    forceLineDiversityPaths(graph, originId, destinationId, paths);
    findMajorLineCombinationPaths(graph, originId, destinationId, paths);

    // Filter newly generated paths for line uniqueness
    for (let i = pathsBeforeCount; i < paths.length; i++) {
      const path = paths[i];
      const lineFingerprint = generateLineFingerprint(path.edges);

      // Remove duplicate line combinations
      if (lineCombinationFingerprints.has(lineFingerprint)) {
        paths.splice(i, 1);
        i--;
      } else {
        lineCombinationFingerprints.add(lineFingerprint);
      }
    }
  } catch (error) {
    console.error('Error finding paths:', error);
  }

  // Return a diverse set of paths with unique line combinations
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
