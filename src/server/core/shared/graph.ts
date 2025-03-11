import Graph from 'graphology';
import { MetroLine } from '@/types/metro';
import { Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import { WALKING_SPEED_MPS } from '@/lib/constants/config';
import { WALKING_SEGMENT_PENALTIES } from '@/lib/constants/route-config';
import { EdgeData, NodeData } from '@/server/core/transit/route/graph';

export function calculateWalkingDuration(distance: number): number {
  const baseDuration = Math.round(distance / WALKING_SPEED_MPS);
  const { SHORT, MEDIUM, LONG, VERY_LONG, EXTREME } = WALKING_SEGMENT_PENALTIES;

  if (distance <= SHORT) return baseDuration;
  if (distance <= MEDIUM) return Math.round(baseDuration * 1.1);
  if (distance <= LONG) return Math.round(baseDuration * 1.3);
  if (distance <= VERY_LONG) return Math.round(baseDuration * 1.5);
  if (distance <= EXTREME) return Math.round(baseDuration * 1.8);
  return Math.round(baseDuration * 3.0);
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
