import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Station, Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import {
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import {
  TRANSFER_TIME,
  CRITICAL_TRANSFERS,
  LINE_PRIORITY,
  INTERCHANGE_CONFIG,
} from '@/lib/constants/route-config';
import {
  metroLines,
  walkingShortcuts,
  MAJOR_INTERCHANGES,
} from '@/lib/constants/metro-data';
import { graphCache } from '../../shared/cache';
import {
  addDirectWalking,
  addStationsAndVirtualNodes,
  addTransitEdges,
  addWalkingShortcuts,
  calculateWalkingDuration,
} from '@/server/core/shared/graph-utils';
import { optimizeInterchangePaths } from '../station/interchanges';
import { stationManager } from '../station/station';

export type EdgeType = 'transit' | 'walking' | 'transfer';

export interface EdgeData {
  type: EdgeType;
  duration: number;
  distance: number;
  lineId?: string;
  lineName?: string;
  lineColor?: string;
  costMultiplier?: number;
  isShortcut?: boolean;
  isExplicitShortcut?: boolean;
  priority?: number;
  isAccessWalk?: boolean;
  isMajorInterchange?: boolean;
  isCriticalTransfer?: boolean;
  transferImportance?: number;
}

export interface NodeData {
  station: Station;
  virtual?: boolean;
  lineId?: string;
}

/**
 * Get a transit graph for routing between an origin and destination
 */
export function getTransitGraph(
  origin: Coordinates,
  destination: Coordinates,
  customMaxOriginWalking?: number,
  customMaxDestinationWalking?: number,
  includeAccessPoints: boolean = true
): {
  graph: Graph<NodeData, EdgeData>;
  originId: string;
  destinationId: string;
  nearestOriginStations?: { id: string; distance: number }[];
  nearestDestStations?: { id: string; distance: number }[];
} {
  const cachedGraph = graphCache.get();
  let graph: Graph<NodeData, EdgeData>;

  // Use cached graph or build a new one
  if (!cachedGraph) {
    console.time('Building transit graph');
    graph = buildTransitGraph(metroLines);
    graphCache.set(graph);
    console.timeEnd('Building transit graph');
  } else {
    graph = cachedGraph.copy() as Graph<NodeData, EdgeData>;
  }

  const originId = 'origin';
  const destinationId = 'destination';

  // For transit-only mode, return graph without access points
  if (!includeAccessPoints) {
    // Find nearest stations to origin and destination without adding them to graph
    const nearestOriginStations = stationManager.findNearestStationsToGraph(
      origin,
      graph,
      10
    );
    const nearestDestStations = stationManager.findNearestStationsToGraph(
      destination,
      graph,
      10
    );

    return {
      graph,
      originId,
      destinationId,
      nearestOriginStations,
      nearestDestStations,
    };
  }

  // Add origin and destination to the graph with traditional approach
  // This is preserved for backwards compatibility
  const maxOriginWalking =
    customMaxOriginWalking || MAX_ORIGIN_WALKING_DISTANCE;
  const maxDestWalking =
    customMaxDestinationWalking || MAX_DESTINATION_WALKING_DISTANCE;

  if (graph.hasNode(originId)) {
    graph.setNodeAttribute(originId, 'station', {
      id: originId,
      name: 'Origin',
      coordinates: origin,
    });
    [...graph.edges(originId)].forEach((edge) => graph.dropEdge(edge));
  } else {
    graph.addNode(originId, {
      station: { id: originId, name: 'Origin', coordinates: origin },
    });
  }

  if (graph.hasNode(destinationId)) {
    graph.setNodeAttribute(destinationId, 'station', {
      id: destinationId,
      name: 'Destination',
      coordinates: destination,
    });
    [...graph.edges(destinationId)].forEach((edge) => graph.dropEdge(edge));
  } else {
    graph.addNode(destinationId, {
      station: {
        id: destinationId,
        name: 'Destination',
        coordinates: destination,
      },
    });
  }

  // Connect to nearby stations using traditional approach for backwards compatibility
  const stations = stationManager.findNearestStationsToGraph(origin, graph, 5);
  for (const { id, distance } of stations) {
    if (distance <= maxOriginWalking) {
      const station = graph.getNodeAttributes(id).station;
      addWalkingEdge(graph, originId, id, origin, station.coordinates);
    }
  }

  const destStations = stationManager.findNearestStationsToGraph(
    destination,
    graph,
    5
  );
  for (const { id, distance } of destStations) {
    if (distance <= maxDestWalking) {
      const station = graph.getNodeAttributes(id).station;
      addWalkingEdge(
        graph,
        destinationId,
        id,
        destination,
        station.coordinates
      );
    }
  }

  // Add direct walking between origin and destination
  addDirectWalking(graph, originId, destinationId, origin, destination);

  return { graph, originId, destinationId };
}

// Constants for edge weights
const SHORT_WALKING_DISTANCE = 300; // meters
const SHORT_WALK_COST_MULTIPLIER = 0.9;
const NORMAL_WALK_COST_MULTIPLIER = 1.0;

// Enhanced transfer multipliers
const PRIMARY_LINE_TRANSFER_MULTIPLIER = 0.4; // More aggressive (was 0.6)
const STANDARD_TRANSFER_MULTIPLIER = 0.8; // More aggressive (was 0.9)
const CRITICAL_TRANSFER_MULTIPLIER = 0.2; // New: For critical transfers

/**
 * Add a walking edge
 */
function addWalkingEdge(
  graph: Graph<NodeData, EdgeData>,
  fromId: string,
  toId: string,
  fromCoords: Coordinates,
  toCoords: Coordinates
): void {
  const distance = calculateDistanceSync(fromCoords, toCoords);
  const duration = calculateWalkingDuration(distance);
  const costMultiplier =
    distance < SHORT_WALKING_DISTANCE
      ? SHORT_WALK_COST_MULTIPLIER
      : NORMAL_WALK_COST_MULTIPLIER;

  graph.addEdge(fromId, toId, {
    type: 'walking',
    duration,
    distance,
    costMultiplier,
  });

  graph.addEdge(toId, fromId, {
    type: 'walking',
    duration,
    distance,
    costMultiplier,
  });
}

/**
 * Connects origin and destination to a graph with existing transit paths
 * Returns a new graph with the access connections added
 */
export function connectAccessPoints(
  baseGraph: Graph<NodeData, EdgeData>,
  origin: Coordinates,
  destination: Coordinates,
  transitPathNodes: string[],
  maxOriginWalking: number = MAX_ORIGIN_WALKING_DISTANCE,
  maxDestWalking: number = MAX_DESTINATION_WALKING_DISTANCE
): {
  graph: Graph<NodeData, EdgeData>;
  originId: string;
  destinationId: string;
} {
  // Create a copy of the graph to avoid modifying the original
  const graph = baseGraph.copy() as Graph<NodeData, EdgeData>;
  const originId = 'origin';
  const destinationId = 'destination';

  // Add origin and destination nodes
  graph.addNode(originId, {
    station: { id: originId, name: 'Origin', coordinates: origin },
  });

  graph.addNode(destinationId, {
    station: {
      id: destinationId,
      name: 'Destination',
      coordinates: destination,
    },
  });

  // Keep track of nodes we've already connected to avoid duplicate edges
  const connectedOriginNodes = new Set<string>();
  const connectedDestNodes = new Set<string>();

  // Connect origin to transit nodes at the beginning of transit paths
  const transitStartNodes = transitPathNodes.slice(0, 3);
  for (const nodeId of transitStartNodes) {
    if (
      nodeId === originId ||
      nodeId === destinationId ||
      connectedOriginNodes.has(nodeId)
    )
      continue;

    const nodeAttrs = graph.getNodeAttributes(nodeId);
    const distance = calculateDistanceSync(
      origin,
      nodeAttrs.station.coordinates
    );

    if (distance <= maxOriginWalking) {
      const duration = calculateWalkingDuration(distance);
      const costMultiplier =
        distance < SHORT_WALKING_DISTANCE
          ? SHORT_WALK_COST_MULTIPLIER
          : NORMAL_WALK_COST_MULTIPLIER;

      graph.addEdge(originId, nodeId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      graph.addEdge(nodeId, originId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      connectedOriginNodes.add(nodeId);
    }
  }

  // Connect destination to transit nodes at the end of transit paths
  const transitEndNodes = transitPathNodes.slice(-3);
  for (const nodeId of transitEndNodes) {
    if (
      nodeId === originId ||
      nodeId === destinationId ||
      connectedDestNodes.has(nodeId)
    )
      continue;

    const nodeAttrs = graph.getNodeAttributes(nodeId);
    const distance = calculateDistanceSync(
      destination,
      nodeAttrs.station.coordinates
    );

    if (distance <= maxDestWalking) {
      const duration = calculateWalkingDuration(distance);
      const costMultiplier =
        distance < SHORT_WALKING_DISTANCE
          ? SHORT_WALK_COST_MULTIPLIER
          : NORMAL_WALK_COST_MULTIPLIER;

      graph.addEdge(destinationId, nodeId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      graph.addEdge(nodeId, destinationId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      connectedDestNodes.add(nodeId);
    }
  }

  // Also connect to nearest stations
  const originStations = stationManager.findNearestStationsToGraph(
    origin,
    graph,
    5
  );
  for (const { id, distance } of originStations) {
    if (connectedOriginNodes.has(id)) continue; // Skip if already connected

    if (distance <= maxOriginWalking) {
      const duration = calculateWalkingDuration(distance);
      const costMultiplier =
        distance < SHORT_WALKING_DISTANCE
          ? SHORT_WALK_COST_MULTIPLIER
          : NORMAL_WALK_COST_MULTIPLIER;

      graph.addEdge(originId, id, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      graph.addEdge(id, originId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      connectedOriginNodes.add(id);
    }
  }

  // Connect to nearest destination stations
  const destStations = stationManager.findNearestStationsToGraph(
    destination,
    graph,
    5
  );
  for (const { id, distance } of destStations) {
    if (connectedDestNodes.has(id)) continue; // Skip if already connected

    if (distance <= maxDestWalking) {
      const duration = calculateWalkingDuration(distance);
      const costMultiplier =
        distance < SHORT_WALKING_DISTANCE
          ? SHORT_WALK_COST_MULTIPLIER
          : NORMAL_WALK_COST_MULTIPLIER;

      graph.addEdge(destinationId, id, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      graph.addEdge(id, destinationId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier,
        isAccessWalk: true,
      });

      connectedDestNodes.add(id);
    }
  }

  return { graph, originId, destinationId };
}

/**
 * Build the transit network graph
 */
export function buildTransitGraph(
  metroLines: MetroLine[]
): Graph<NodeData, EdgeData> {
  console.log('Building transit graph...');
  const graph = new Graph<NodeData, EdgeData>();
  const stationsAdded = new Set<string>();
  const virtualNodesCreated = new Map<string, string[]>();

  // Create a map of physically connected stations
  const connectedStations = buildConnectedStationsMap(metroLines);

  // Add stations and their virtual nodes
  addStationsAndVirtualNodes(
    graph,
    metroLines,
    stationsAdded,
    virtualNodesCreated
  );

  // Add transit edges between stations
  addTransitEdges(graph, metroLines);

  // Add transfer edges between virtual nodes with enhanced weighting
  addEnhancedTransferEdges(
    graph,
    virtualNodesCreated,
    TRANSFER_TIME.BASE,
    connectedStations
  );

  // Add walking shortcuts between nearby stations
  addWalkingShortcuts(graph, walkingShortcuts);

  // Apply interchange optimization
  optimizeInterchangePaths(graph);

  // Debug critical transfer points
  logCriticalTransferInfo(graph);

  return graph;
}

/**
 * Build a map of physically connected stations for transfers
 */
function buildConnectedStationsMap(
  metroLines: MetroLine[]
): Map<string, Set<string>> {
  const connectedStations = new Map<string, Set<string>>();

  // Group stations by name
  const stationsByName = new Map<string, Station[]>();
  for (const line of metroLines) {
    for (const station of line.stations) {
      if (!stationsByName.has(station.name)) {
        stationsByName.set(station.name, []);
      }
      stationsByName.get(station.name)?.push(station);
    }
  }

  // Find stations close enough for transfers
  for (const [, stations] of stationsByName.entries()) {
    if (stations.length <= 1) continue;

    for (let i = 0; i < stations.length; i++) {
      const station1 = stations[i];
      if (!connectedStations.has(station1.id)) {
        connectedStations.set(station1.id, new Set<string>());
      }

      for (let j = i + 1; j < stations.length; j++) {
        const station2 = stations[j];
        if (station1.id === station2.id) continue;

        const distance = calculateDistanceSync(
          station1.coordinates,
          station2.coordinates
        );

        const MAX_TRANSFER_DISTANCE = 200;
        if (distance <= MAX_TRANSFER_DISTANCE) {
          connectedStations.get(station1.id)?.add(station2.id);

          if (!connectedStations.has(station2.id)) {
            connectedStations.set(station2.id, new Set<string>());
          }
          connectedStations.get(station2.id)?.add(station1.id);
        }
      }
    }
  }

  return connectedStations;
}

/**
 * Enhanced transfer edge creation with better handling of critical transfers
 */
function addEnhancedTransferEdges(
  graph: Graph<NodeData, EdgeData>,
  virtualNodesCreated: Map<string, string[]>,
  baseTransferTime: number,
  connectedStations: Map<string, Set<string>>
): void {
  // Create a map for quick lookup of interchange details
  const interchangeMap = new Map<
    string,
    {
      lines: string[];
      transferImportance: number;
    }
  >();

  for (const interchange of MAJOR_INTERCHANGES) {
    interchangeMap.set(interchange.stationId, {
      lines: interchange.lines,
      transferImportance: interchange.transferImportance,
    });
  }

  // Create lookup for special transfer pairs
  const specialTransferMap = new Map<string, number>();

  for (const transfer of INTERCHANGE_CONFIG.specialTransfers) {
    // Create keys for both directions of the transfer
    const key1 = `${transfer.stationId}-${transfer.linePair[0]}-${transfer.linePair[1]}`;
    const key2 = `${transfer.stationId}-${transfer.linePair[1]}-${transfer.linePair[0]}`;

    specialTransferMap.set(key1, transfer.multiplier);
    specialTransferMap.set(key2, transfer.multiplier);
  }

  // Connect virtual nodes at the same station
  for (const [stationId, virtualNodes] of virtualNodesCreated.entries()) {
    for (let i = 0; i < virtualNodes.length; i++) {
      for (let j = i + 1; j < virtualNodes.length; j++) {
        const source = virtualNodes[i];
        const target = virtualNodes[j];

        if (source === target || graph.hasEdge(source, target)) continue;

        // Extract line IDs for transfer analysis
        const sourceLineId = source.split('_')[1];
        const targetLineId = target.split('_')[1];

        // Create line combo strings for lookups
        const lineCombo = `${sourceLineId}-${targetLineId}`;
        const reversedLineCombo = `${targetLineId}-${sourceLineId}`;

        // Check if this is a critical transfer between major lines
        const isCriticalTransfer =
          CRITICAL_TRANSFERS[lineCombo] !== undefined ||
          CRITICAL_TRANSFERS[reversedLineCombo] !== undefined;

        // Check if this is a special transfer at this station
        const specialTransferKey = `${stationId}-${sourceLineId}-${targetLineId}`;
        const isSpecialTransfer = specialTransferMap.has(specialTransferKey);

        // Check if this is a major interchange
        const interchange = interchangeMap.get(stationId);
        const isMajorInterchange = !!interchange;
        const transferImportance = interchange?.transferImportance || 0;

        // Calculate adjusted transfer time based on importance
        let adjustedTime = baseTransferTime;
        let costMultiplier = STANDARD_TRANSFER_MULTIPLIER;

        // Apply special transfer multiplier if applicable
        if (isSpecialTransfer) {
          const specialMultiplier =
            specialTransferMap.get(specialTransferKey) || 0.5;
          adjustedTime = Math.floor(baseTransferTime * specialMultiplier);
          costMultiplier = specialMultiplier;
        }
        // Apply critical transfer multiplier if applicable
        else if (isCriticalTransfer) {
          // Get the specific multiplier for this line combo or use default
          const criticalMultiplier =
            CRITICAL_TRANSFERS[lineCombo] ||
            CRITICAL_TRANSFERS[reversedLineCombo] ||
            CRITICAL_TRANSFER_MULTIPLIER;

          adjustedTime = Math.floor(baseTransferTime * criticalMultiplier);
          costMultiplier = criticalMultiplier;
        }
        // Apply major interchange multiplier if applicable
        else if (isMajorInterchange) {
          // Scale transfer time based on importance (0-10)
          const importanceFactor = interchange.transferImportance / 10; // 0-1 scale

          // More aggressive reduction - higher importance = lower transfer time
          const importanceLevel =
            importanceFactor >= 0.9
              ? 'critical'
              : importanceFactor >= 0.7
              ? 'major'
              : importanceFactor >= 0.5
              ? 'standard'
              : 'minor';

          const importanceMultiplier =
            INTERCHANGE_CONFIG.importanceMultipliers[importanceLevel];

          adjustedTime = Math.floor(baseTransferTime * importanceMultiplier);
          costMultiplier = importanceMultiplier;
        }

        // Add bidirectional transfer edges with proper attributes
        const transferEdgeData: EdgeData = {
          type: 'transfer',
          duration: adjustedTime,
          distance: 0,
          isMajorInterchange,
          isCriticalTransfer,
          transferImportance,
          costMultiplier,
        };

        graph.addEdge(source, target, transferEdgeData);
        graph.addEdge(target, source, transferEdgeData);
      }
    }
  }

  // Connect physically connected stations with transfer edges
  for (const [stationId, connectedIds] of connectedStations.entries()) {
    if (!virtualNodesCreated.has(stationId)) continue;

    const sourceVirtualNodes = virtualNodesCreated.get(stationId)!;

    for (const connectedId of connectedIds) {
      if (!virtualNodesCreated.has(connectedId)) continue;

      const targetVirtualNodes = virtualNodesCreated.get(connectedId)!;

      // Get station coordinates for distance calculation
      const sourceStation = graph.getNodeAttributes(stationId).station;
      const targetStation = graph.getNodeAttributes(connectedId).station;

      // Calculate actual walking distance
      const distance = calculateDistanceSync(
        sourceStation.coordinates,
        targetStation.coordinates
      );

      // Calculate transfer time based on walking distance
      const walkingDuration = Math.ceil(distance / 1.2); // 1.2 m/s walking speed

      // In real networks, transfers between stations have additional penalties
      const transferDuration = Math.max(
        baseTransferTime / 2, // Minimum transfer time
        walkingDuration + 20 // Walking time plus overhead
      );

      // Connect each virtual node of source to each virtual node of target
      for (const sourceVNode of sourceVirtualNodes) {
        for (const targetVNode of targetVirtualNodes) {
          if (graph.hasEdge(sourceVNode, targetVNode)) continue;

          // Skip connections between same lines to encourage proper interchange
          const sourceLineId = sourceVNode.split('_')[1];
          const targetLineId = targetVNode.split('_')[1];
          if (sourceLineId === targetLineId) continue;

          // Check if this is a critical transfer
          const lineCombo = `${sourceLineId}-${targetLineId}`;
          const reversedLineCombo = `${targetLineId}-${sourceLineId}`;
          const isCriticalTransfer =
            CRITICAL_TRANSFERS[lineCombo] !== undefined ||
            CRITICAL_TRANSFERS[reversedLineCombo] !== undefined;

          // Determine cost multiplier based on line combination
          let costMultiplier = STANDARD_TRANSFER_MULTIPLIER;

          if (isCriticalTransfer) {
            costMultiplier =
              CRITICAL_TRANSFERS[lineCombo] ||
              CRITICAL_TRANSFERS[reversedLineCombo] ||
              CRITICAL_TRANSFER_MULTIPLIER;
          }
          // Consider line priorities for transfers between primary lines
          else if (
            LINE_PRIORITY[sourceLineId] >= 8 &&
            LINE_PRIORITY[targetLineId] >= 8
          ) {
            costMultiplier = PRIMARY_LINE_TRANSFER_MULTIPLIER;
          }

          // Add transfer edges with proper attributes
          const transferEdgeData: EdgeData = {
            type: 'transfer',
            duration: transferDuration,
            distance: distance,
            isMajorInterchange: false,
            isCriticalTransfer,
            costMultiplier,
          };

          graph.addEdge(sourceVNode, targetVNode, transferEdgeData);
          graph.addEdge(targetVNode, sourceVNode, transferEdgeData);
        }
      }
    }
  }
}

/**
 * Log information about critical transfers for debugging
 */
function logCriticalTransferInfo(graph: Graph<NodeData, EdgeData>): void {
  const importantStations = ['faizAhmadFaiz', 'pims_gate', 'faizabad', 'sohan'];

  console.log('Checking critical transfer edges...');

  for (const station of importantStations) {
    try {
      let nodeCount = 0;
      let virtualNodeCount = 0;
      let transferEdgeCount = 0;
      let criticalTransferCount = 0;

      // Count nodes associated with this station
      graph.forEachNode((nodeId, attrs) => {
        if (nodeId === station) {
          nodeCount++;
        } else if (nodeId.startsWith(`${station}_`)) {
          virtualNodeCount++;

          // Count transfer edges for this virtual node
          graph.forEachOutEdge(nodeId, (edgeId, attrs) => {
            if (attrs.type === 'transfer') {
              transferEdgeCount++;

              // Log details for critical transfers
              if (attrs.isCriticalTransfer) {
                criticalTransferCount++;
                console.log(
                  `Critical transfer: ${nodeId} -> ${graph.opposite(
                    nodeId,
                    edgeId
                  )}`
                );
                console.log(
                  `  Duration: ${attrs.duration}, Cost Multiplier: ${attrs.costMultiplier}`
                );
              }
            }
          });
        }
      });

      console.log(`Station: ${station}`);
      console.log(
        `  Main nodes: ${nodeCount}, Virtual nodes: ${virtualNodeCount}`
      );
      console.log(
        `  Transfer edges: ${transferEdgeCount}, Critical transfers: ${criticalTransferCount}`
      );
    } catch (error) {
      console.error(`Error analyzing ${station}:`, error);
    }
  }
}
