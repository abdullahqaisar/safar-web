import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Station, Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import {
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import { TRANSFER_TIME } from '@/lib/constants/route-config';
import { metroLines } from '@/lib/constants/metro-data';
import { graphCache } from '../../shared/cache';
import {
  addStationsAndVirtualNodes,
  addTransitEdges,
  addTransferEdges,
  addDirectWalking,
  ensureStationConnectivity,
  improveConnectivity,
  calculateWalkingDuration,
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
}

export interface NodeData {
  station: Station;
  virtual?: boolean;
  lineId?: string;
}

export function getTransitGraph(
  origin: Coordinates,
  destination: Coordinates,
  customMaxOriginWalking?: number,
  customMaxDestinationWalking?: number
): {
  graph: Graph<NodeData, EdgeData>;
  originId: string;
  destinationId: string;
} {
  const cachedGraph = graphCache.get();
  let graph: Graph<NodeData, EdgeData>;

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

  const maxOriginWalking =
    customMaxOriginWalking || MAX_ORIGIN_WALKING_DISTANCE;
  const maxDestinationWalking =
    customMaxDestinationWalking || MAX_DESTINATION_WALKING_DISTANCE;

  addCustomLocations(
    graph,
    originId,
    destinationId,
    origin,
    destination,
    maxOriginWalking,
    maxDestinationWalking
  );

  return { graph, originId, destinationId };
}

export function buildTransitGraph(
  metroLines: MetroLine[]
): Graph<NodeData, EdgeData> {
  const graph = new Graph<NodeData, EdgeData>();
  const stationsAdded = new Set<string>();
  const virtualNodesCreated = new Map<string, string[]>();

  addStationsAndVirtualNodes(
    graph,
    metroLines,
    stationsAdded,
    virtualNodesCreated
  );

  addTransitEdges(graph, metroLines);

  addTransferEdges(graph, stationsAdded, virtualNodesCreated, TRANSFER_TIME);

  return graph;
}

function addCustomLocations(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  origin: Coordinates,
  destination: Coordinates,
  maxOriginWalkingDistance = 800,
  maxDestinationWalkingDistance = 1200
): void {
  if (graph.hasNode(originId)) {
    graph.setNodeAttribute(originId, 'station', {
      id: originId,
      name: 'Origin',
      coordinates: origin,
    });

    const edges = [...graph.edges(originId)];
    edges.forEach((edgeId) => graph.dropEdge(edgeId));
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

    const edges = [...graph.edges(destinationId)];
    edges.forEach((edgeId) => graph.dropEdge(edgeId));
  } else {
    graph.addNode(destinationId, {
      station: {
        id: destinationId,
        name: 'Destination',
        coordinates: destination,
      },
    });
  }

  const maxWalkingThreshold = Math.max(
    maxOriginWalkingDistance,
    maxDestinationWalkingDistance
  );

  connectOriginToStations(graph, originId, origin, maxWalkingThreshold);
  connectDestinationToStations(
    graph,
    destinationId,
    destination,
    maxWalkingThreshold
  );

  addDirectWalking(graph, originId, destinationId, origin, destination);

  console.log(
    `Origin connected to ${graph.outNeighbors(originId).length} nodes, ` +
      `destination connected to ${
        graph.outNeighbors(destinationId).length
      } nodes`
  );

  const originConnectivity = graph.outNeighbors(originId).length;
  const destConnectivity = graph.outNeighbors(destinationId).length;

  if (Math.abs(originConnectivity - destConnectivity) > 2) {
    console.log('Detected connectivity imbalance, enforcing symmetry');
    if (originConnectivity < destConnectivity) {
      improveConnectivity(graph, originId, origin, maxWalkingThreshold * 1.2);
    } else {
      improveConnectivity(
        graph,
        destinationId,
        destination,
        maxWalkingThreshold * 1.2
      );
    }
  }
}

function connectOriginToStations(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  origin: Coordinates,
  maxWalkingDistance: number
): void {
  let closestStationToOrigin = null;
  let minDistanceToOrigin = Infinity;

  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === 'destination' || nodeId.includes('_'))
      continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    const station = nodeData.station;
    const distance = calculateDistanceSync(origin, station.coordinates);

    if (distance < minDistanceToOrigin) {
      minDistanceToOrigin = distance;
      closestStationToOrigin = nodeId;
    }

    if (distance <= maxWalkingDistance) {
      const duration = calculateWalkingDuration(distance);
      graph.addEdge(originId, nodeId, {
        type: 'walking',
        duration,
        distance,
      });
      graph.addEdge(nodeId, originId, {
        type: 'walking',
        duration,
        distance,
      });
    }
  }

  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistanceSync(origin, station.coordinates);

    if (distance < maxWalkingDistance * 1.5) {
      if (distance < minDistanceToOrigin * 2.0) {
        const duration = calculateWalkingDuration(distance);
        graph.addEdge(originId, nodeId, {
          type: 'walking',
          duration: duration * 0.95,
          distance,
        });
        graph.addEdge(nodeId, originId, {
          type: 'walking',
          duration: duration * 0.95,
          distance,
        });
      }
    }
  }

  if (closestStationToOrigin) {
    ensureStationConnectivity(
      graph,
      originId,
      closestStationToOrigin,
      origin,
      minDistanceToOrigin,
      maxWalkingDistance
    );
  }

  const connectedStations = graph.outNeighbors(originId);
  if (connectedStations.length < 3) {
    const stations = Array.from(graph.nodes())
      .filter(
        (id) => !id.includes('_') && id !== originId && id !== 'destination'
      )
      .map((id) => ({
        id,
        distance: calculateDistanceSync(
          origin,
          graph.getNodeAttributes(id).station.coordinates
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    for (const station of stations) {
      if (!graph.hasEdge(originId, station.id)) {
        const duration = calculateWalkingDuration(station.distance);
        const penaltyFactor = 1 + station.distance / maxWalkingDistance;
        graph.addEdge(originId, station.id, {
          type: 'walking',
          duration: Math.round(duration * penaltyFactor),
          distance: station.distance,
          costMultiplier: penaltyFactor,
        });
        graph.addEdge(station.id, originId, {
          type: 'walking',
          duration: Math.round(duration * penaltyFactor),
          distance: station.distance,
          costMultiplier: penaltyFactor,
        });
      }
    }
  }
}

function connectDestinationToStations(
  graph: Graph<NodeData, EdgeData>,
  destinationId: string,
  destination: Coordinates,
  maxWalkingDistance: number
): void {
  let closestStationToDest = null;
  let minDistanceToDest = Infinity;

  for (const nodeId of graph.nodes()) {
    if (nodeId === 'origin' || nodeId === destinationId || nodeId.includes('_'))
      continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    const station = nodeData.station;
    const distance = calculateDistanceSync(destination, station.coordinates);

    if (distance < minDistanceToDest) {
      minDistanceToDest = distance;
      closestStationToDest = nodeId;
    }

    if (distance <= maxWalkingDistance) {
      const duration = calculateWalkingDuration(distance);
      graph.addEdge(nodeId, destinationId, {
        type: 'walking',
        duration,
        distance,
      });
      graph.addEdge(destinationId, nodeId, {
        type: 'walking',
        duration,
        distance,
      });
    }
  }

  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistanceSync(destination, station.coordinates);

    if (distance < maxWalkingDistance * 1.5) {
      if (distance < minDistanceToDest * 2.0) {
        const duration = calculateWalkingDuration(distance);
        graph.addEdge(nodeId, destinationId, {
          type: 'walking',
          duration: duration * 0.95,
          distance,
        });
        graph.addEdge(destinationId, nodeId, {
          type: 'walking',
          duration: duration * 0.95,
          distance,
        });
      }
    }
  }

  if (closestStationToDest) {
    ensureStationConnectivity(
      graph,
      destinationId,
      closestStationToDest,
      destination,
      minDistanceToDest,
      maxWalkingDistance
    );
  }

  const connectedStations = graph.outNeighbors(destinationId);
  if (connectedStations.length < 3) {
    const stations = Array.from(graph.nodes())
      .filter(
        (id) => !id.includes('_') && id !== destinationId && id !== 'origin'
      )
      .map((id) => ({
        id,
        distance: calculateDistanceSync(
          destination,
          graph.getNodeAttributes(id).station.coordinates
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    for (const station of stations) {
      if (!graph.hasEdge(destinationId, station.id)) {
        const duration = calculateWalkingDuration(station.distance);
        const penaltyFactor = 1 + station.distance / maxWalkingDistance;
        graph.addEdge(destinationId, station.id, {
          type: 'walking',
          duration: Math.round(duration * penaltyFactor),
          distance: station.distance,
          costMultiplier: penaltyFactor,
        });
        graph.addEdge(station.id, destinationId, {
          type: 'walking',
          duration: Math.round(duration * penaltyFactor),
          distance: station.distance,
          costMultiplier: penaltyFactor,
        });
      }
    }
  }
}
