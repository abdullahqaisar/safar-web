import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import {
  MAX_AUTO_WALKING_SHORTCUT_DISTANCE,
  WALKING_SPEED_MPS,
} from '@/lib/constants/config';
import { WALKING_SEGMENT_PENALTIES } from '@/lib/constants/route-config';
import { EdgeData, NodeData } from '@/server/core/journey/route/graph';

export function calculateWalkingDuration(distance: number): number {
  const baseDuration = Math.round(distance / WALKING_SPEED_MPS);
  const { SHORT, MEDIUM, LONG, VERY_LONG, EXTREME } = WALKING_SEGMENT_PENALTIES;

  // Consistent penalty calculation based on thresholds
  if (distance <= SHORT) return baseDuration;
  if (distance <= MEDIUM) return Math.round(baseDuration * 1.1);
  if (distance <= LONG) return Math.round(baseDuration * 1.3);
  if (distance <= VERY_LONG) return Math.round(baseDuration * 1.5);
  if (distance <= EXTREME) return Math.round(baseDuration * 1.8);

  // For extremely long walks, use a higher penalty but cap it
  // This avoids unreasonably high penalties while still discouraging very long walks
  const penaltyFactor = Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / 2000) * 1.2
  );
  return Math.round(baseDuration * penaltyFactor);
}

// Add this new helper function for calculating walking penalties
export function calculateWalkingPenalty(
  distance: number,
  maxRecommendedDistance: number
): number {
  // Base the penalty calculation on the same thresholds for consistency
  const { SHORT, MEDIUM, LONG, VERY_LONG, EXTREME } = WALKING_SEGMENT_PENALTIES;

  if (distance <= SHORT) return 1.0;
  if (distance <= MEDIUM) return 1.1;
  if (distance <= LONG) return 1.3;
  if (distance <= VERY_LONG) return 1.5;
  if (distance <= EXTREME) return 1.8;

  // For distances beyond EXTREME, use a graduated penalty
  return Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / maxRecommendedDistance) * 1.2
  );
}

/**
 * Calculate walking duration with variable penalties based on distance
 * and other contextual factors
 */
export function calculateContextAwareWalkingDuration(
  distance: number,
  maxRecommendedDistance: number,
  context: 'origin' | 'destination' | 'transfer' = 'transfer'
): number {
  const baseDuration = Math.round(distance / WALKING_SPEED_MPS);

  // Base penalties from standard walking calculation
  const penaltyFactor = calculateWalkingPenalty(
    distance,
    maxRecommendedDistance
  );

  // Context-specific adjustments
  let contextMultiplier = 1.0;

  if (context === 'origin') {
    // People are more willing to walk at the start of a journey
    contextMultiplier = distance > maxRecommendedDistance ? 0.95 : 1.0;
  } else if (context === 'destination') {
    // People may be less willing to walk at the end of a journey
    contextMultiplier = distance > maxRecommendedDistance ? 1.05 : 1.0;
  }

  return Math.round(baseDuration * penaltyFactor * contextMultiplier);
}

export function addStationsAndVirtualNodes(
  graph: Graph<NodeData, EdgeData>,
  metroLines: MetroLine[],
  stationsAdded: Set<string>,
  virtualNodesCreated: Map<string, string[]>
): void {
  for (const line of metroLines) {
    for (const station of line.stations) {
      if (!stationsAdded.has(station.id)) {
        graph.addNode(station.id, { station });
        stationsAdded.add(station.id);
        virtualNodesCreated.set(station.id, []);
      }

      const virtualNodeId = `${station.id}_${line.id}`;
      graph.addNode(virtualNodeId, {
        station,
        virtual: true,
        lineId: line.id,
      });

      const connectionData: EdgeData = {
        type: 'transfer',
        duration: 15,
        distance: 0,
      };

      graph.addEdge(station.id, virtualNodeId, connectionData);
      graph.addEdge(virtualNodeId, station.id, connectionData);

      virtualNodesCreated.get(station.id)?.push(virtualNodeId);
    }
  }
}

export function addTransitEdges(
  graph: Graph<NodeData, EdgeData>,
  metroLines: MetroLine[]
): void {
  for (const line of metroLines) {
    for (let i = 0; i < line.stations.length; i++) {
      const fromStation = line.stations[i];
      const fromVirtualId = `${fromStation.id}_${line.id}`;

      for (let j = i + 1; j < line.stations.length; j++) {
        const toStation = line.stations[j];
        const toVirtualId = `${toStation.id}_${line.id}`;

        const distance = calculateDistanceSync(
          fromStation.coordinates,
          toStation.coordinates
        );

        const speed = 8;
        const duration = Math.round(distance / speed);

        const edgeData: EdgeData = {
          type: 'transit',
          duration,
          distance,
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          costMultiplier: j === i + 1 ? 1 : Math.log2(j - i) + 1,
        };

        graph.addEdge(fromVirtualId, toVirtualId, edgeData);
        graph.addEdge(toVirtualId, fromVirtualId, edgeData);
      }
    }
  }
}

export function addTransferEdges(
  graph: Graph<NodeData, EdgeData>,
  stationsAdded: Set<string>,
  virtualNodesCreated: Map<string, string[]>,
  transferTimes: { BASE: number; PER_LINE: number }
): void {
  const { BASE, PER_LINE } = transferTimes;

  for (const stationId of stationsAdded) {
    const virtualNodes = virtualNodesCreated.get(stationId);

    if (virtualNodes && virtualNodes.length > 1) {
      for (let i = 0; i < virtualNodes.length; i++) {
        for (let j = i + 1; j < virtualNodes.length; j++) {
          const lineIdA = virtualNodes[i].split('_')[1];
          const lineIdB = virtualNodes[j].split('_')[1];

          const transferTime = BASE + virtualNodes.length * PER_LINE;

          const transferData: EdgeData = {
            type: 'transfer',
            duration: transferTime,
            distance: 0,
            lineId: `${lineIdA}-${lineIdB}`,
          };

          graph.addEdge(virtualNodes[i], virtualNodes[j], transferData);
          graph.addEdge(virtualNodes[j], virtualNodes[i], transferData);
        }
      }
    }
  }
}

export function addDirectWalking(
  graph: Graph<NodeData, EdgeData>,
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

export function ensureStationConnectivity(
  graph: Graph<NodeData, EdgeData>,
  pointId: string,
  stationId: string,
  pointCoordinates: Coordinates,
  distance: number,
  standardDistance: number
): void {
  const duration = calculateWalkingDuration(distance);

  if (distance <= standardDistance) {
    return;
  } else if (distance <= standardDistance * 1.5) {
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
  } else if (distance <= standardDistance * 2.5) {
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
  } else {
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

export function improveConnectivity(
  graph: Graph<NodeData, EdgeData>,
  nodeId: string,
  coordinates: Coordinates,
  maxDistance: number
): void {
  const currentNeighbors = new Set(graph.outNeighbors(nodeId));

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

  for (let i = 0; i < Math.min(potentialStations.length, 3); i++) {
    const station = potentialStations[i];

    if (station.distance > maxDistance) continue;

    const duration = calculateWalkingDuration(station.distance);
    const penaltyFactor = 1 + station.distance / (maxDistance / 2);

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

export function getEdgeCounts(
  paths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): Map<string, number> {
  const edgeCounts = new Map<string, number>();

  paths.forEach(({ edges }) => {
    edges.forEach((edge) => {
      if (edge.type === 'transit' && edge.lineId) {
        const key = `${edge.source}-${edge.target}-${edge.lineId}`;
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    });
  });

  return edgeCounts;
}

export function extractEdgesFromPath(
  graph: Graph<NodeData, EdgeData>,
  path: string[]
): Array<EdgeData & { source: string; target: string }> {
  const edges: Array<EdgeData & { source: string; target: string }> = [];

  for (let i = 0; i < path.length - 1; i++) {
    const edgeKey = graph.edge(path[i], path[i + 1]);
    if (edgeKey) {
      const edgeData = graph.getEdgeAttributes(edgeKey);
      edges.push({
        source: path[i],
        target: path[i + 1],
        ...edgeData,
      });
    }
  }

  return edges;
}

export function areSimilarPaths(path1: string[], path2: string[]): boolean {
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

  const intersection = new Set(
    [...transitNodes1].filter((node) => transitNodes2.has(node))
  );
  const union = new Set([...transitNodes1, ...transitNodes2]);

  if (union.size === 0) return false;

  return intersection.size / union.size > 0.7;
}

export function penalizeCommonEdges(
  graph: Graph<NodeData, EdgeData>,
  commonEdges: string[]
): void {
  graph.forEachEdge(
    (edge: string, attributes: EdgeData, source: string, target: string) => {
      if (attributes.type === 'transit' && attributes.lineId) {
        const key = `${source}-${target}-${attributes.lineId}`;
        if (commonEdges.includes(key)) {
          graph.setEdgeAttribute(edge, 'duration', attributes.duration * 2);
        }
      }
    }
  );
}

/**
 * Adds explicitly defined walking shortcuts between stations
 * These are known good shortcuts based on local knowledge rather than
 * being dynamically calculated
 */
export function addExplicitWalkingShortcuts(
  graph: Graph<NodeData, EdgeData>,
  shortcuts: Array<{
    from: string;
    to: string;
    distance?: number;
    duration?: number;
    priority: number;
  }>
): void {
  console.log(`Adding ${shortcuts.length} explicit walking shortcuts`);

  let shortcutsAdded = 0;

  for (const shortcut of shortcuts) {
    if (!graph.hasNode(shortcut.from) || !graph.hasNode(shortcut.to)) {
      console.warn(
        `Cannot add shortcut: node not found - ${shortcut.from} or ${shortcut.to}`
      );
      continue;
    }

    // Get station data
    const fromNodeData = graph.getNodeAttributes(shortcut.from);
    const toNodeData = graph.getNodeAttributes(shortcut.to);

    // Calculate distance if not provided
    const distance =
      shortcut.distance ||
      calculateDistanceSync(
        fromNodeData.station.coordinates,
        toNodeData.station.coordinates
      );

    // Calculate duration if not provided
    const baseDuration =
      shortcut.duration || calculateWalkingDuration(distance);

    // Prioritize these explicit shortcuts with favorable multipliers
    // Higher priority shortcuts get more favorable cost multipliers
    const priorityDiscount = Math.min(0.5, shortcut.priority / 20); // 0-0.5 based on priority
    const costMultiplier = Math.max(0.7, 1.0 - priorityDiscount);

    // Create the forward edge data
    const forwardWalkingData: EdgeData = {
      type: 'walking',
      duration: Math.round(baseDuration * costMultiplier),
      distance: distance,
      costMultiplier: costMultiplier,
      isShortcut: true,
      isExplicitShortcut: true, // Mark as an explicitly defined shortcut
      priority: shortcut.priority,
    };

    // Create a separate object for the reverse direction
    const reverseWalkingData: EdgeData = { ...forwardWalkingData };

    // Add or update forward edge
    if (!graph.hasEdge(shortcut.from, shortcut.to)) {
      graph.addEdge(shortcut.from, shortcut.to, forwardWalkingData);
      shortcutsAdded++;
    } else {
      // Update existing edge with this better data
      const edgeId = graph.edge(shortcut.from, shortcut.to);
      // Fix: Set each attribute individually since setEdgeAttributes doesn't exist
      for (const [key, value] of Object.entries(forwardWalkingData)) {
        graph.setEdgeAttribute(edgeId, key as keyof EdgeData, value);
      }
    }

    // Add or update reverse edge
    if (!graph.hasEdge(shortcut.to, shortcut.from)) {
      graph.addEdge(shortcut.to, shortcut.from, reverseWalkingData);
      shortcutsAdded++;
    } else {
      // Update existing edge with this better data
      const edgeId = graph.edge(shortcut.to, shortcut.from);
      // Fix: Set each attribute individually
      for (const [key, value] of Object.entries(reverseWalkingData)) {
        graph.setEdgeAttribute(edgeId, key as keyof EdgeData, value);
      }
    }
  }

  console.log(`Added ${shortcutsAdded} explicit walking shortcut edges`);
}

/**
 * Adds walking shortcuts between nearby stations that aren't on the same line.
 * These shortcuts allow transfers by walking instead of using transit connections.
 */
export function addWalkingShortcuts(
  graph: Graph<NodeData, EdgeData>,
  explicitShortcuts: Array<{
    from: string;
    to: string;
    distance?: number;
    priority: number;
  }> = []
): void {
  // First process explicit shortcuts which take precedence
  if (explicitShortcuts.length > 0) {
    addExplicitWalkingShortcuts(graph, explicitShortcuts);
  }

  // Get a set of shortcuts that were explicitly defined to avoid duplicating them
  const explicitShortcutPairs = new Set<string>();
  for (const shortcut of explicitShortcuts) {
    explicitShortcutPairs.add(`${shortcut.from}-${shortcut.to}`);
    explicitShortcutPairs.add(`${shortcut.to}-${shortcut.from}`);
  }

  // Now identify all regular station nodes (not virtual nodes or origin/destination)
  const stationNodes = Array.from(graph.nodes()).filter(
    (id) => !id.includes('_') && id !== 'origin' && id !== 'destination'
  );

  console.log(
    `Evaluating additional walking shortcuts between ${stationNodes.length} stations...`
  );

  // Track the number of shortcuts added
  let shortcutsAdded = 0;

  // For each pair of stations, check if a walking shortcut is viable
  for (let i = 0; i < stationNodes.length; i++) {
    const stationA = stationNodes[i];
    const nodeDataA = graph.getNodeAttributes(stationA);

    for (let j = i + 1; j < stationNodes.length; j++) {
      const stationB = stationNodes[j];
      const nodeDataB = graph.getNodeAttributes(stationB);

      // Skip if this is an explicit shortcut pair - already handled
      if (explicitShortcutPairs.has(`${stationA}-${stationB}`)) {
        continue;
      }

      // Skip if stations are already directly connected through transit
      if (areStationsDirectlyConnected(graph, stationA, stationB)) {
        continue;
      }

      // Calculate distance between stations
      const distance = calculateDistanceSync(
        nodeDataA.station.coordinates,
        nodeDataB.station.coordinates
      );

      // Use a stricter limit for auto-discovered shortcuts compared to explicit ones
      // This prevents the system from suggesting too many long walking paths
      const autoDiscoveryLimit = MAX_AUTO_WALKING_SHORTCUT_DISTANCE;

      // Only add shortcut if it's within our maximum walking distance
      if (distance <= autoDiscoveryLimit) {
        // Calculate walking duration with a penalty based on distance
        const baseDuration = calculateWalkingDuration(distance);

        // Use much more aggressive penalties for longer walks
        // This makes them less likely to be chosen compared to explicit shortcuts
        let costMultiplier;
        if (distance <= 300) {
          costMultiplier = 0.95; // Very short distances are fine
        } else if (distance <= 400) {
          costMultiplier = 1.0; // Default multiplier for moderate distances
        } else if (distance <= 500) {
          costMultiplier = 1.2; // Start penalizing more heavily
        } else {
          // Strong penalty for longer auto-discovered shortcuts
          costMultiplier = 1.5 + ((distance - 500) / 100) * 0.3;
        }

        // Create forward walking data
        const forwardWalkingData: EdgeData = {
          type: 'walking',
          duration: Math.round(baseDuration * costMultiplier),
          distance: distance,
          costMultiplier: costMultiplier,
          isShortcut: true,
          isExplicitShortcut: false, // Mark as a dynamically calculated shortcut
        };

        // Create separate object for reverse direction
        const reverseWalkingData: EdgeData = { ...forwardWalkingData };

        // Add bidirectional edges
        graph.addEdge(stationA, stationB, forwardWalkingData);
        graph.addEdge(stationB, stationA, reverseWalkingData);

        shortcutsAdded += 2; // Counting both directions
      }
    }
  }

  console.log(
    `Added ${shortcutsAdded} additional walking shortcut edges between nearby stations`
  );
}

/**
 * Checks if two stations are directly connected via a transit line
 */
function areStationsDirectlyConnected(
  graph: Graph<NodeData, EdgeData>,
  stationA: string,
  stationB: string
): boolean {
  // Get virtual nodes for each station
  const virtualNodesA = graph
    .neighbors(stationA)
    .filter((n) => n.includes('_'));
  const virtualNodesB = graph
    .neighbors(stationB)
    .filter((n) => n.includes('_'));

  // Check if any virtual node of A is directly connected to any virtual node of B
  for (const nodeA of virtualNodesA) {
    for (const nodeB of virtualNodesB) {
      // Extract line IDs
      const lineA = nodeA.split('_')[1];
      const lineB = nodeB.split('_')[1];

      // If they're on the same line, check for direct connection
      if (lineA === lineB) {
        if (graph.hasEdge(nodeA, nodeB) || graph.hasEdge(nodeB, nodeA)) {
          return true;
        }
      }
    }
  }

  return false;
}
