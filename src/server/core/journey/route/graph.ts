import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Station, Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import {
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import { TRANSFER_TIME } from '@/lib/constants/route-config';
import { metroLines, walkingShortcuts } from '@/lib/constants/metro-data';
import { graphCache } from '../../shared/cache';
import {
  calculateWalkingDuration,
  calculateWalkingPenalty,
} from '@/server/core/shared/graph-utils';
import { optimizeInterchangePaths } from '../station/interchanges';
import {
  addStationsAndVirtualNodes,
  addTransitEdges,
  addDirectWalking,
  addWalkingShortcuts,
} from '@/server/core/shared/graph';

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
    const nearestOriginStations = findNearestStations(graph, origin, 5);
    const nearestDestStations = findNearestStations(graph, destination, 5);

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
  const stations = findNearestStations(graph, origin, 5);
  for (const { id, distance } of stations) {
    if (distance <= maxOriginWalking) {
      const station = graph.getNodeAttributes(id).station;
      addLegacyWalkingEdge(graph, originId, id, origin, station.coordinates);
    }
  }

  const destStations = findNearestStations(graph, destination, 5);
  for (const { id, distance } of destStations) {
    if (distance <= maxDestWalking) {
      const station = graph.getNodeAttributes(id).station;
      addLegacyWalkingEdge(
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

/**
 * Find nearest stations to a location
 */
function findNearestStations(
  graph: Graph<NodeData, EdgeData>,
  location: Coordinates,
  limit: number = 5
): { id: string; distance: number }[] {
  const stations = Array.from(graph.nodes())
    .filter(
      (id) => !id.includes('_') && id !== 'origin' && id !== 'destination'
    )
    .map((id) => {
      const station = graph.getNodeAttributes(id).station;
      const distance = calculateDistanceSync(location, station.coordinates);
      return { id, distance, station };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return stations.map((s) => ({ id: s.id, distance: s.distance }));
}

/**
 * Add a legacy walking edge with penalties (for backwards compatibility only)
 */
function addLegacyWalkingEdge(
  graph: Graph<NodeData, EdgeData>,
  fromId: string,
  toId: string,
  fromCoords: Coordinates,
  toCoords: Coordinates
): void {
  const distance = calculateDistanceSync(fromCoords, toCoords);
  const duration = calculateWalkingDuration(distance);

  graph.addEdge(fromId, toId, {
    type: 'walking',
    duration,
    distance,
    costMultiplier: 1.0,
  });

  graph.addEdge(toId, fromId, {
    type: 'walking',
    duration,
    distance,
    costMultiplier: 1.0,
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
  const transitStartNodes = transitPathNodes.slice(0, 2);
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

      graph.addEdge(originId, nodeId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      graph.addEdge(nodeId, originId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      connectedOriginNodes.add(nodeId);
    }
  }

  // Connect destination to transit nodes at the end of transit paths
  const transitEndNodes = transitPathNodes.slice(-2);
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

      graph.addEdge(destinationId, nodeId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      graph.addEdge(nodeId, destinationId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      connectedDestNodes.add(nodeId);
    }
  }

  // Also connect to nearest stations
  const originStations = findNearestStations(graph, origin, 3);
  for (const { id, distance } of originStations) {
    if (connectedOriginNodes.has(id)) continue; // Skip if already connected

    if (distance <= maxOriginWalking) {
      const duration = calculateWalkingDuration(distance);

      graph.addEdge(originId, id, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      graph.addEdge(id, originId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      connectedOriginNodes.add(id);
    }
  }

  // Connect to nearest destination stations
  const destStations = findNearestStations(graph, destination, 3);
  for (const { id, distance } of destStations) {
    if (connectedDestNodes.has(id)) continue; // Skip if already connected

    if (distance <= maxDestWalking) {
      const duration = calculateWalkingDuration(distance);

      graph.addEdge(destinationId, id, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
        isAccessWalk: true,
      });

      graph.addEdge(id, destinationId, {
        type: 'walking',
        duration: duration,
        distance: distance,
        costMultiplier: 1.0,
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

  // Add transfer edges between virtual nodes
  addTransferEdges(
    graph,
    virtualNodesCreated,
    TRANSFER_TIME.BASE,
    connectedStations
  );

  // Add walking shortcuts between nearby stations
  addWalkingShortcuts(graph, walkingShortcuts);

  return graph;
}

/**
 * Build a map of physically connected stations for transfers
 */
function buildConnectedStationsMap(
  metroLines: MetroLine[]
): Map<string, Set<string>> {
  // Implementation remains the same
  // ...existing code...
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

        const MAX_TRANSFER_DISTANCE = 150;
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
 * Add transfer edges between virtual nodes
 */
function addTransferEdges(
  graph: Graph<NodeData, EdgeData>,
  virtualNodesCreated: Map<string, string[]>,
  transferTime: number,
  connectedStations: Map<string, Set<string>>
): void {
  // Implementation remains the same but simplified
  // ...existing code...
  // Create a map of major interchange stations
  const majorInterchanges = new Map<string, string[]>([
    ['faizAhmadFaiz', ['red', 'orange']],
    ['pims_gate', ['green', 'blue']],
  ]);

  // Connect virtual nodes at the same station
  for (const [, virtualNodes] of virtualNodesCreated.entries()) {
    for (let i = 0; i < virtualNodes.length; i++) {
      for (let j = i + 1; j < virtualNodes.length; j++) {
        const source = virtualNodes[i];
        const target = virtualNodes[j];

        if (source === target || graph.hasEdge(source, target)) continue;

        // Check if this is a major interchange
        const sourceAttrs = graph.getNodeAttributes(source);
        const baseStationId = sourceAttrs.station.id;
        const isMajorInterchange = majorInterchanges.has(baseStationId);

        // Reduce transfer time for major interchanges
        const adjustedTime = isMajorInterchange
          ? Math.floor(transferTime * 0.7)
          : transferTime;

        // Add bidirectional transfer edges
        graph.addEdge(source, target, {
          type: 'transfer',
          duration: adjustedTime,
          distance: 0,
          isMajorInterchange: isMajorInterchange,
        });

        graph.addEdge(target, source, {
          type: 'transfer',
          duration: adjustedTime,
          distance: 0,
          isMajorInterchange: isMajorInterchange,
        });
      }
    }
  }

  // Add transfers between physically connected stations
  // ...rest of implementation...
}
