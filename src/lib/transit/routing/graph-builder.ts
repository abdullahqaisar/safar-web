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
}

// Node data interface
export interface NodeData {
  station: Station;
  virtual?: boolean;
  lineId?: string;
}

/**
 * Get the transit graph with origin and destination nodes added
 */
export function getTransitGraph(
  origin: Coordinates,
  destination: Coordinates,
  maxWalkingDistance = 2000 // Maximum walking distance in meters
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

  // First pass: add all stations as nodes
  for (const line of metroLines) {
    for (const station of line.stations) {
      if (!stationsAdded.has(station.id)) {
        graph.addNode(station.id, { station });
        stationsAdded.add(station.id);
      }
    }
  }

  // Second pass: add transit edges between stations on the same line
  for (const line of metroLines) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const fromStation = line.stations[i];
      const toStation = line.stations[i + 1];

      // Calculate time and distance between stations
      const distance = calculateDistance(
        { coordinates: fromStation.coordinates },
        { coordinates: toStation.coordinates }
      );

      // Use different speeds for different transit types
      const speed = 8; // Default average speed in m/s (roughly 30 km/h)

      const duration = Math.round(distance / speed);

      // Add bidirectional edges
      const edgeData: EdgeData = {
        type: 'transit',
        duration,
        distance,
        lineId: line.id,
        lineName: line.name,
        lineColor: line.color,
      };

      // Add edges in both directions (for bidirectional transit)
      if (!graph.hasEdge(fromStation.id, toStation.id)) {
        graph.addEdge(fromStation.id, toStation.id, edgeData);
      }
      if (!graph.hasEdge(toStation.id, fromStation.id)) {
        graph.addEdge(toStation.id, fromStation.id, edgeData);
      }
    }
  }

  // Third pass: add transfer edges at stations served by multiple lines
  const stationLines = new Map<string, MetroLine[]>();

  for (const line of metroLines) {
    for (const station of line.stations) {
      const lines = stationLines.get(station.id) || [];
      lines.push(line);
      stationLines.set(station.id, lines);
    }
  }

  // Add transfer edges at interchange stations
  for (const [stationId, lines] of stationLines.entries()) {
    if (lines.length > 1) {
      // This is an interchange station with multiple lines

      // First create virtual nodes for each line at this station
      const virtualNodes: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const virtualNodeId = `${stationId}_${line.id}`;

        // Get the actual station data
        const station = graph.getNodeAttributes(stationId).station;

        // Add virtual node if it doesn't exist
        if (!graph.hasNode(virtualNodeId)) {
          graph.addNode(virtualNodeId, {
            station,
            virtual: true,
            lineId: line.id,
          });
          virtualNodes.push(virtualNodeId);
        }

        // Connect main station node to its virtual node (crucial fix)
        // This ensures passengers can enter the station from any line
        const mainToVirtualData: EdgeData = {
          type: 'transfer',
          duration: 30, // Short transfer time within same station
          distance: 0,
        };

        if (!graph.hasEdge(stationId, virtualNodeId)) {
          graph.addEdge(stationId, virtualNodeId, mainToVirtualData);
          graph.addEdge(virtualNodeId, stationId, mainToVirtualData);
        }
      }

      // Now connect virtual nodes to each other (transfers between lines)
      for (let i = 0; i < virtualNodes.length; i++) {
        for (let j = i + 1; j < virtualNodes.length; j++) {
          const nodeA = virtualNodes[i];
          const nodeB = virtualNodes[j];

          // Base transfer time plus additional time based on station complexity
          const transferTime = 90 + lines.length * 15;

          const transferData: EdgeData = {
            type: 'transfer',
            duration: transferTime,
            distance: 0,
          };

          graph.addEdge(nodeA, nodeB, transferData);
          graph.addEdge(nodeB, nodeA, transferData);
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
  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === destinationId) continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    if (nodeData.virtual) continue; // Skip virtual nodes

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: origin },
      { coordinates: station.coordinates }
    );

    // Only add walking edges for stations within walking distance
    if (distance <= maxWalkingDistance) {
      const duration = Math.round(distance / WALKING_SPEED_MPS);

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

  // Connect destination to nearby stations with walking edges
  for (const nodeId of graph.nodes()) {
    if (nodeId === originId || nodeId === destinationId) continue;

    const nodeData = graph.getNodeAttributes(nodeId);
    if (nodeData.virtual) continue; // Skip virtual nodes

    const station = nodeData.station;
    const distance = calculateDistance(
      { coordinates: destination },
      { coordinates: station.coordinates }
    );

    // Only add walking edges for stations within walking distance
    if (distance <= maxWalkingDistance) {
      const duration = Math.round(distance / WALKING_SPEED_MPS);

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

  const directDistance = calculateDistance(
    { coordinates: origin },
    { coordinates: destination }
  );

  if (directDistance <= maxWalkingDistance * 1.5) {
    const duration = Math.round(directDistance / WALKING_SPEED_MPS);

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
}
