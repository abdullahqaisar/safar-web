import { TransitGraph } from '../../graph/graph';
import { NetworkPathResult } from './types';

/**
 * Find possible network paths between origin and destination
 * 
 * This function identifies the optimal transfer paths through the transit network
 * It considers various possible paths and ensures all with optimal transfers are found
 */
export function findPossibleNetworkPaths(
  graph: TransitGraph,
  originLines: string[],
  destinationLines: string[]
): NetworkPathResult {
  // First determine the minimum transfers required
  let globalMinTransfers = Infinity;
  
  // Use line connectivity matrix to get minimum transfers directly
  for (const originLine of originLines) {
    for (const destLine of destinationLines) {
      const minTransfers = graph.getMinTransfersBetweenLines(originLine, destLine);
      if (minTransfers < globalMinTransfers) {
        globalMinTransfers = minTransfers;
      }
    }
  }

  // Pre-compute best paths between all origin and destination lines
  const paths: string[][] = [];
  
  // Use the lineConnectivityMatrix from the graph to compute paths using BFS
  for (const originLine of originLines) {
    if (destinationLines.includes(originLine)) {
      // Direct line - no transfers needed
      paths.push([originLine]);
      continue;
    }

    const queue: { line: string; path: string[]; transfers: number }[] = [];
    
    // Keep track of paths reaching each line for pruning duplicates
    const bestTransfersToLine: Map<string, number> = new Map();
    bestTransfersToLine.set(originLine, 0);
    
    // Start with the origin line
    queue.push({ line: originLine, path: [originLine], transfers: 0 });
    
    while (queue.length > 0) {
      const { line, path, transfers } = queue.shift()!;
      
      // Only prune paths that exceed the global minimum by more than 1
      // This ensures we find all optimal and near-optimal paths
      if (transfers > globalMinTransfers + 1) {
        continue;
      }
      
      // Check if this path reaches a destination line
      if (destinationLines.includes(line)) {
        // Only add the path if it's optimal (matches global min)
        if (transfers <= globalMinTransfers) {
          paths.push(path);
          
          // Update global min transfers if this path is better
          if (transfers < globalMinTransfers) {
            globalMinTransfers = transfers;
          }
        }
        continue;
      }
      
      // Get all lines reachable with 1 transfer from current line
      const reachableLines = graph.getLinesReachableWithNTransfers(line, 1);
      
      for (const nextLine of reachableLines) {
        const nextTransfers = transfers + 1;
        
        // Skip if we've found a better path to this line already
        const bestKnownTransfers = bestTransfersToLine.get(nextLine) ?? Infinity;
        
        // Allow equal or better paths 
        if (nextTransfers <= bestKnownTransfers) {
          // Calculate minimum transfers from this line to any destination
          let minTransfersToDestination = Infinity;
          for (const destLine of destinationLines) {
            const transfersToDestination = graph.getMinTransfersBetweenLines(nextLine, destLine);
            minTransfersToDestination = Math.min(minTransfersToDestination, transfersToDestination);
          }
          
          // Only explore if this path could potentially be optimal
          // Allow one extra transfer to ensure we don't miss near-optimal paths
          if (nextTransfers + minTransfersToDestination <= globalMinTransfers + 1) {
            queue.push({
              line: nextLine,
              path: [...path, nextLine],
              transfers: nextTransfers
            });
            
            // Update best transfers to this line
            bestTransfersToLine.set(nextLine, nextTransfers);
          }
        }
      }
    }
  }

  // Ensure we always return at least one path when possible
  if (paths.length === 0 && globalMinTransfers < Infinity) {
    // Fall back to using direct line data from connectivity matrix
    for (const originLine of originLines) {
      for (const destLine of destinationLines) {
        const transfers = graph.getMinTransfersBetweenLines(originLine, destLine);
        if (transfers === globalMinTransfers) {
          paths.push([originLine, destLine]);
        }
      }
    }
  }

  // Deduplicate paths while preserving order
  const uniquePaths = Array.from(new Map(paths.map(path => [path.join('|'), path])).values());
  
  return { paths: uniquePaths, minTransfers: globalMinTransfers };
} 