import Graph from 'graphology';
import { NodeData, EdgeData } from '@/server/core/journey/route/graph';
import {
  MAX_AUTO_WALKING_SHORTCUT_DISTANCE,
  WALKING_SPEED_MPS,
} from '@/lib/constants/config';
import { WALKING_SEGMENT_PENALTIES } from '@/lib/constants/route-config';
import { Coordinates } from '@/types/station';
import { calculateDistanceSync } from './distance';
import { MetroLine } from '@/types/metro';
import { extractLineIdFromNodeId } from './line-utils';

export function calculateWalkingDuration(distance: number): number {
  const baseDuration = Math.round(distance / WALKING_SPEED_MPS);
  const { SHORT, MEDIUM, LONG, VERY_LONG, EXTREME } = WALKING_SEGMENT_PENALTIES;

  if (distance <= SHORT) return baseDuration;
  if (distance <= MEDIUM) return Math.round(baseDuration * 1.1);
  if (distance <= LONG) return Math.round(baseDuration * 1.3);
  if (distance <= VERY_LONG) return Math.round(baseDuration * 1.5);
  if (distance <= EXTREME) return Math.round(baseDuration * 1.8);

  const penaltyFactor = Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / 2000) * 1.2
  );
  return Math.round(baseDuration * penaltyFactor);
}

export function calculateWalkingPenalty(
  distance: number,
  maxRecommendedDistance: number
): number {
  const { SHORT, MEDIUM, LONG, VERY_LONG, EXTREME } = WALKING_SEGMENT_PENALTIES;

  if (distance <= SHORT) return 1.0;
  if (distance <= MEDIUM) return 1.1;
  if (distance <= LONG) return 1.3;
  if (distance <= VERY_LONG) return 1.5;
  if (distance <= EXTREME) return 1.8;

  return Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / maxRecommendedDistance) * 1.2
  );
}

export function areSimilarPaths(
  pathA: Array<string>,
  pathB: Array<string>,
  threshold: number = 0.8
): boolean {
  if (
    pathA.length === pathB.length &&
    pathA.every((node, i) => node === pathB[i])
  ) {
    return true;
  }

  const extractStationsAndLines = (
    path: string[]
  ): { stations: Set<string>; lines: Set<string> } => {
    const stations = new Set<string>();
    const lines = new Set<string>();

    for (const node of path) {
      if (node === 'origin' || node === 'destination') continue;

      if (node.includes('_')) {
        const [stationId, lineId] = node.split('_');
        if (stationId) stations.add(stationId);
        if (lineId) lines.add(lineId);
      } else {
        stations.add(node);
      }
    }

    return { stations, lines };
  };

  const pathAInfo = extractStationsAndLines(pathA);
  const pathBInfo = extractStationsAndLines(pathB);

  const stationIntersection = new Set<string>();
  for (const station of pathAInfo.stations) {
    if (pathBInfo.stations.has(station)) {
      stationIntersection.add(station);
    }
  }

  const lineIntersection = new Set<string>();
  for (const line of pathAInfo.lines) {
    if (pathBInfo.lines.has(line)) {
      lineIntersection.add(line);
    }
  }

  const stationSimilarity =
    pathAInfo.stations.size > 0 && pathBInfo.stations.size > 0
      ? stationIntersection.size /
        Math.min(pathAInfo.stations.size, pathBInfo.stations.size)
      : 0;

  const lineSimilarity =
    pathAInfo.lines.size > 0 && pathBInfo.lines.size > 0
      ? lineIntersection.size /
        Math.min(pathAInfo.lines.size, pathBInfo.lines.size)
      : 0;

  const overallSimilarity =
    pathAInfo.lines.size > 0 && pathBInfo.lines.size > 0
      ? 0.3 * stationSimilarity + 0.7 * lineSimilarity
      : stationSimilarity;

  return overallSimilarity >= threshold;
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

export function penalizeCommonEdges(
  graph: Graph<NodeData, EdgeData>,
  edgeKeys: Array<string> | Array<{ key: string; count: number }>
): void {
  for (const edgeInfo of edgeKeys) {
    const key = typeof edgeInfo === 'string' ? edgeInfo : edgeInfo.key;
    const count = typeof edgeInfo === 'string' ? 2 : edgeInfo.count;

    const [source, target] = key.split('->');

    if (graph.hasEdge(source, target)) {
      const edgeKey = graph.edge(source, target);
      const edgeData = graph.getEdgeAttributes(edgeKey);

      const penaltyFactor = Math.pow(5, count - 1);

      graph.setEdgeAttribute(
        edgeKey,
        'duration',
        edgeData.duration * penaltyFactor
      );

      graph.setEdgeAttribute(edgeKey, 'penalized', true);
      graph.setEdgeAttribute(edgeKey, 'penaltyFactor', penaltyFactor);
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

export interface WalkingShortcut {
  from: string;
  to: string;
  distance?: number;
  duration?: number;
  priority: number;
}

export function addWalkingShortcuts(
  graph: Graph<NodeData, EdgeData>,
  explicitShortcuts: WalkingShortcut[] = []
): void {
  if (explicitShortcuts.length > 0) {
    addExplicitWalkingShortcuts(graph, explicitShortcuts);
  }

  const explicitShortcutPairs = new Set<string>();
  for (const shortcut of explicitShortcuts) {
    explicitShortcutPairs.add(`${shortcut.from}-${shortcut.to}`);
    explicitShortcutPairs.add(`${shortcut.to}-${shortcut.from}`);
  }

  const stationNodes = Array.from(graph.nodes()).filter(
    (id) => !id.includes('_') && id !== 'origin' && id !== 'destination'
  );

  for (let i = 0; i < stationNodes.length; i++) {
    const stationA = stationNodes[i];
    const nodeDataA = graph.getNodeAttributes(stationA);

    for (let j = i + 1; j < stationNodes.length; j++) {
      const stationB = stationNodes[j];
      const nodeDataB = graph.getNodeAttributes(stationB);

      if (explicitShortcutPairs.has(`${stationA}-${stationB}`)) {
        continue;
      }

      if (areStationsDirectlyConnected(graph, stationA, stationB)) {
        continue;
      }

      const distance = calculateDistanceSync(
        nodeDataA.station.coordinates,
        nodeDataB.station.coordinates
      );

      const autoDiscoveryLimit = MAX_AUTO_WALKING_SHORTCUT_DISTANCE;

      if (distance <= autoDiscoveryLimit) {
        const baseDuration = calculateWalkingDuration(distance);

        let costMultiplier;
        if (distance <= 300) {
          costMultiplier = 0.95;
        } else if (distance <= 400) {
          costMultiplier = 1.0;
        } else if (distance <= 500) {
          costMultiplier = 1.2;
        } else {
          costMultiplier = 1.5 + ((distance - 500) / 100) * 0.3;
        }

        const forwardWalkingData: EdgeData = {
          type: 'walking',
          duration: Math.round(baseDuration * costMultiplier),
          distance: distance,
          costMultiplier: costMultiplier,
          isShortcut: true,
          isExplicitShortcut: false,
        };

        const reverseWalkingData: EdgeData = { ...forwardWalkingData };

        graph.addEdge(stationA, stationB, forwardWalkingData);
        graph.addEdge(stationB, stationA, reverseWalkingData);
      }
    }
  }
}

export function addExplicitWalkingShortcuts(
  graph: Graph<NodeData, EdgeData>,
  shortcuts: WalkingShortcut[]
): void {
  for (const shortcut of shortcuts) {
    if (!graph.hasNode(shortcut.from) || !graph.hasNode(shortcut.to)) {
      continue;
    }

    const fromNodeData = graph.getNodeAttributes(shortcut.from);
    const toNodeData = graph.getNodeAttributes(shortcut.to);

    const distance =
      shortcut.distance ||
      calculateDistanceSync(
        fromNodeData.station.coordinates,
        toNodeData.station.coordinates
      );

    const baseDuration =
      shortcut.duration || calculateWalkingDuration(distance);

    const priorityDiscount = Math.min(0.5, shortcut.priority / 20);
    const costMultiplier = Math.max(0.7, 1.0 - priorityDiscount);

    const walkingEdgeData: EdgeData = {
      type: 'walking',
      duration: Math.round(baseDuration * costMultiplier),
      distance: distance,
      costMultiplier: costMultiplier,
      isShortcut: true,
      isExplicitShortcut: true,
      priority: shortcut.priority,
    };

    addOrUpdateEdge(graph, shortcut.from, shortcut.to, walkingEdgeData);
    addOrUpdateEdge(graph, shortcut.to, shortcut.from, { ...walkingEdgeData });
  }
}

function addOrUpdateEdge(
  graph: Graph<NodeData, EdgeData>,
  from: string,
  to: string,
  edgeData: EdgeData
): void {
  if (!graph.hasEdge(from, to)) {
    graph.addEdge(from, to, edgeData);
  } else {
    const edgeId = graph.edge(from, to);
    for (const [key, value] of Object.entries(edgeData)) {
      graph.setEdgeAttribute(edgeId, key as keyof EdgeData, value);
    }
  }
}

function areStationsDirectlyConnected(
  graph: Graph<NodeData, EdgeData>,
  stationA: string,
  stationB: string
): boolean {
  const virtualNodesA = graph
    .neighbors(stationA)
    .filter((n) => n.includes('_'));
  const virtualNodesB = graph
    .neighbors(stationB)
    .filter((n) => n.includes('_'));

  for (const nodeA of virtualNodesA) {
    for (const nodeB of virtualNodesB) {
      const lineA = extractLineIdFromNodeId(nodeA);
      const lineB = extractLineIdFromNodeId(nodeB);

      if (lineA === lineB) {
        if (graph.hasEdge(nodeA, nodeB) || graph.hasEdge(nodeB, nodeA)) {
          return true;
        }
      }
    }
  }

  return false;
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
