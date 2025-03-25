import Graph from 'graphology';
import { NodeData, EdgeData } from '@/server/core/journey/route/graph';
import { WALKING_SPEED_MPS } from '@/lib/constants/config';
import { WALKING_SEGMENT_PENALTIES } from '@/lib/constants/route-config';

/**
 * Calculate walking duration based on distance with appropriate penalties
 */
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
  const penaltyFactor = Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / 2000) * 1.2
  );
  return Math.round(baseDuration * penaltyFactor);
}

/**
 * Calculate walking penalty factor based on distance
 */
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

  // For distances beyond EXTREME, use a graduated penalty
  return Math.min(
    3.0,
    1.8 + ((distance - EXTREME) / maxRecommendedDistance) * 1.2
  );
}

/**
 * Check if two paths are similar based on their node sequences and transit lines
 */
export function areSimilarPaths(
  pathA: Array<string>,
  pathB: Array<string>,
  threshold: number = 0.8
): boolean {
  // Trivial case - exact same sequence
  if (
    pathA.length === pathB.length &&
    pathA.every((node, i) => node === pathB[i])
  ) {
    return true;
  }

  // Extract station IDs and line IDs from path nodes
  const extractStationsAndLines = (
    path: string[]
  ): { stations: Set<string>; lines: Set<string> } => {
    const stations = new Set<string>();
    const lines = new Set<string>();

    for (const node of path) {
      // Skip origin/destination nodes
      if (node === 'origin' || node === 'destination') continue;

      // Extract station and potentially line info
      if (node.includes('_')) {
        // Virtual node with format stationId_lineId
        const [stationId, lineId] = node.split('_');
        if (stationId) stations.add(stationId);
        if (lineId) lines.add(lineId);
      } else {
        // Regular station node
        stations.add(node);
      }
    }

    return { stations, lines };
  };

  const pathAInfo = extractStationsAndLines(pathA);
  const pathBInfo = extractStationsAndLines(pathB);

  // Calculate station overlap
  const stationIntersection = new Set<string>();
  for (const station of pathAInfo.stations) {
    if (pathBInfo.stations.has(station)) {
      stationIntersection.add(station);
    }
  }

  // Calculate line overlap
  const lineIntersection = new Set<string>();
  for (const line of pathAInfo.lines) {
    if (pathBInfo.lines.has(line)) {
      lineIntersection.add(line);
    }
  }

  // Calculate similarity scores
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

  // Weight line similarity more heavily to encourage transit line diversity
  const overallSimilarity =
    pathAInfo.lines.size > 0 && pathBInfo.lines.size > 0
      ? 0.3 * stationSimilarity + 0.7 * lineSimilarity
      : stationSimilarity;

  return overallSimilarity >= threshold;
}

/**
 * Extract edge information from a path
 */
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

/**
 * Count how many times each edge appears in the paths
 */
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

/**
 * Apply penalties to edges that are common in multiple paths
 */
export function penalizeCommonEdges(
  graph: Graph<NodeData, EdgeData>,
  edgeKeys: Array<string> | Array<{ key: string; count: number }>
): void {
  for (const edgeInfo of edgeKeys) {
    // Handle both simple string keys and {key, count} objects
    const key = typeof edgeInfo === 'string' ? edgeInfo : edgeInfo.key;
    const count = typeof edgeInfo === 'string' ? 2 : edgeInfo.count;

    const [source, target] = key.split('->');

    if (graph.hasEdge(source, target)) {
      const edgeKey = graph.edge(source, target);
      const edgeData = graph.getEdgeAttributes(edgeKey);

      // Apply exponential penalty based on how many paths use this edge
      const penaltyFactor = Math.pow(5, count - 1); // 5x, 25x, 125x, etc.

      // Preserve original edge type in attributes
      graph.setEdgeAttribute(
        edgeKey,
        'duration',
        edgeData.duration * penaltyFactor
      );

      // Tag this edge as penalized for debugging
      graph.setEdgeAttribute(edgeKey, 'penalized', true);
      graph.setEdgeAttribute(edgeKey, 'penaltyFactor', penaltyFactor);
    }
  }
}

/**
 * Extract line ID from a node ID
 */
export function extractLineId(
  graph: Graph<NodeData, EdgeData>,
  nodeId: string
): string | null {
  // First check if it's a virtual node with line information
  if (graph.hasNode(nodeId)) {
    const attrs = graph.getNodeAttributes(nodeId);
    if (attrs.lineId) return attrs.lineId;
    if (attrs.virtual && nodeId.includes('_')) {
      return nodeId.split('_')[1]; // Fallback to string parsing
    }
  }
  return null;
}

/**
 * Check if two stations are directly connected via a transit line
 */
export function areStationsDirectlyConnected(
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
