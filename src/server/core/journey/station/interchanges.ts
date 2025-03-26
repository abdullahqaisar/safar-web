import Graph from 'graphology';
import {
  TRANSFER_TIME,
  CRITICAL_TRANSFERS,
  LINE_PRIORITY,
} from '@/lib/constants/route-config';
import { NodeData, EdgeData } from '../route/graph';
import { Interchange } from '@/types/station';
import { MAJOR_INTERCHANGES } from '@/lib/constants/metro-data';
import { stationManager } from './station';

/**
 * Check if a station is a major interchange between specified lines
 */
export function isMajorInterchange(
  stationId: string,
  lines?: string[]
): boolean {
  return stationManager.isMajorInterchange(stationId, lines);
}

/**
 * Get interchange details for a station if it's a major interchange
 */
export function getInterchangeDetails(stationId: string): Interchange | null {
  return stationManager.getInterchangeDetails(stationId);
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
    const virtualNodes: string[] = [];

    graph.forEachNode((nodeId, attributes) => {
      if (
        attributes.station?.id === interchange.stationId &&
        attributes.virtual
      ) {
        virtualNodes.push(nodeId);
      }
    });

    // Create optimized connections between virtual nodes
    for (let i = 0; i < virtualNodes.length; i++) {
      for (let j = i + 1; j < virtualNodes.length; j++) {
        const sourceId = virtualNodes[i];
        const targetId = virtualNodes[j];

        // Extract line IDs for transfer analysis
        const sourceLineId = sourceId.split('_')[1];
        const targetLineId = targetId.split('_')[1];
        const lineCombo = `${sourceLineId}-${targetLineId}`;
        const reverseLineCombo = `${targetLineId}-${sourceLineId}`;

        // Check if this is a critical transfer between major lines
        const isCriticalTransfer =
          CRITICAL_TRANSFERS[lineCombo] !== undefined ||
          CRITICAL_TRANSFERS[reverseLineCombo] !== undefined;

        // Calculate importance factor
        let importanceFactor = interchange.transferImportance / 10;
        let costMultiplier = 0.7;

        // Apply aggressive weight reduction for critical transfers
        if (isCriticalTransfer) {
          const criticalMultiplier =
            CRITICAL_TRANSFERS[lineCombo] ||
            CRITICAL_TRANSFERS[reverseLineCombo] ||
            0.2;

          importanceFactor = 0.95; // Extreme importance
          costMultiplier = criticalMultiplier;
        }
        // For high-priority line combinations
        else if (
          (LINE_PRIORITY[sourceLineId] || 0) >= 8 &&
          (LINE_PRIORITY[targetLineId] || 0) >= 8
        ) {
          importanceFactor = Math.max(importanceFactor, 0.8);
          costMultiplier = 0.4;
        }

        // Modify existing edge if it exists
        if (graph.hasEdge(sourceId, targetId)) {
          const edgeKey = graph.edge(sourceId, targetId);
          const currentData = graph.getEdgeAttributes(edgeKey);

          // Calculate optimized duration - much more aggressive reduction for critical transfers
          let optimizedDuration = Math.floor(
            currentData.duration * (0.7 - importanceFactor * 0.6)
          );

          if (isCriticalTransfer) {
            optimizedDuration = Math.floor(optimizedDuration * 0.5); // 50% further reduction
          }

          graph.setEdgeAttribute(edgeKey, 'duration', optimizedDuration);
          graph.setEdgeAttribute(edgeKey, 'isMajorInterchange', true);
          graph.setEdgeAttribute(
            edgeKey,
            'isCriticalTransfer',
            isCriticalTransfer
          );
          graph.setEdgeAttribute(edgeKey, 'costMultiplier', costMultiplier);
          graph.setEdgeAttribute(
            edgeKey,
            'transferImportance',
            interchange.transferImportance
          );

          // Apply same changes to reverse edge
          if (graph.hasEdge(targetId, sourceId)) {
            const reverseEdgeKey = graph.edge(targetId, sourceId);
            graph.setEdgeAttribute(
              reverseEdgeKey,
              'duration',
              optimizedDuration
            );
            graph.setEdgeAttribute(reverseEdgeKey, 'isMajorInterchange', true);
            graph.setEdgeAttribute(
              reverseEdgeKey,
              'isCriticalTransfer',
              isCriticalTransfer
            );
            graph.setEdgeAttribute(
              reverseEdgeKey,
              'costMultiplier',
              costMultiplier
            );
            graph.setEdgeAttribute(
              reverseEdgeKey,
              'transferImportance',
              interchange.transferImportance
            );
          }
        }
        // Create new transfer edge if needed
        else {
          const sourceAttrs = graph.getNodeAttributes(sourceId);
          const targetAttrs = graph.getNodeAttributes(targetId);

          if (sourceAttrs.lineId !== targetAttrs.lineId) {
            const baseTransferTime = TRANSFER_TIME.BASE;

            // Calculate transfer time with extreme reduction for critical transfers
            let transferTime = Math.floor(
              baseTransferTime * (0.7 - importanceFactor * 0.6)
            );

            if (isCriticalTransfer) {
              transferTime = Math.floor(transferTime * 0.5);
            }

            // Create transfer edges in both directions
            graph.addEdge(sourceId, targetId, {
              type: 'transfer',
              duration: transferTime,
              distance: 0,
              isMajorInterchange: true,
              isCriticalTransfer,
              transferImportance: interchange.transferImportance,
              costMultiplier,
            });

            graph.addEdge(targetId, sourceId, {
              type: 'transfer',
              duration: transferTime,
              distance: 0,
              isMajorInterchange: true,
              isCriticalTransfer,
              transferImportance: interchange.transferImportance,
              costMultiplier,
            });
          }
        }
      }
    }
  }
}
