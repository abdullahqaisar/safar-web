import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Station, Coordinates } from '@/types/station';
import { calculateDistance } from '@/lib/utils/geo';
import { WALKING_SPEED_MPS } from '@/lib/constants/config';
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
 */
export function getTransitGraph(
  origin: Coordinates,
  destination: Coordinates,
  maxWalkingDistance: number
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

  // Add origin and destination nodes
  addCustomLocations(
    graph,
    originId,
    destinationId,
    origin,
    destination,
    maxWalkingDistance
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
        const distance = calculateDistance(
          { coordinates: fromStation.coordinates },
          { coordinates: toStation.coordinates }
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
 */
function addCustomLocations(
  graph: Graph,
  originId: string,
  destinationId: string,
  origin: Coordinates,
  destination: Coordinates,
  maxWalkingDistance = 2000 // Maximum walking distance in meters
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

  // Connect origin to nearby stations with walking edges
  // First find the closest station for better connectivity
  let closestStationToOrigin = null;
  let minDistanceToOrigin = Infinity;
  let closestVirtualNodeToOrigin = null;

  // First pass - find all physical stations within range and the closest one
  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === destinationId) continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    if (nodeData.virtual) continue; // Skip virtual nodes for now

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: origin },
      { coordinates: station.coordinates }
    );

    if (distance < minDistanceToOrigin) {
      minDistanceToOrigin = distance;
      closestStationToOrigin = nodeId;
    }

    // Only add walking edges for stations within walking distance
    if (distance <= maxWalkingDistance) {
      // Use new function that applies distance-based penalties
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

  // Second pass - find closest virtual node for direct line access
  // This helps with finding better transit routes
  let minVirtualDistance = Infinity;
  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: origin },
      { coordinates: station.coordinates }
    );

    if (distance < minVirtualDistance && distance <= maxWalkingDistance * 1.2) {
      minVirtualDistance = distance;
      closestVirtualNodeToOrigin = nodeId;
    }
  }

  // If a close virtual node was found, connect directly to it as well
  // This creates more direct connections to transit lines
  if (closestVirtualNodeToOrigin) {
    const duration = calculateWalkingDuration(minVirtualDistance);
    graph.addEdge(originId, closestVirtualNodeToOrigin, {
      type: 'walking',
      duration: duration * 0.9, // Slight bonus for direct line access
      distance: minVirtualDistance,
    });
    graph.addEdge(closestVirtualNodeToOrigin, originId, {
      type: 'walking',
      duration: duration * 0.9,
      distance: minVirtualDistance,
    });
  }

  // If the closest station is beyond walking distance but within an extended range,
  // connect to it anyway to ensure graph connectivity
  if (
    closestStationToOrigin &&
    minDistanceToOrigin > maxWalkingDistance &&
    minDistanceToOrigin <= maxWalkingDistance * 1.5
  ) {
    const duration = calculateWalkingDuration(minDistanceToOrigin);

    graph.addEdge(originId, closestStationToOrigin, {
      type: 'walking',
      duration,
      distance: minDistanceToOrigin,
    });

    graph.addEdge(closestStationToOrigin, originId, {
      type: 'walking',
      duration,
      distance: minDistanceToOrigin,
    });
  }

  // Now do the same for destination
  // Connect destination to nearby stations with walking edges
  // Find the closest station to destination
  let closestStationToDest = null;
  let minDistanceToDest = Infinity;
  let closestVirtualNodeToDest = null;

  // First pass for physical stations
  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === destinationId) continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    if (nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: destination },
      { coordinates: station.coordinates }
    );

    if (distance < minDistanceToDest) {
      minDistanceToDest = distance;
      closestStationToDest = nodeId;
    }

    // Only add walking edges for stations within walking distance
    if (distance <= maxWalkingDistance) {
      // Use new function that applies distance-based penalties
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

  // Second pass for virtual nodes
  let minVirtualDistanceToDest = Infinity;
  for (const nodeId of graph.nodes()) {
    const nodeData = graph.getNodeAttributes(nodeId);
    if (!nodeData.virtual) continue;

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: destination },
      { coordinates: station.coordinates }
    );

    if (
      distance < minVirtualDistanceToDest &&
      distance <= maxWalkingDistance * 1.2
    ) {
      minVirtualDistanceToDest = distance;
      closestVirtualNodeToDest = nodeId;
    }
  }

  // Connect directly to closest virtual node
  if (closestVirtualNodeToDest) {
    const duration = calculateWalkingDuration(minVirtualDistanceToDest);
    graph.addEdge(destinationId, closestVirtualNodeToDest, {
      type: 'walking',
      duration: duration * 0.9, // Slight bonus for direct line access
      distance: minVirtualDistanceToDest,
    });
    graph.addEdge(closestVirtualNodeToDest, destinationId, {
      type: 'walking',
      duration: duration * 0.9,
      distance: minVirtualDistanceToDest,
    });
  }

  // If the closest station is beyond walking distance but within an extended range,
  // connect to it anyway to ensure graph connectivity
  if (
    closestStationToDest &&
    minDistanceToDest > maxWalkingDistance &&
    minDistanceToDest <= maxWalkingDistance * 1.5
  ) {
    const duration = calculateWalkingDuration(minDistanceToDest);

    graph.addEdge(destinationId, closestStationToDest, {
      type: 'walking',
      duration,
      distance: minDistanceToDest,
    });

    graph.addEdge(closestStationToDest, destinationId, {
      type: 'walking',
      duration,
      distance: minDistanceToDest,
    });
  }

  // Always add direct walking between origin and destination
  const directDistance = calculateDistance(
    { coordinates: origin },
    { coordinates: destination }
  );

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
