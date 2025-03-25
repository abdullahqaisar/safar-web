import Graph from 'graphology';
import { TRANSFER_TIME } from '@/lib/constants/route-config';
import { NodeData, EdgeData } from '../route/graph';

/**
 * Major interchange stations for streamlined transfers
 */
export interface Interchange {
  stationId: string;
  lines: string[];
  transferImportance: number;
}

/**
 * Key interchange stations in the network
 */
export const MAJOR_INTERCHANGES: Interchange[] = [
  {
    stationId: 'faizAhmadFaiz',
    lines: ['red', 'orange'],
    transferImportance: 10, // Higher means more important
  },
  {
    stationId: 'pims_gate',
    lines: ['green', 'blue'],
    transferImportance: 8,
  },
  {
    stationId: 'faizabad',
    lines: ['red', 'fr_1', 'fr_9', 'fr_14'],
    transferImportance: 7,
  },
  {
    stationId: 'sohan',
    lines: ['blue', 'fr_1', 'fr_9', 'fr_14'],
    transferImportance: 6,
  },
];

/**
 * Check if a station is a major interchange between specified lines
 */
export function isMajorInterchange(
  stationId: string,
  lines?: string[]
): boolean {
  const interchange = MAJOR_INTERCHANGES.find((i) => i.stationId === stationId);
  if (!interchange) return false;

  // If lines are specified, check if this interchange connects those lines
  if (lines && lines.length > 0) {
    return lines.every((line) => interchange.lines.includes(line));
  }

  return true;
}

/**
 * Get interchange details for a station if it's a major interchange
 */
export function getInterchangeDetails(stationId: string): Interchange | null {
  return MAJOR_INTERCHANGES.find((i) => i.stationId === stationId) || null;
}

/**
 * Optimize paths through major interchange stations
 * Makes transfers at key interchange points more favorable
 */
export function optimizeInterchangePaths(
  graph: Graph<NodeData, EdgeData>
): void {
  // Process each major interchange
  for (const interchange of MAJOR_INTERCHANGES) {
    // Find all virtual nodes for this station
    const virtualNodes: string[] = [];

    graph.forEachNode((nodeId, attributes) => {
      if (
        attributes.station?.id === interchange.stationId &&
        attributes.virtual
      ) {
        virtualNodes.push(nodeId);
      }
    });

    // Create optimized connections between these virtual nodes
    for (let i = 0; i < virtualNodes.length; i++) {
      for (let j = i + 1; j < virtualNodes.length; j++) {
        const sourceId = virtualNodes[i];
        const targetId = virtualNodes[j];

        // Skip if already connected
        if (graph.hasEdge(sourceId, targetId)) {
          // If connected, just optimize the weight
          const edgeKey = graph.edge(sourceId, targetId);
          const currentData = graph.getEdgeAttributes(edgeKey);

          // Apply interchange optimization - reduce transfer time for major interchanges
          const optimizedDuration = Math.floor(
            currentData.duration * (0.8 - interchange.transferImportance * 0.02)
          );

          graph.setEdgeAttribute(edgeKey, 'duration', optimizedDuration);
          graph.setEdgeAttribute(edgeKey, 'isMajorInterchange', true);

          // Do the same for the reverse edge
          if (graph.hasEdge(targetId, sourceId)) {
            const reverseEdgeKey = graph.edge(targetId, sourceId);
            graph.setEdgeAttribute(
              reverseEdgeKey,
              'duration',
              optimizedDuration
            );
            graph.setEdgeAttribute(reverseEdgeKey, 'isMajorInterchange', true);
          }

          continue;
        }

        // Create optimized transfer edges between different lines at this station
        const sourceAttrs = graph.getNodeAttributes(sourceId);
        const targetAttrs = graph.getNodeAttributes(targetId);

        if (sourceAttrs.lineId !== targetAttrs.lineId) {
          // Calculate optimized transfer time based on importance
          const baseTransferTime = TRANSFER_TIME.BASE;
          const optimizedTime = Math.floor(
            baseTransferTime * (0.7 - interchange.transferImportance * 0.02)
          );

          // Create bidirectional transfer edges
          graph.addEdge(sourceId, targetId, {
            type: 'transfer',
            duration: optimizedTime,
            distance: 0,
            isMajorInterchange: true,
          });

          graph.addEdge(targetId, sourceId, {
            type: 'transfer',
            duration: optimizedTime,
            distance: 0,
            isMajorInterchange: true,
          });
        }
      }
    }
  }
}
