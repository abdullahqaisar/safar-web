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
  addStationsAndVirtualNodes,
  addTransitEdges,
  addDirectWalking,
  ensureStationConnectivity,
  improveConnectivity,
  calculateWalkingDuration,
  calculateWalkingPenalty,
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

  // Create a map of physically connected stations (different IDs but connected for transfers)
  const connectedStations = buildConnectedStationsMap(metroLines);

  addStationsAndVirtualNodes(
    graph,
    metroLines,
    stationsAdded,
    virtualNodesCreated
  );

  addTransitEdges(graph, metroLines);

  // Use improved transfer edge creation
  addImprovedTransferEdges(
    graph,
    stationsAdded,
    virtualNodesCreated,
    TRANSFER_TIME.BASE,
    connectedStations
  );

  // Add walking shortcuts between nearby stations, using explicit shortcuts first
  addWalkingShortcuts(graph, walkingShortcuts);

  return graph;
}

/**
 * Build a map of physically connected stations for transfers
 * This includes stations with different IDs that allow transfers between them
 */
function buildConnectedStationsMap(
  metroLines: MetroLine[]
): Map<string, Set<string>> {
  const connectedStations = new Map<string, Set<string>>();

  // Potential connected stations typically have the same name or are marked as connected
  const stationsByName = new Map<string, Station[]>();

  // First, gather stations by name
  for (const line of metroLines) {
    for (const station of line.stations) {
      if (!stationsByName.has(station.name)) {
        stationsByName.set(station.name, []);
      }
      stationsByName.get(station.name)?.push(station);
    }
  }

  // For stations with the same name, check if they're physically close enough for transfers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_name, stations] of stationsByName.entries()) {
    if (stations.length <= 1) continue;

    for (let i = 0; i < stations.length; i++) {
      const station1 = stations[i];
      if (!connectedStations.has(station1.id)) {
        connectedStations.set(station1.id, new Set<string>());
      }

      for (let j = i + 1; j < stations.length; j++) {
        const station2 = stations[j];

        // Skip if same station ID (safety check)
        if (station1.id === station2.id) continue;

        // Check if they're physically close (e.g., within 150m)
        const distance = calculateDistanceSync(
          station1.coordinates,
          station2.coordinates
        );

        const MAX_TRANSFER_DISTANCE = 150; // 150 meters max for transfers
        if (distance <= MAX_TRANSFER_DISTANCE) {
          // Add bidirectional connection
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
 * Improved transfer edge creation that handles connected stations with different IDs
 */
function addImprovedTransferEdges(
  graph: Graph<NodeData, EdgeData>,
  stationsAdded: Set<string>,
  virtualNodesCreated: Map<string, string[]>,
  transferTime: number,
  connectedStations: Map<string, Set<string>>
): void {
   
  for (const [, virtualNodes] of virtualNodesCreated.entries()) {
    for (let i = 0; i < virtualNodes.length; i++) {
      for (let j = i + 1; j < virtualNodes.length; j++) {
        const source = virtualNodes[i];
        const target = virtualNodes[j];

        // Don't connect if they're already connected or if they're the same node
        if (source === target || graph.hasEdge(source, target)) continue;

        graph.addEdge(source, target, {
          type: 'transfer',
          duration: transferTime,
          distance: 0,
        });

        graph.addEdge(target, source, {
          type: 'transfer',
          duration: transferTime,
          distance: 0,
        });
      }
    }
  }

  // Now, add transfers between physically connected stations
  for (const [stationId, connectedIds] of connectedStations.entries()) {
    if (!virtualNodesCreated.has(stationId)) continue;

    const sourceVirtualNodes = virtualNodesCreated.get(stationId) || [];

    for (const connectedId of connectedIds) {
      // Skip self-connections
      if (stationId === connectedId) continue;

      if (!virtualNodesCreated.has(connectedId)) continue;

      const targetVirtualNodes = virtualNodesCreated.get(connectedId) || [];

      // Get station coordinates for distance calculation
      let sourceStation: Station | null = null;
      let targetStation: Station | null = null;

      for (const nodeId of graph.nodes()) {
        const attrs = graph.getNodeAttributes(nodeId);
        if (attrs.station.id === stationId && !attrs.virtual) {
          sourceStation = attrs.station;
        }
        if (attrs.station.id === connectedId && !attrs.virtual) {
          targetStation = attrs.station;
        }
        if (sourceStation && targetStation) break;
      }

      if (!sourceStation || !targetStation) continue;

      // Calculate actual distance for this connection
      const distance = calculateDistanceSync(
        sourceStation.coordinates,
        targetStation.coordinates
      );

      // Calculate walking time based on distance (typical walking speed)
      const walkingDuration = calculateWalkingDuration(distance);

      // Add transfer edges between all virtual nodes
      for (const sourceNode of sourceVirtualNodes) {
        for (const targetNode of targetVirtualNodes) {
          // Don't add if same node or already connected
          if (
            sourceNode === targetNode ||
            graph.hasEdge(sourceNode, targetNode)
          )
            continue;

          // Add bidirectional edges
          graph.addEdge(sourceNode, targetNode, {
            type: 'transfer',
            duration: walkingDuration + transferTime,
            distance: distance,
          });

          graph.addEdge(targetNode, sourceNode, {
            type: 'transfer',
            duration: walkingDuration + transferTime,
            distance: distance,
          });
        }
      }
    }
  }
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
  // Add or update origin and destination nodes
  if (graph.hasNode(originId)) {
    graph.setNodeAttribute(originId, 'station', {
      id: originId,
      name: 'Origin',
      coordinates: origin,
    });
    // Clear existing edges for clean reconnection
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

  // Calculate the direct distance between origin and destination
  const directDistance = calculateDistanceSync(origin, destination);

  // Dynamically adjust walking thresholds based on direct distance
  // For very short trips, allow shorter walking distances
  // For longer trips, possibly extend walking range
  let adjustedOriginWalking = maxOriginWalkingDistance;
  let adjustedDestWalking = maxDestinationWalkingDistance;

  if (directDistance < 1000) {
    // For short trips, reduce the walking radius but ensure minimum connectivity
    adjustedOriginWalking = Math.min(
      maxOriginWalkingDistance,
      Math.max(500, directDistance * 0.7)
    );
    adjustedDestWalking = Math.min(
      maxDestinationWalkingDistance,
      Math.max(500, directDistance * 0.7)
    );
  } else if (directDistance > 5000) {
    // For longer trips, potentially extend walking radius to find better transit options
    adjustedOriginWalking = Math.min(1500, maxOriginWalkingDistance * 1.2);
    adjustedDestWalking = Math.min(1500, maxDestinationWalkingDistance * 1.2);
  }

  // Use the same connectivity function for both origin and destination
  const originConnections = connectToTransitNetwork(
    graph,
    originId,
    origin,
    adjustedOriginWalking
  );

  const destConnections = connectToTransitNetwork(
    graph,
    destinationId,
    destination,
    adjustedDestWalking
  );

  // Add direct walking option between origin and destination
  addDirectWalking(graph, originId, destinationId, origin, destination);

  console.log(
    `Origin connected to ${originConnections.regular} regular and ${originConnections.virtual} virtual nodes`
  );
  console.log(
    `Destination connected to ${destConnections.regular} regular and ${destConnections.virtual} virtual nodes`
  );

  // Check connectivity quality and balance
  const connectivityIssue = validateAndBalanceConnectivity(
    graph,
    originId,
    destinationId,
    origin,
    destination,
    adjustedOriginWalking,
    adjustedDestWalking,
    originConnections,
    destConnections
  );

  if (connectivityIssue) {
    console.log(`Connectivity issue detected: ${connectivityIssue.issue}`);
    console.log(`Applied fix: ${connectivityIssue.fix}`);
  }
}

/**
 * Single unified function to connect a point (origin or destination) to the transit network
 * Returns metrics about the connections made for later validation
 */
function connectToTransitNetwork(
  graph: Graph<NodeData, EdgeData>,
  pointId: string,
  coordinates: Coordinates,
  maxWalkingDistance: number
): {
  regular: number;
  virtual: number;
  nearestDistance: number;
  lineCoverage: Set<string>;
  connectedStations: Set<string>;
} {
  const connectedStations = new Set<string>();
  const connectedVirtualNodes = new Set<string>();
  const connectedLines = new Set<string>();
  let nearestStationId = null;
  let nearestDistance = Infinity;

  // Step 1: Find and connect to regular stations within threshold
  // Create a stations array with distances to sort by proximity
  const stations = Array.from(graph.nodes())
    .filter(
      (id) => !id.includes('_') && id !== 'origin' && id !== 'destination'
    )
    .map((id) => {
      const station = graph.getNodeAttributes(id).station;
      const distance = calculateDistanceSync(coordinates, station.coordinates);
      return { id, distance, station };
    })
    .sort((a, b) => a.distance - b.distance);

  // Update nearest station info
  if (stations.length > 0) {
    nearestStationId = stations[0].id;
    nearestDistance = stations[0].distance;
  }

  // Connect to stations within walking distance
  for (const { id, distance, station } of stations) {
    if (distance <= maxWalkingDistance) {
      addWalkingEdge(
        graph,
        pointId,
        id,
        coordinates,
        station.coordinates,
        distance,
        maxWalkingDistance
      );
      connectedStations.add(id);
    }
  }

  // Step 2: Connect to virtual nodes for line diversity
  // Find unique lines that we haven't connected to yet
  const virtualNodes = Array.from(graph.nodes())
    .filter(
      (id) =>
        id.includes('_') &&
        !id.startsWith('origin') &&
        !id.startsWith('destination')
    )
    .map((id) => {
      const nodeData = graph.getNodeAttributes(id);
      const lineId = nodeData.lineId || '';
      const station = nodeData.station;
      const distance = calculateDistanceSync(coordinates, station.coordinates);
      return { id, distance, station, lineId };
    })
    .sort((a, b) => a.distance - b.distance);

  // Group virtual nodes by line for diversity
  const virtualNodesByLine = new Map<
    string,
    Array<{ id: string; distance: number }>
  >();
  for (const node of virtualNodes) {
    if (!virtualNodesByLine.has(node.lineId)) {
      virtualNodesByLine.set(node.lineId, []);
    }
    virtualNodesByLine.get(node.lineId)?.push({
      id: node.id,
      distance: node.distance,
    });
  }

  // Connect to closest virtual node for each line, up to a reasonable distance
  const virtualNodeThreshold = Math.min(maxWalkingDistance * 1.3, 2000);

  for (const [lineId, nodes] of virtualNodesByLine.entries()) {
    // Sort nodes by distance and pick closest
    nodes.sort((a, b) => a.distance - b.distance);

    const closestNode = nodes[0];
    if (closestNode.distance <= virtualNodeThreshold) {
      // Add edge with slightly reduced penalty for virtual nodes
      const nodeData = graph.getNodeAttributes(closestNode.id);
      addWalkingEdge(
        graph,
        pointId,
        closestNode.id,
        coordinates,
        nodeData.station.coordinates,
        closestNode.distance,
        maxWalkingDistance,
        0.9 // Lower penalty factor for virtual nodes to promote transit usage
      );

      connectedVirtualNodes.add(closestNode.id);
      connectedLines.add(lineId);
    }
  }

  // Step 3: Always ensure connection to nearest station, even if beyond threshold
  if (nearestStationId && !connectedStations.has(nearestStationId)) {
    ensureStationConnectivity(
      graph,
      pointId,
      nearestStationId,
      coordinates,
      nearestDistance,
      maxWalkingDistance
    );
    connectedStations.add(nearestStationId);
  }

  // Step 4: If we have too few connections, add more to diverse stations
  if (connectedStations.size < 3 || connectedLines.size < 2) {
    const additionalStations = stations
      .filter((s) => !connectedStations.has(s.id))
      .slice(0, 5);

    for (const station of additionalStations) {
      addWalkingEdge(
        graph,
        pointId,
        station.id,
        coordinates,
        station.station.coordinates,
        station.distance,
        maxWalkingDistance,
        1.2 // Higher penalty for these extended connections
      );
      connectedStations.add(station.id);
    }
  }

  return {
    regular: connectedStations.size,
    virtual: connectedVirtualNodes.size,
    nearestDistance,
    lineCoverage: connectedLines,
    connectedStations,
  };
}

/**
 * Helper to add a walking edge with consistent logic
 */
function addWalkingEdge(
  graph: Graph<NodeData, EdgeData>,
  fromId: string,
  toId: string,
  fromCoords: Coordinates,
  toCoords: Coordinates,
  distance: number,
  maxWalkingDistance: number,
  penaltyMultiplier: number = 1.0
): void {
  const duration = calculateWalkingDuration(distance);
  let penaltyFactor =
    calculateWalkingPenalty(distance, maxWalkingDistance) * penaltyMultiplier;

  // Cap penalty to avoid unreasonably high values
  penaltyFactor = Math.min(penaltyFactor, 3.0);

  // Create bidirectional walking edges
  graph.addEdge(fromId, toId, {
    type: 'walking',
    duration: Math.round(duration * penaltyFactor),
    distance,
    costMultiplier: penaltyFactor,
  });

  graph.addEdge(toId, fromId, {
    type: 'walking',
    duration: Math.round(duration * penaltyFactor),
    distance,
    costMultiplier: penaltyFactor,
  });
}

/**
 * Validate connectivity and balance between origin and destination
 * Returns details about any issue detected and fix applied
 */
function validateAndBalanceConnectivity(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  originCoords: Coordinates,
  destCoords: Coordinates,
  maxOriginWalking: number,
  maxDestWalking: number,
  originConnections: {
    regular: number;
    virtual: number;
    lineCoverage: Set<string>;
    connectedStations: Set<string>;
  },
  destConnections: {
    regular: number;
    virtual: number;
    lineCoverage: Set<string>;
    connectedStations: Set<string>;
  }
): { issue: string; fix: string } | null {
  // Issue 1: Severe imbalance in connectivity
  const connectionDiff = Math.abs(
    originConnections.regular - destConnections.regular
  );
  if (connectionDiff > 2) {
    // Determine which point needs improvement
    const needsImprovement =
      originConnections.regular < destConnections.regular
        ? { id: originId, coords: originCoords, max: maxOriginWalking * 1.3 }
        : { id: destinationId, coords: destCoords, max: maxDestWalking * 1.3 };

    improveConnectivity(
      graph,
      needsImprovement.id,
      needsImprovement.coords,
      needsImprovement.max
    );

    return {
      issue: `Connectivity imbalance: Origin ${originConnections.regular} vs Destination ${destConnections.regular}`,
      fix: `Improved connectivity for ${needsImprovement.id} by expanding range to ${needsImprovement.max}m`,
    };
  }

  // Issue 2: Insufficient line coverage at either end
  if (
    originConnections.lineCoverage.size < 2 ||
    destConnections.lineCoverage.size < 2
  ) {
    const pointWithFewerLines =
      originConnections.lineCoverage.size < destConnections.lineCoverage.size
        ? { id: originId, coords: originCoords, max: maxOriginWalking * 1.5 }
        : { id: destinationId, coords: destCoords, max: maxDestWalking * 1.5 };

    improveLineConnectivity(
      graph,
      pointWithFewerLines.id,
      pointWithFewerLines.coords,
      pointWithFewerLines.max,
      pointWithFewerLines.id === originId
        ? originConnections.lineCoverage
        : destConnections.lineCoverage
    );

    return {
      issue: `Insufficient line coverage at ${pointWithFewerLines.id}: only ${
        pointWithFewerLines.id === originId
          ? originConnections.lineCoverage.size
          : destConnections.lineCoverage.size
      } lines`,
      fix: `Added connections to more transit lines with expanded range of ${pointWithFewerLines.max}m`,
    };
  }

  // Issue 3: No overlap in connected stations
  const sharedStations = new Set(
    [...originConnections.connectedStations].filter((x) =>
      destConnections.connectedStations.has(x)
    )
  );

  if (
    sharedStations.size === 0 &&
    originConnections.regular > 0 &&
    destConnections.regular > 0
  ) {
    // Find a potential intermediate station to connect both ends
    const intermediateStation = findIntermediateStation(
      graph,
      originConnections.connectedStations,
      destConnections.connectedStations
    );

    if (intermediateStation) {
      // Create better connections to this intermediate station
      const originStationData =
        graph.getNodeAttributes(intermediateStation).station;
      const distance = calculateDistanceSync(
        originCoords,
        originStationData.coordinates
      );

      addWalkingEdge(
        graph,
        originId,
        intermediateStation,
        originCoords,
        originStationData.coordinates,
        distance,
        maxOriginWalking,
        0.8 // Lower penalty to encourage using this path
      );

      return {
        issue: 'No common stations between origin and destination connections',
        fix: `Added preferred connection to intermediate station ${intermediateStation}`,
      };
    }
  }

  return null; // No issues detected
}

/**
 * Find a good intermediate station that can connect origin and destination areas
 */
function findIntermediateStation(
  graph: Graph<NodeData, EdgeData>,
  originStations: Set<string>,
  destStations: Set<string>
): string | null {
  // Build a map of stations and the lines they connect to
  const stationLines = new Map<string, Set<string>>();

  // Collect all regular stations and their line connections
  for (const nodeId of graph.nodes()) {
    if (nodeId.includes('_') || nodeId === 'origin' || nodeId === 'destination')
      continue;

    const virtualNeighbors = graph
      .neighbors(nodeId)
      .filter((n) => n.includes('_'));
    if (virtualNeighbors.length === 0) continue;

    const lines = new Set<string>();
    for (const virtualNode of virtualNeighbors) {
      const lineId = virtualNode.split('_')[1];
      if (lineId) lines.add(lineId);
    }

    stationLines.set(nodeId, lines);
  }

  // Find stations that connect to at least one line from origin area and one line from destination area
  const candidates = [];

  for (const [stationId, lines] of stationLines.entries()) {
    if (originStations.has(stationId) || destStations.has(stationId)) continue;

    let connectsToOriginLine = false;
    let connectsToDestLine = false;

    // Check if this station connects to lines from both areas
    for (const originStation of originStations) {
      const originLines = stationLines.get(originStation);
      if (!originLines) continue;

      for (const line of originLines) {
        if (lines.has(line)) {
          connectsToOriginLine = true;
          break;
        }
      }
      if (connectsToOriginLine) break;
    }

    for (const destStation of destStations) {
      const destLines = stationLines.get(destStation);
      if (!destLines) continue;

      for (const line of destLines) {
        if (lines.has(line)) {
          connectsToDestLine = true;
          break;
        }
      }
      if (connectsToDestLine) break;
    }

    if (connectsToOriginLine && connectsToDestLine) {
      candidates.push(stationId);
    }
  }

  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Improve connectivity specifically focusing on line diversity
 */
function improveLineConnectivity(
  graph: Graph<NodeData, EdgeData>,
  nodeId: string,
  coordinates: Coordinates,
  maxDistance: number,
  existingLines: Set<string>
): void {
  // Find virtual nodes grouped by line
  const lineVirtualNodes = new Map<
    string,
    Array<{ id: string; distance: number }>
  >();

  for (const id of graph.nodes()) {
    if (!id.includes('_')) continue;

    const nodeData = graph.getNodeAttributes(id);
    if (!nodeData.lineId || existingLines.has(nodeData.lineId)) continue;

    const distance = calculateDistanceSync(
      coordinates,
      nodeData.station.coordinates
    );
    if (distance > maxDistance * 1.3) continue;

    if (!lineVirtualNodes.has(nodeData.lineId)) {
      lineVirtualNodes.set(nodeData.lineId, []);
    }

    lineVirtualNodes.get(nodeData.lineId)?.push({
      id,
      distance,
    });
  }

  for (const [, nodes] of lineVirtualNodes.entries()) {
    if (nodes.length === 0) continue;

    // Sort by distance and connect to closest
    nodes.sort((a, b) => a.distance - b.distance);
    const closest = nodes[0];

    if (closest.distance <= maxDistance * 1.3) {
      const nodeData = graph.getNodeAttributes(closest.id);

      addWalkingEdge(
        graph,
        nodeId,
        closest.id,
        coordinates,
        nodeData.station.coordinates,
        closest.distance,
        maxDistance,
        0.85 // Slightly reduced penalty to encourage line diversity
      );
    }
  }
}
