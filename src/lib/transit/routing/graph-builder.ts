import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Station, Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/lib/utils/distance';
import {
  WALKING_SPEED_MPS,
  MAX_ORIGIN_WALKING_DISTANCE,
  MAX_DESTINATION_WALKING_DISTANCE,
} from '@/lib/constants/config';
import { metroLines } from '@/lib/constants/metro-data';
import { graphCache } from '../../utils/cache';

// Define edge types
export type EdgeType = 'transit' | 'walking' | 'transfer';

// Edge data interface
export interface EdgeData {
  type: EdgeType;
  duration: number; // in seconds
  distance: number; // in meters
  lineId?: string;
  lineName?: string;
  lineColor?: string;
  costMultiplier?: number;
}

// Node data interface
export interface NodeData {
  station: Station;
  virtual?: boolean;
  lineId?: string;
}

/**
 * Calculate walking duration with distance-based penalties
 * @param distance Walking distance in meters
 * @returns Duration in seconds, with penalty applied
 */
function calculateWalkingDuration(distance: number): number {
  const baseDuration = Math.round(distance / WALKING_SPEED_MPS);

  // Updated tiered penalties
  if (distance <= 500) return baseDuration;
  if (distance <= 1000) return Math.round(baseDuration * 1.1);
  if (distance <= 1500) return Math.round(baseDuration * 1.3);
  if (distance <= 2000) return Math.round(baseDuration * 1.5);
  if (distance <= 2500) return Math.round(baseDuration * 1.8);
  if (distance <= 3000) return Math.round(baseDuration * 2.2);
  return Math.round(baseDuration * 3.0);
}
/**
 * Get the transit graph with origin and destination nodes added
 * Now uses separate walking thresholds for origin and destination
 */
export function getTransitGraph(
  origin: Coordinates,
  destination: Coordinates,
  customMaxOriginWalking?: number,
  customMaxDestinationWalking?: number
): { graph: Graph; originId: string; destinationId: string } {
  // Build or retrieve the graph
  const cachedGraph = graphCache.get();
  let graph: Graph;

  if (!cachedGraph) {
    console.time('Building transit graph');
    graph = buildTransitGraph(metroLines);
    graphCache.set(graph);
    console.timeEnd('Building transit graph');
  } else {
    graph = cachedGraph.copy(); // Create a copy to avoid modifying the cached graph
  }

  // Add custom origin and destination
  const originId = 'origin';
  const destinationId = 'destination';

  // Use provided values or defaults from config
  const maxOriginWalking =
    customMaxOriginWalking || MAX_ORIGIN_WALKING_DISTANCE;
  const maxDestinationWalking =
    customMaxDestinationWalking || MAX_DESTINATION_WALKING_DISTANCE;

  // Add origin and destination nodes with appropriate walking thresholds
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

/**
 * Build a transit network graph from metro lines and stations
 */
export function buildTransitGraph(metroLines: MetroLine[]): Graph {
  const graph = new Graph<NodeData, EdgeData>();
  const stationsAdded = new Set<string>();
  const virtualNodesCreated = new Map<string, string[]>();

  // First pass: add all stations as nodes and create virtual nodes for each station on each line
  for (const line of metroLines) {
    for (const station of line.stations) {
      // Add the physical station node if not already added
      if (!stationsAdded.has(station.id)) {
        graph.addNode(station.id, { station });
        stationsAdded.add(station.id);
        virtualNodesCreated.set(station.id, []);
      }

      // Create a virtual node for this station on this line
      const virtualNodeId = `${station.id}_${line.id}`;

      // Add virtual node
      graph.addNode(virtualNodeId, {
        station,
        virtual: true,
        lineId: line.id,
      });

      // Connect physical station to its virtual node
      const connectionData: EdgeData = {
        type: 'transfer',
        duration: 15, // Small time to transfer from physical station to platform
        distance: 0,
      };

      graph.addEdge(station.id, virtualNodeId, connectionData);
      graph.addEdge(virtualNodeId, station.id, connectionData);

      // Track virtual nodes
      virtualNodesCreated.get(station.id)?.push(virtualNodeId);
    }
  }

  // Second pass: add transit edges between virtual stations on the same line
  for (const line of metroLines) {
    for (let i = 0; i < line.stations.length; i++) {
      const fromStation = line.stations[i];
      const fromVirtualId = `${fromStation.id}_${line.id}`;

      // Connect to ALL subsequent stations on the same line, not just adjacent ones
      for (let j = i + 1; j < line.stations.length; j++) {
        const toStation = line.stations[j];
        const toVirtualId = `${toStation.id}_${line.id}`;

        // Calculate distance and time between these stations
        const distance = calculateDistanceSync(
          fromStation.coordinates,
          toStation.coordinates
        );

        // Use different speeds for different transit types (default 8 m/s or ~30 km/h)
        const speed = 8;
        const duration = Math.round(distance / speed);

        // Add edges for direct connections between stations on the same line
        const edgeData: EdgeData = {
          type: 'transit',
          duration,
          distance,
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          // Use a more reasonable cost multiplier that grows logarithmically rather than linearly
          costMultiplier: j === i + 1 ? 1 : Math.log2(j - i) + 1,
        };

        graph.addEdge(fromVirtualId, toVirtualId, edgeData);
        graph.addEdge(toVirtualId, fromVirtualId, edgeData);
      }
    }
  }

  // Third pass: add transfer edges at interchange stations
  for (const stationId of stationsAdded) {
    const virtualNodes = virtualNodesCreated.get(stationId);

    if (virtualNodes && virtualNodes.length > 1) {
      // This is an interchange station with multiple lines
      for (let i = 0; i < virtualNodes.length; i++) {
        for (let j = i + 1; j < virtualNodes.length; j++) {
          // Get the line IDs from the virtual node IDs
          const lineIdA = virtualNodes[i].split('_')[1];
          const lineIdB = virtualNodes[j].split('_')[1];

          // Base transfer time with additional penalty for complex stations
          const transferTime = 90 + virtualNodes.length * 15;

          const transferData: EdgeData = {
            type: 'transfer',
            duration: transferTime,
            distance: 0,
            lineId: `${lineIdA}-${lineIdB}`, // Mark which lines this transfer connects
          };

          // Add bidirectional transfer edges
          graph.addEdge(virtualNodes[i], virtualNodes[j], transferData);
          graph.addEdge(virtualNodes[j], virtualNodes[i], transferData);
        }
      }
    }
  }

  return graph;
}

/**
 * Add custom origin and destination points to the graph with walking edges
 * Updated to ensure perfect symmetry between origin and destination
 */
function addCustomLocations(
  graph: Graph,
  originId: string,
  destinationId: string,
  origin: Coordinates,
  destination: Coordinates,
  maxOriginWalkingDistance = 800, // Default 800m origin walking
  maxDestinationWalkingDistance = 1200 // Default 1200m destination walking
): void {
  // Check and handle origin node
  if (graph.hasNode(originId)) {
    // Update existing node
    graph.setNodeAttribute(originId, 'station', {
      id: originId,
      name: 'Origin',
      coordinates: origin,
    });

    // Remove existing edges connected to this node
    const edges = [...graph.edges(originId)];
    edges.forEach((edgeId) => graph.dropEdge(edgeId));
  } else {
    // Add new node
    graph.addNode(originId, {
      station: { id: originId, name: 'Origin', coordinates: origin },
    });
  }

  // Check and handle destination node
  if (graph.hasNode(destinationId)) {
    // Update existing node
    graph.setNodeAttribute(destinationId, 'station', {
      id: destinationId,
      name: 'Destination',
      coordinates: destination,
    });

    // Remove existing edges connected to this node
    const edges = [...graph.edges(destinationId)];
    edges.forEach((edgeId) => graph.dropEdge(edgeId));
  } else {
    // Add new node
    graph.addNode(destinationId, {
      station: {
        id: destinationId,
        name: 'Destination',
        coordinates: destination,
      },
    });
  }

  // FIXED: Use the maximum threshold for both connections to ensure symmetry
  const maxWalkingThreshold = Math.max(
    maxOriginWalkingDistance,
    maxDestinationWalkingDistance
  );

  // FIXED: Always use the same threshold for both origin and destination
  connectOriginToStations(graph, originId, origin, maxWalkingThreshold);
  connectDestinationToStations(
    graph,
    destinationId,
    destination,
    maxWalkingThreshold
  );

  // Add direct walking between origin and destination
  addDirectWalking(graph, originId, destinationId, origin, destination);

  // DEBUG: Log connectivity info
  console.log(
    `Origin connected to ${graph.outNeighbors(originId).length} nodes, ` +
      `destination connected to ${
        graph.outNeighbors(destinationId).length
      } nodes`
  );

  // FIXED: Verify and enforce symmetry - ensure both endpoints have similar connectivity
  const originConnectivity = graph.outNeighbors(originId).length;
  const destConnectivity = graph.outNeighbors(destinationId).length;

  // If there's a significant imbalance in connectivity, fix it
  if (Math.abs(originConnectivity - destConnectivity) > 2) {
    console.log('Detected connectivity imbalance, enforcing symmetry');
    // Force connectivity parity by adding connections to match the better-connected endpoint
    if (originConnectivity < destConnectivity) {
      // Add more connections to origin
      improveConnectivity(graph, originId, origin, maxWalkingThreshold * 1.2);
    } else {
      // Add more connections to destination
      improveConnectivity(
        graph,
        destinationId,
        destination,
        maxWalkingThreshold * 1.2
      );
    }
  }
}

/**
 * Connect origin to nearby stations with appropriate walking edges
 */
function connectOriginToStations(
  graph: Graph,
  originId: string,
  origin: Coordinates,
  maxWalkingDistance: number
): void {
  // Find the closest station for better connectivity
  let closestStationToOrigin = null;
  let minDistanceToOrigin = Infinity;

  // First pass - find stations within standard walking distance and the closest overall
  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === 'destination' || nodeId.includes('_'))
      continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    const station = nodeData.station;
    const distance = calculateDistanceSync(origin, station.coordinates);

    // Track closest regardless of distance
    if (distance < minDistanceToOrigin) {
      minDistanceToOrigin = distance;
      closestStationToOrigin = nodeId;
    }

    // Add standard walking edges within threshold with IDENTICAL logic as destination
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

  // FIXED: Make virtual node connection logic identical to destination
  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistanceSync(origin, station.coordinates);

    // Apply IDENTICAL connection rules for origin and destination
    if (distance < maxWalkingDistance * 1.5) {
      if (distance < minDistanceToOrigin * 2.0) {
        const duration = calculateWalkingDuration(distance);
        // Small bonus for direct line access - identical to destination
        graph.addEdge(originId, nodeId, {
          type: 'walking',
          duration: duration * 0.95, // Same scaling factor
          distance,
        });
        graph.addEdge(nodeId, originId, {
          type: 'walking',
          duration: duration * 0.95, // Same scaling factor
          distance,
        });
      }
    }
  }

  // Always ensure connectivity by connecting to closest station with appropriate penalties
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

  // Always connect to at least 3 stations if possible, using IDENTICAL logic as destination
  const connectedStations = graph.outNeighbors(originId);
  if (connectedStations.length < 3) {
    // Find stations to connect to
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
      .slice(0, 5); // Get 5 closest

    for (const station of stations) {
      if (!graph.hasEdge(originId, station.id)) {
        const duration = calculateWalkingDuration(station.distance);
        // Add connection with appropriate penalty - IDENTICAL to destination
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

/**
 * Connect destination to nearby stations with appropriate walking edges
 */
function connectDestinationToStations(
  graph: Graph,
  destinationId: string,
  destination: Coordinates,
  maxWalkingDistance: number
): void {
  // Similar improvements as connectOriginToStations
  let closestStationToDest = null;
  let minDistanceToDest = Infinity;

  // First pass - find stations within walking distance and the closest overall
  for (const nodeId of graph.nodes()) {
    if (nodeId === 'origin' || nodeId === destinationId || nodeId.includes('_'))
      continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    const station = nodeData.station;
    const distance = calculateDistanceSync(destination, station.coordinates);

    // Track closest regardless of distance
    if (distance < minDistanceToDest) {
      minDistanceToDest = distance;
      closestStationToDest = nodeId;
    }

    // Add standard walking edges within threshold
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

  // Improved: More permissive connection to virtual nodes
  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistanceSync(destination, station.coordinates);

    // More permissive connection rules (same as origin)
    if (distance < maxWalkingDistance * 1.5) {
      if (distance < minDistanceToDest * 2.0) {
        const duration = calculateWalkingDuration(distance);
        // Small bonus for direct line access
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

  // Always ensure connectivity by connecting to closest station with appropriate penalties
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

  // New: Always connect to at least 3 stations if possible (same as origin)
  const connectedStations = graph.outNeighbors(destinationId);
  if (connectedStations.length < 3) {
    // Find stations to connect to
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
      .slice(0, 5); // Get 5 closest

    for (const station of stations) {
      if (!graph.hasEdge(destinationId, station.id)) {
        const duration = calculateWalkingDuration(station.distance);
        // Add connection with appropriate penalty
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

/**
 * Ensure connectivity between a point and its closest station, with appropriate penalties for distance
 */
function ensureStationConnectivity(
  graph: Graph,
  pointId: string,
  stationId: string,
  pointCoordinates: Coordinates,
  distance: number,
  standardDistance: number
): void {
  const duration = calculateWalkingDuration(distance);

  // Within standard range - already connected above
  if (distance <= standardDistance) {
    return;
  }
  // Extended range - mild penalty
  else if (distance <= standardDistance * 1.5) {
    const penaltyFactor = 1.1;
    graph.addEdge(pointId, stationId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
    graph.addEdge(stationId, pointId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
  }
  // Far range - stronger penalty
  else if (distance <= standardDistance * 2.5) {
    const penaltyFactor = 1.5;
    graph.addEdge(pointId, stationId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
    graph.addEdge(stationId, pointId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
  }
  // Very distant - extreme penalty but still connected
  else {
    // Scale penalty with distance but cap it
    const penaltyFactor = Math.min(
      3.0,
      1.0 + (distance - standardDistance * 2.5) / 1000
    );
    graph.addEdge(pointId, stationId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
    graph.addEdge(stationId, pointId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance,
      costMultiplier: penaltyFactor,
    });
  }
}

/**
 * Add direct walking between origin and destination
 */
function addDirectWalking(
  graph: Graph,
  originId: string,
  destinationId: string,
  origin: Coordinates,
  destination: Coordinates
): void {
  const directDistance = calculateDistanceSync(origin, destination);
  const duration = calculateWalkingDuration(directDistance);

  graph.addEdge(originId, destinationId, {
    type: 'walking',
    duration,
    distance: directDistance,
  });

  graph.addEdge(destinationId, originId, {
    type: 'walking',
    duration,
    distance: directDistance,
  });
}

/**
 * Improve connectivity for an endpoint that has fewer connections
 * NEW: Added to enforce symmetry between origin and destination
 */
function improveConnectivity(
  graph: Graph,
  nodeId: string,
  coordinates: Coordinates,
  maxDistance: number
): void {
  const currentNeighbors = new Set(graph.outNeighbors(nodeId));

  // Find all potential stations to connect to
  const potentialStations = Array.from(graph.nodes())
    .filter(
      (id) =>
        !id.includes('_') &&
        id !== nodeId &&
        id !== 'origin' &&
        id !== 'destination'
    )
    .filter((id) => !currentNeighbors.has(id))
    .map((id) => ({
      id,
      station: graph.getNodeAttributes(id).station,
      distance: calculateDistanceSync(
        coordinates,
        graph.getNodeAttributes(id).station.coordinates
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  // Connect to closer stations first
  for (let i = 0; i < Math.min(potentialStations.length, 3); i++) {
    const station = potentialStations[i];

    // Don't connect if too far
    if (station.distance > maxDistance) continue;

    const duration = calculateWalkingDuration(station.distance);
    const penaltyFactor = 1 + station.distance / (maxDistance / 2);

    // Add the connection
    graph.addEdge(nodeId, station.id, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance: station.distance,
      costMultiplier: penaltyFactor,
    });

    graph.addEdge(station.id, nodeId, {
      type: 'walking',
      duration: Math.round(duration * penaltyFactor),
      distance: station.distance,
      costMultiplier: penaltyFactor,
    });
  }
}
