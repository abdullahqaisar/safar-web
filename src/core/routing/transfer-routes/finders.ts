import { TransitGraph } from '../../graph/graph';
import { Route } from '../../types/route';
import { MAX_TRANSFERS } from '../../utils/constants';
import { findSingleTransferRoutes } from './single-transfer';
import { findMultiTransferRoutes } from './multi-transfer';

/**
 * Main entry point for finding transfer routes
 * 
 * This function finds routes that require transferring between lines,
 * using specialized algorithms for single-transfer and multi-transfer cases.
 * 
 * @param graph The transit network graph
 * @param originId Origin station ID
 * @param destinationId Destination station ID
 * @param maxTransfers Maximum number of transfers allowed (default: MAX_TRANSFERS)
 * @param durationThreshold Only return routes with duration less than this threshold (optional)
 * @returns Array of possible routes between origin and destination
 */
export function findTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  maxTransfers: number = MAX_TRANSFERS,
  durationThreshold?: number
): Route[] {
  // First try single transfer routes (most common and more efficient to find directly)
  const singleTransferRoutes = findSingleTransferRoutes(
    graph,
    originId,
    destinationId,
    durationThreshold
  );

  // If we need more transfers or single transfer didn't find anything
  if (maxTransfers > 1 || singleTransferRoutes.length === 0) {
    const multiTransferRoutes = findMultiTransferRoutes(
      graph,
      originId,
      destinationId,
      maxTransfers,
      durationThreshold
    );

    return [...singleTransferRoutes, ...multiTransferRoutes];
  }

  return singleTransferRoutes;
} 