import { TransitGraph } from '../../graph/graph';
import { Route } from '../../types/route';
import { MAX_TRANSFERS } from '../../utils/constants';
import { LinePriority, TransferState } from './types';
import { findPossibleNetworkPaths } from './network-paths';
import {
  constructRouteFromPath,
  getStopsToDestination,
  hasCommonInterchange,
  hasNewReachableStations,
  hasUnnecessaryTransfers,
  isOnNetworkPath
} from './utils';

/**
 * Find routes requiring multiple transfers using BFS
 * 
 * This function uses a breadth-first search approach to find optimal routes
 * that may require multiple transfers between lines
 */
export function findMultiTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  maxTransfers: number = MAX_TRANSFERS,
  durationThreshold?: number
): Route[] {
  const routes: Route[] = [];
  const visitedStates = new Set<string>();
  const queue: TransferState[] = [];

  // Initialize queue with all lines at the origin station
  const originLines = graph.getStationLines(originId);
  if (!originLines.length) return routes;

  // Get destination lines for network analysis
  const destinationLines = graph.getStationLines(destinationId);
  
  // Get possible network paths and minimum transfers needed
  const { paths: networkPaths, minTransfers } = findPossibleNetworkPaths(
    graph, 
    originLines, 
    destinationLines
  );

  // Start BFS from each line at the origin
  originLines.forEach((lineId) => {
    queue.push({
      stationId: originId,
      lineId: lineId,
      transferCount: 0,
      visitedStations: new Set([originId]),
      visitedLines: new Set([lineId]),
      visitedStationLinePairs: new Set([`${originId}|${lineId}`]),
      path: [
        {
          stationId: originId,
          lineId: lineId,
          isTransfer: false,
        },
      ],
    });
  });

  // BFS loop
  while (queue.length > 0) {
    const currentState = queue.shift()!;
    const {
      stationId,
      lineId,
      transferCount,
      visitedStations,
      visitedStationLinePairs,
      path,
    } = currentState;

    // Skip if we've exceeded the maximum transfer count
    if (transferCount > maxTransfers) continue;

    const currentStation = graph.stations[stationId];
    const currentLine = graph.lines[lineId];

    if (!currentStation || !currentLine) continue;

    // Generate a unique state identifier to avoid revisiting
    const stateKey = `${stationId}-${lineId}-${transferCount}`;
    if (visitedStates.has(stateKey)) continue;
    visitedStates.add(stateKey);

    // Check if we've reached the destination
    if (stationId === destinationId) {
      // Before constructing a route, validate the path doesn't have unnecessary transfers
      if (!hasUnnecessaryTransfers(path, graph)) {
        const route = constructRouteFromPath(graph, path, originId);

        // Only add routes that meet the duration threshold (if specified)
        if (
          route &&
          (!durationThreshold || route.totalDuration < durationThreshold)
        ) {
          routes.push(route);
        }
      }
      continue;
    }

    // Explore next stations on the same line (no transfer)
    const stationsOnLine = currentLine.stations;
    const currentIdx = stationsOnLine.indexOf(stationId);

    if (currentIdx !== -1) {
      // Forward direction
      if (currentIdx < stationsOnLine.length - 1) {
        const nextStationId = stationsOnLine[currentIdx + 1];
        const nextStationPair = `${nextStationId}|${lineId}`;

        if (!visitedStationLinePairs.has(nextStationPair)) {
          const newVisitedStations = new Set(visitedStations);
          newVisitedStations.add(nextStationId);

          const newVisitedPairs = new Set(visitedStationLinePairs);
          newVisitedPairs.add(nextStationPair);

          queue.push({
            stationId: nextStationId,
            lineId: lineId,
            transferCount: transferCount,
            visitedStations: newVisitedStations,
            visitedLines: currentState.visitedLines,
            visitedStationLinePairs: newVisitedPairs,
            path: [
              ...path,
              {
                stationId: nextStationId,
                lineId: lineId,
                isTransfer: false,
              },
            ],
          });
        }
      }

      // Backward direction
      if (currentIdx > 0) {
        const prevStationId = stationsOnLine[currentIdx - 1];
        const prevStationPair = `${prevStationId}|${lineId}`;

        if (!visitedStationLinePairs.has(prevStationPair)) {
          const newVisitedStations = new Set(visitedStations);
          newVisitedStations.add(prevStationId);

          const newVisitedPairs = new Set(visitedStationLinePairs);
          newVisitedPairs.add(prevStationPair);

          queue.push({
            stationId: prevStationId,
            lineId: lineId,
            transferCount: transferCount,
            visitedStations: newVisitedStations,
            visitedLines: currentState.visitedLines,
            visitedStationLinePairs: newVisitedPairs,
            path: [
              ...path,
              {
                stationId: prevStationId,
                lineId: lineId,
                isTransfer: false,
              },
            ],
          });
        }
      }
    }

    // Consider transfers at the current station
    if (transferCount < maxTransfers) {
      const stationLines = graph.getStationLines(stationId);

      // First check: Are we at a transfer station?
      if (!graph.isTransferStation(stationId)) {
        continue; // Skip if not a transfer station
      }

      // Check if the current station is a major interchange
      const isMajorInterchange = graph.interchangePoints.includes(stationId);

      // Get line priority for destination
      const linePriorities: LinePriority[] = [];

      // Calculate priority for each line at this station
      for (const nextLineId of stationLines) {
        // Skip current line
        if (nextLineId === lineId) continue;

        // Get the next line
        const nextLine = graph.lines[nextLineId];
        if (!nextLine) continue;

        // Create station-line pair identifier
        const nextStationLinePair = `${stationId}|${nextLineId}`;
        const alreadyVisited = visitedStationLinePairs.has(nextStationLinePair);
        
        // Determine if we should allow this transfer even if already visited
        let allowTransfer = !alreadyVisited;
        
        // Special handling for major interchange points
        if (alreadyVisited && isMajorInterchange) {
          // Get this interchange info
          const interchangeInfo = graph.getMajorInterchangeInfo(stationId);
          
          // Allow transfer if both lines are defined for this interchange
          if (interchangeInfo && 
              interchangeInfo.lines.includes(lineId) && 
              interchangeInfo.lines.includes(nextLineId)) {
            allowTransfer = true;
          }
        }
        
        // For complex network routing, be more lenient with restrictions
        if (alreadyVisited && isOnNetworkPath(nextLineId, networkPaths)) {
          // If this line is part of a critical network path to the destination,
          // allow the transfer even if we've visited this line before
          allowTransfer = true;
        }
        
        // Skip if we've already visited this station-line pair and it's not allowed
        if (!allowTransfer) continue;

        // Check if this line directly contains the destination
        const directStopsToDestination = getStopsToDestination(
          nextLine,
          stationId,
          destinationId
        );

        // Assign priority based on destination presence - LOWER values = HIGHER priority
        let basePriority = 1000; // Start with a high value (low priority)

        if (directStopsToDestination >= 0) {
          // Direct line to destination - highest priority
          // Lower number for fewer stops = higher priority
          basePriority = 100 + directStopsToDestination;
        } else {
          // Get the minimum transfers from this line to any destination line
          let minTransfersToDestination = Infinity;
          
          for (const destLine of destinationLines) {
            const transfers = graph.getMinTransfersBetweenLines(nextLineId, destLine);
            if (transfers < minTransfersToDestination) {
              minTransfersToDestination = transfers;
            }
          }
          
          // Assign priority based on how many transfers away we are from the destination
          if (minTransfersToDestination === 1) {
            basePriority = 200;
          } else if (minTransfersToDestination === 2) {
            basePriority = 300;
          } else if (minTransfersToDestination === 3) {
            basePriority = 400;
          } else if (minTransfersToDestination !== Infinity) {
            basePriority = 500 + minTransfersToDestination * 50;
          } else {
            basePriority = 800;
          }
        }

        // Apply priority modifiers - reduce basePriority to increase priority

        // Boost priority for transfers at major interchanges
        if (isMajorInterchange) {
          basePriority -= 25;
        }

        // Boost for lines that are part of network paths between origin and destination
        if (isOnNetworkPath(nextLineId, networkPaths)) {
          basePriority -= 50;
        }
        
        // Boost priority if this line is on the optimal transfer path
        const currentTransferCount = transferCount + 1; // +1 for this transfer
        const remainingTransfersNeeded = minTransfers - currentTransferCount;
        
        // If we're making good progress toward reaching destination with minimum transfers
        if (minTransfers > 0 && remainingTransfersNeeded >= 0) {
          // Calculate if this transfer follows the minimum transfer path
          for (const destLine of destinationLines) {
            const transfers = graph.getMinTransfersBetweenLines(nextLineId, destLine);
            if (transfers === remainingTransfersNeeded) {
              // This is on an optimal path - significant priority boost
              basePriority -= 75;
              break;
            }
          }
        }

        // Final priority value - lower is better
        const priority = basePriority;

        // Add to priorities list with pre-validation of transfer eligibility 
        linePriorities.push({ 
          lineId: nextLineId, 
          priority,
          allowTransfer: true  // We've already verified this transfer is allowed
        });
      }

      // Sort lines by priority (lowest first, since lower priority values = higher priority)
      linePriorities.sort((a, b) => a.priority - b.priority);

      for (const { lineId: nextLineId, allowTransfer } of linePriorities) {
        // Skip if the transfer is not allowed (already checked during priority calculation)
        if (!allowTransfer) continue;

        const nextLine = graph.lines[nextLineId];
        if (!nextLine) continue;
        
        const nextStationLinePair = `${stationId}|${nextLineId}`;

        // Check if this transfer would be useful
        let isTransferValuable = hasNewReachableStations(
          nextLine,
          stationId,
          visitedStations,
          destinationId,
          graph
        );
        
        // If we have connectivity data, also consider valuable if it reduces remaining transfers
        if (!isTransferValuable && minTransfers > 0) {
          // Calculate how many transfers remain from current line and from next line
          let minTransfersFromCurrentLine = Infinity;
          let minTransfersFromNextLine = Infinity;
          
          for (const destLine of destinationLines) {
            const currentTransfers = graph.getMinTransfersBetweenLines(lineId, destLine);
            const nextTransfers = graph.getMinTransfersBetweenLines(nextLineId, destLine);
            
            minTransfersFromCurrentLine = Math.min(minTransfersFromCurrentLine, currentTransfers);
            minTransfersFromNextLine = Math.min(minTransfersFromNextLine, nextTransfers);
          }
          
          // If transferring reduces the number of remaining transfers needed, it's valuable
          if (minTransfersFromNextLine < minTransfersFromCurrentLine) {
            isTransferValuable = true;
          }
        }
        
        // For major interchanges with designated line pairs, consider the transfer more valuable
        const isValuableInterchangeTransfer = isMajorInterchange && 
                                             graph.getMajorInterchangeInfo(stationId)?.lines.includes(nextLineId);
                                     
        // For critical network path transfers, always consider valuable
        const isCriticalNetworkTransfer = isOnNetworkPath(nextLineId, networkPaths);
        
        if (!isTransferValuable && !isValuableInterchangeTransfer && !isCriticalNetworkTransfer) {
          continue;
        }

        // Check if this transfer gets us closer to the destination
        const canReachDestination =
          destinationLines.includes(nextLineId) ||
          hasCommonInterchange(nextLineId, destinationLines, graph);
          
        // Always consider transfers at major interchanges that lead to lines serving the destination
        const isValuableDestinationTransfer = isMajorInterchange && 
                                             destinationLines.includes(nextLineId);
                                             
        // With line connectivity data, also check if next line can reach destination lines
        let canEventuallyReachDestination = false;
        if (!canReachDestination && !isValuableDestinationTransfer) {
          for (const destLine of destinationLines) {
            if (graph.getMinTransfersBetweenLines(nextLineId, destLine) < Infinity) {
              canEventuallyReachDestination = true;
              break;
            }
          }
        }
                                             
        // For critical network transfers, don't require immediate destination reachability
        if (!canReachDestination && !isValuableDestinationTransfer && 
            !isCriticalNetworkTransfer && !canEventuallyReachDestination) {
          continue;
        }

        // Proceed with transfer
        const newVisitedLines = new Set(currentState.visitedLines);
        newVisitedLines.add(nextLineId);

        // Create new set of visited station-line pairs
        const newVisitedPairs = new Set(visitedStationLinePairs);
        newVisitedPairs.add(nextStationLinePair);

        queue.push({
          stationId: stationId,
          lineId: nextLineId,
          transferCount: transferCount + 1,
          visitedStations: new Set(visitedStations),
          visitedLines: newVisitedLines,
          visitedStationLinePairs: newVisitedPairs,
          path: [
            ...path,
            {
              stationId: stationId,
              lineId: nextLineId,
              isTransfer: true,
            },
          ],
        });
      }
    }
  }

  return routes;
} 