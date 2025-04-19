import { TransitGraph } from "@/core/graph/graph";
import { MAX_TRANSFERS } from "./types";
import { Route, TransitRouteSegment } from "@/core/types/route";
import { calculateDistance } from "@/core/utils/geo-utils";
import { Station } from "@/types/station";
import { INTERCHANGE_WALKING_TIME } from "@/core/utils/constants";
import { createRoute, createTransitSegment } from "@/core/utils/route-builder";
import { TransitLine } from "@/core/types/graph";


interface TransferState {
  stationId: string;
  lineId: string;
  transferCount: number;
  visitedStations: Set<string>;
  visitedLines: Set<string>;
  visitedStationLinePairs: Set<string>;
  path: {
    stationId: string;
    lineId: string;
    isTransfer: boolean;
  }[];
}

export function findTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  maxTransfers: number = MAX_TRANSFERS,
  durationThreshold?: number
): Route[] {
  console.log(
    `[Transfer Route] Searching for transfer routes from ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );
  console.log(
    `[Transfer Route] Max transfers: ${maxTransfers}, duration threshold: ${durationThreshold ? durationThreshold + 's' : 'none'}`
  );

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
      maxTransfers, // Use the provided maxTransfers directly
      durationThreshold
    );

    return [...singleTransferRoutes, ...multiTransferRoutes];
  }

  return singleTransferRoutes;
}

/**
 * Find routes requiring exactly one transfer between lines
 */
function findSingleTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  durationThreshold?: number
): Route[] {
  const routes: Route[] = [];
  console.log(
    `[Transfer Route] Using optimized single-transfer route finder for ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    console.log(
      `[Transfer Route] Origin or destination has no stations, cannot find transfer routes`
    );
    return routes;
  }

  // Get all lines for origin and destination
  const originLines = graph.getStationLines(originId);
  const destinationLines = graph.getStationLines(destinationId);
  console.log(`[Transfer Route] Origin lines: ${originLines.join(', ')}`);
  console.log(
    `[Transfer Route] Destination lines: ${destinationLines.join(', ')}`
  );

  if (originLines.length === 0 || destinationLines.length === 0) {
    console.log(
      `[Transfer Route] Origin or destination has no lines, cannot find transfer routes`
    );
    return routes;
  }

  // Track line pairs to avoid duplicate strategies
  const processedLinePairs = new Map<string, Route>();

  // For each origin line
  originLines.forEach((originLineId) => {
    // For each destination line
    destinationLines.forEach((destLineId) => {
      // Skip if lines are the same (would be a direct route)
      if (originLineId === destLineId) {
        console.log(
          `[Transfer Route] Skipping same line combination: ${originLineId} to ${destLineId}`
        );
        return;
      }

      const originLine = graph.lines[originLineId];
      const destLine = graph.lines[destLineId];

      if (!originLine || !destLine) return;

      // Create unique key for this line pair
      const linePairKey = `${originLineId}|${destLineId}`;

      // Skip if we already processed this line pair
      if (processedLinePairs.has(linePairKey)) return;

      // Find common interchange stations between these lines
      const transferStations = findCommonStations(
        [originLineId, destLineId],
        graph
      );

      // If no transfer stations, skip
      if (transferStations.length === 0) {
        console.log(
          `[Transfer Route] No transfer stations found between ${originLine.name} and ${destLine.name}, skipping`
        );
        return;
      }

      // Find the best transfer option for this line pair
      const bestRoute = findBestTransferOption(
        graph,
        originLine,
        destLine,
        originId,
        destinationId,
        transferStations
      );

      // If we found a valid route, add it to our processed pairs
      if (bestRoute) {
        console.log(
          `[Transfer Route] Found valid transfer route from ${originLine.name} to ${destLine.name} with transfer at ${transferStations[0].name}, duration: ${bestRoute.totalDuration}s`
        );

        // Only add if it passes the duration threshold check (if specified)
        if (durationThreshold && bestRoute.totalDuration >= durationThreshold) {
          console.log(
            `[Transfer Route] Route exceeds duration threshold (${bestRoute.totalDuration}s > ${durationThreshold}s), skipping`
          );
          return;
        }

        processedLinePairs.set(linePairKey, bestRoute);
        routes.push(bestRoute);
      }
    });
  });

  console.log(`[Transfer Route] Found ${routes.length} single-transfer routes`);
  return routes;
}

/**
 * Find the best transfer option among multiple possible transfer stations
 * for the same pair of lines
 *
 * This function evaluates all potential transfer stations between two lines
 * and selects the optimal one based on multiple factors including:
 * - Total journey time
 * - Transfer station quality
 * - Platform distance at transfer stations
 * - Position of transfer station relative to origin and destination
 */
function findBestTransferOption(
  graph: TransitGraph,
  originLine: TransitLine,
  destLine: TransitLine,
  originId: string,
  destinationId: string,
  transferStations: Station[]
): Route | null {
  console.log(
    `[Transfer Route] Finding best transfer option from ${originLine.name} to ${destLine.name}`
  );

  const transferOptions: Array<{
    route: Route;
    score: number;
    transferStationId: string;
  }> = [];

  // Get origin and destination stations for distance calculations
  const originStation = graph.stations[originId];
  const destinationStation = graph.stations[destinationId];

  if (!originStation || !destinationStation) {
    return null;
  }

  // Calculate direct distance from origin to destination for reference
  const directDistance = calculateDistance(
    originStation.coordinates,
    destinationStation.coordinates
  );

  // For each potential transfer station
  transferStations.forEach((transferStation) => {
    // Skip if transfer station is the origin or destination
    if (transferStation.id === originId || transferStation.id === destinationId)
      return;

    // Create route segments
    const firstSegment = createSegmentBetweenStations(
      graph,
      originLine,
      originId,
      transferStation.id
    );

    const secondSegment = createSegmentBetweenStations(
      graph,
      destLine,
      transferStation.id,
      destinationId
    );

    // Skip if either segment couldn't be created
    if (!firstSegment || !secondSegment) return;

    // Calculate transfer time - use standard interchange time
    const transferTime = INTERCHANGE_WALKING_TIME;

    // Adjust second segment duration to include transfer time
    secondSegment.duration += transferTime;

    // Create complete route
    try {
      const route = createRoute([firstSegment, secondSegment]);

      // Calculate a score for this transfer option based on multiple factors
      let score = route.totalDuration; // Base score is the total duration

      // Factor 1: Position of transfer station relative to journey
      // Calculate how much of a detour this transfer represents
      const transferDistance = calculateDistance(
        originStation.coordinates,
        transferStation.coordinates
      ) + calculateDistance(
        transferStation.coordinates,
        destinationStation.coordinates
      );

      const detourFactor = transferDistance / directDistance;
      // Penalize transfers that represent significant detours
      if (detourFactor > 1.5) {
        score += (detourFactor - 1.5) * 300; // Add 300 seconds per 1.0 detour factor above 1.5
      }

      // Factor 2: Transfer station quality
      // Check if this is a major interchange (preferred for transfers)
      const isMajorInterchange = graph.interchangePoints.includes(transferStation.id);
      if (isMajorInterchange) {
        score -= 60; // Reduce score by 60 seconds (prefer major interchanges)
      }

      // Factor 3: Number of lines at transfer station (more lines = better transfer options)
      const transferStationLines = graph.getStationLines(transferStation.id);
      if (transferStationLines.length > 2) {
        score -= (transferStationLines.length - 2) * 20; // 20 seconds bonus per additional line
      }

      // Add this option to our list
      transferOptions.push({
        route,
        score,
        transferStationId: transferStation.id
      });

    } catch (error) {
      console.error('Error creating route:', error);
    }
  });

  // If no valid options, return null
  if (transferOptions.length === 0) return null;

  // Sort options by score (lower is better)
  transferOptions.sort((a, b) => a.score - b.score);

  // Log the top transfer options for debugging
  transferOptions.slice(0, Math.min(3, transferOptions.length)).forEach((option, index) => {
    const station = graph.stations[option.transferStationId];
    console.log(
      `[Transfer Route] Option ${index + 1}: Transfer at ${station.name}, ` +
      `duration: ${option.route.totalDuration}s, score: ${option.score}`
    );
  });

  // Return the route with the best score
  return transferOptions[0].route;
}

/**
 * Calculate number of stops between two stations on a line
 * Returns -1 if not possible (stations not on same line or in wrong order)
 */
function getStopsToDestination(
  line: TransitLine,
  fromStationId: string,
  toStationId: string
): number {
  const fromIndex = line.stations.indexOf(fromStationId);
  const toIndex = line.stations.indexOf(toStationId);

  // Check if both stations are on this line
  if (fromIndex === -1 || toIndex === -1) {
    return -1;
  }

  // Calculate number of stops
  if (toIndex > fromIndex) {
    // Forward direction
    return toIndex - fromIndex;
  } else if (fromIndex > toIndex) {
    // Backward direction
    return fromIndex - toIndex;
  }

  // Same station
  return 0;
}

/**
 * Find routes requiring multiple transfers using BFS
 */
function findMultiTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  maxTransfers: number = MAX_TRANSFERS,
  durationThreshold?: number
): Route[] {
  const routes: Route[] = [];
  const visitedStates = new Set<string>();
  const queue: TransferState[] = [];

  console.log(
    `[Transfer Route] Finding multi-transfer routes from ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );

  // Initialize queue with all lines at the origin station
  const originLines = graph.getStationLines(originId);
  if (!originLines.length) return routes;

  // Get destination lines for network analysis
  const destinationLines = graph.getStationLines(destinationId);
  console.log(
    `[Transfer Route] Destination is served by ${destinationLines.length} lines: ${destinationLines.join(', ')}`
  );

  // Get possible network paths and minimum transfers needed
  const { paths: networkPaths, minTransfers } = findPossibleNetworkPaths(graph, originLines, destinationLines);
  console.log(`[Multi Transfer] Network paths found: ${networkPaths.length} with min transfers: ${minTransfers}`);

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
          console.log(
            `[Transfer Route] Found route to destination with ${transferCount} transfers, duration: ${route.totalDuration}s`
          );
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

      // Check if the current station is a major interchange defined in MAJOR_INTERCHANGES
      const isMajorInterchange = graph.interchangePoints.includes(stationId);

      // Get line priority for destination
      const linePriorities: { lineId: string; priority: number; allowTransfer: boolean }[] = [];

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
          console.log(
            `[Transfer Route] Line ${nextLineId} has direct connection to destination with ${directStopsToDestination} stops (priority: ${basePriority})`
          );
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
            // One transfer away - high priority
            basePriority = 200;
            console.log(
              `[Transfer Route] Line ${nextLineId} needs one more transfer to reach destination (priority: ${basePriority})`
            );
          } else if (minTransfersToDestination === 2) {
            // Two transfers away - medium priority
            basePriority = 300;
            console.log(
              `[Transfer Route] Line ${nextLineId} needs two more transfers to reach destination (priority: ${basePriority})`
            );
          } else if (minTransfersToDestination === 3) {
            // Three transfers away - lower priority
            basePriority = 400;
            console.log(
              `[Transfer Route] Line ${nextLineId} needs three more transfers to reach destination (priority: ${basePriority})`
            );
          } else if (minTransfersToDestination !== Infinity) {
            // More than three but still reachable - low priority
            basePriority = 500 + minTransfersToDestination * 50;
            console.log(
              `[Transfer Route] Line ${nextLineId} needs ${minTransfersToDestination} more transfers to reach destination (priority: ${basePriority})`
            );
          } else {
            // No known path to destination - lowest priority
            basePriority = 800;
            console.log(
              `[Transfer Route] Line ${nextLineId} has no known path to destination (priority: ${basePriority})`
            );
          }
        }

        // Apply priority modifiers - reduce basePriority to increase priority

        // Boost priority for transfers at major interchanges
        if (isMajorInterchange) {
          basePriority -= 25;
          console.log(
            `[Transfer Route] Boosting priority for line ${nextLineId} as it's at a major interchange (-25 points)`
          );
        }

        // Boost for lines that are part of network paths between origin and destination
        if (isOnNetworkPath(nextLineId, networkPaths)) {
          basePriority -= 50;
          console.log(
            `[Transfer Route] Boosting priority for line ${nextLineId} as it's on a network path to destination (-50 points)`
          );
        }
        
        // Boost priority if this line is on the optimal transfer path
        const currentTransferCount = transferCount + 1; // +1 for this transfer
        const remainingTransfersNeeded = minTransfers - currentTransferCount;
        
        // If we're making good progress toward reaching destination with minimum transfers
        if (minTransfers > 0 && remainingTransfersNeeded >= 0) {
          // Calculate if this transfer follows the minimum transfer path
          let minTransfersFromHere = Infinity;
          for (const destLine of destinationLines) {
            const transfers = graph.getMinTransfersBetweenLines(nextLineId, destLine);
            if (transfers === remainingTransfersNeeded) {
              // This is on an optimal path - significant priority boost
              basePriority -= 75;
              console.log(
                `[Transfer Route] Found optimal transfer to line ${nextLineId} (${remainingTransfersNeeded} remaining transfers needed, -75 points)`
              );
              break;
            } else if (transfers < minTransfersFromHere) {
              minTransfersFromHere = transfers;
            }
          }
        }

        // Final priority value - lower is better
        const priority = basePriority;
        console.log(`[Transfer Route] Final priority for line ${nextLineId}: ${priority}`);

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
        
        const currentStation = graph.stations[stationId];
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
            console.log(
              `[Transfer Route] Transfer to ${nextLineId} is valuable because it reduces minimum transfers ` +
              `from ${minTransfersFromCurrentLine} to ${minTransfersFromNextLine}`
            );
          }
        }
        
        // For major interchanges with designated line pairs, consider the transfer more valuable
        const isValuableInterchangeTransfer = isMajorInterchange && 
                                             graph.getMajorInterchangeInfo(stationId)?.lines.includes(nextLineId);
                                     
        // For critical network path transfers, always consider valuable
        const isCriticalNetworkTransfer = isOnNetworkPath(nextLineId, networkPaths);
        
        if (!isTransferValuable && !isValuableInterchangeTransfer && !isCriticalNetworkTransfer) {
          console.log(
            `[Transfer Route] Skipping transfer to line ${nextLineId} at ${currentStation.name} (not valuable)`
          );
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
          console.log(
            `[Transfer Route] Skipping transfer to line ${nextLineId} at ${currentStation.name} (can't reach destination)`
          );
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

  console.log(`[Transfer Route] Found ${routes.length} multi-transfer routes`);
  return routes;
}

/**
 * Find possible network paths between origin and destination
 */
export function findPossibleNetworkPaths(
  graph: TransitGraph,
  originLines: string[],
  destinationLines: string[]
): { paths: string[][], minTransfers: number } {
  console.log(
    `[BFS] Finding possible network paths between lines ${originLines.join(
      ', '
    )} and ${destinationLines.join(', ')}`
  );

  let globalMinTransfers = Infinity;
  
  // Use line connectivity matrix to get minimum transfers directly
  for (const originLine of originLines) {
    for (const destLine of destinationLines) {
      const minTransfers = graph.getMinTransfersBetweenLines(originLine, destLine);
      if (minTransfers < globalMinTransfers) {
        globalMinTransfers = minTransfers;
        console.log(`[BFS] Found minimum transfers path: ${originLine} -> ${destLine} with ${minTransfers} transfers`);
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
    const visited = new Set<string>();
    
    // Start with the origin line
    queue.push({ line: originLine, path: [originLine], transfers: 0 });
    visited.add(originLine);
    
    // Keep track of paths reaching each line for pruning duplicates
    const bestTransfersToLine: Map<string, number> = new Map();
    bestTransfersToLine.set(originLine, 0);
    
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
          console.log(`[BFS] Found path with ${transfers} transfers: ${path.join(' -> ')}`);
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
    console.log(`[BFS] Warning: No complete paths found despite connectivity matrix showing min transfers: ${globalMinTransfers}`);
    
    // Fall back to using direct line data from connectivity matrix
    for (const originLine of originLines) {
      for (const destLine of destinationLines) {
        const transfers = graph.getMinTransfersBetweenLines(originLine, destLine);
        if (transfers === globalMinTransfers) {
          console.log(`[BFS] Adding fallback path: ${originLine} -> ... -> ${destLine}`);
          paths.push([originLine, destLine]);
        }
      }
    }
  }

  // Deduplicate paths while preserving order
  const uniquePaths = Array.from(new Map(paths.map(path => [path.join('|'), path])).values());

  console.log(
    `[BFS] Found ${uniquePaths.length} possible network paths with minimum ${globalMinTransfers} transfers`
  );
  
  return { paths: uniquePaths, minTransfers: globalMinTransfers };
}

/**
 * Check if a line is part of any network path in possible routes
 */
function isOnNetworkPath(lineId: string, networkPaths: string[][]): boolean {
  return networkPaths.some(path => path.includes(lineId));
}

/**
 * Check if a path has unnecessary transfers
 * Detects:
 * 1. Transferring at interchange without line change
 * 2. Multiple consecutive transfers at the same station
 * 3. Transfer to a line and then back to the original line
 * 4. Roundabout paths where a direct line exists
 */
function hasUnnecessaryTransfers(
  path: { stationId: string; lineId: string; isTransfer: boolean }[],
  graph?: TransitGraph
): boolean {
  // Need at least one transfer to have unnecessary transfers
  if (path.length < 3) return false;

  // Check each transfer point
  let lastLineId = path[0].lineId;
  let consecutiveTransfersAtSameStation = 0;

  // 1. Check for basic unnecessary transfers
  for (let i = 1; i < path.length; i++) {
    if (path[i].isTransfer) {
      const currentLineId = path[i].lineId;

      // Case 1: Transferring to the same line - always unnecessary
      if (currentLineId === lastLineId) {
        return true;
      }

      // Case 2: Multiple consecutive transfers at the same station
      if (
        i > 1 &&
        path[i].stationId === path[i - 1].stationId &&
        path[i - 1].isTransfer
      ) {
        consecutiveTransfersAtSameStation++;

        // If more than one consecutive transfer at same station, likely unnecessary
        if (consecutiveTransfersAtSameStation > 0) {
          return true;
        }
      } else {
        consecutiveTransfersAtSameStation = 0;
      }

      // Case 3: Check for "loop back" transfers (A→B→A pattern)
      if (i < path.length - 2) {
        for (let j = i + 1; j < path.length; j++) {
          if (path[j].isTransfer && path[j].lineId === lastLineId) {
            // Found a transfer back to a previously used line - likely unnecessary
            return true;
          }
        }
      }

      lastLineId = currentLineId;
    }
  }

  // 2. Check for roundabout paths - when we have graph available
  if (graph) {
    // Only analyze paths with at least one transfer
    const transferIndices = path
      .map((p, idx) => (p.isTransfer ? idx : -1))
      .filter((idx) => idx !== -1);

    if (transferIndices.length > 0) {
      // Get destination station ID
      const destinationStationId = path[path.length - 1].stationId;

      // For each transfer, check if there was a more direct route available
      for (let i = 0; i < transferIndices.length; i++) {
        const transferIndex = transferIndices[i];
        const transferStation = path[transferIndex].stationId;
        const transferLine = path[transferIndex].lineId;

        // Check lines at the transfer station
        const stationLines = graph.getStationLines(transferStation);

        for (const alternativeLine of stationLines) {
          // Skip the line we're transferring to
          if (alternativeLine === transferLine) continue;

          const line = graph.lines[alternativeLine];
          if (!line) continue;

          // Check if this alternative line directly reaches the destination
          if (line.stations.includes(destinationStationId)) {
            // If the line we're transferring from doesn't contain the destination
            const previousLine = path[transferIndex - 1].lineId;
            const prevLineObj = graph.lines[previousLine];

            if (
              prevLineObj &&
              !prevLineObj.stations.includes(destinationStationId)
            ) {
              // Found a better line at this transfer point - current transfer is unnecessary
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Check if a line has an interchange with any of the specified lines
 */
function hasCommonInterchange(
  lineId: string,
  otherLineIds: string[],
  graph: TransitGraph
): boolean {
  // Use the transferStations data structure to check for common stations
  const lineStations = graph.lines[lineId]?.stations || [];

  for (const stationId of lineStations) {
    // Look only at transfer stations
    if (graph.isTransferStation(stationId)) {
      // Get all lines serviced by this station
      const stationLines = graph.getStationLines(stationId);

      // Check if any of the target lines intersect with this station
      for (const otherLineId of otherLineIds) {
        if (stationLines.includes(otherLineId)) {
          return true;
        }
      }
    }
  }

  // If no direct interchange found, check for multi-hop connection via a third line
  for (const stationId of lineStations) {
    if (graph.isTransferStation(stationId)) {
      const connectingLines = graph.getStationLines(stationId);

      for (const connectingLine of connectingLines) {
        if (connectingLine === lineId) continue; // Skip self

        // Check if this connecting line intersects with any target line
        const connectingLineStations =
          graph.lines[connectingLine]?.stations || [];
        for (const transferStation of connectingLineStations) {
          if (graph.isTransferStation(transferStation)) {
            const transferStationLines = graph.getStationLines(transferStation);

            for (const otherLineId of otherLineIds) {
              if (transferStationLines.includes(otherLineId)) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Check if transferring to this line allows reaching new unvisited stations
 * or provides an efficient path toward the destination
 */
function hasNewReachableStations(
  line: TransitLine,
  currentStationId: string,
  visitedStations: Set<string>,
  destinationId: string,
  graph: TransitGraph
): boolean {
  // Find position of current station in line
  const stationIndex = line.stations.indexOf(currentStationId);
  if (stationIndex === -1) return false;

  // Get destination station for distance calculations
  const destinationStation = graph.stations[destinationId];
  if (!destinationStation) return false;

  // Special case: If the destination is on this line, it's always valuable
  if (line.stations.includes(destinationId)) {
    return true;
  }

  // Check for path to destination through network
  // This is critical for finding multi-transfer routes
  const destinationLines = graph.getStationLines(destinationId);
  
  // If this line can reach any line that serves the destination via transfers, consider it valuable
  if (hasCommonInterchange(line.id, destinationLines, graph)) {
    return true;
  }
  
  // Check if this line is part of a major interchange that can lead to the destination
  // This is crucial for complex multi-transfer journeys
  for (const interchange of graph.getMajorInterchanges()) {
    // If this line is part of a major interchange
    if (interchange.lines.includes(line.id)) {
      // Check if any other line at this interchange can lead to destination
      for (const interchangeLineId of interchange.lines) {
        if (interchangeLineId === line.id) continue; // Skip self
        
        // If this interchange line connects to destination
        if (destinationLines.includes(interchangeLineId) || 
            hasCommonInterchange(interchangeLineId, destinationLines, graph)) {
          return true;
        }
      }
    }
  }

  // Check for shortest path to destination - is there a direct line?
  const directLineToDestination = graph
    .getStationLines(currentStationId)
    .some((lineId) => {
      if (lineId === line.id) return false; // Skip current line

      const otherLine = graph.lines[lineId];
      if (!otherLine) return false;

      // Check if this line directly goes to destination
      if (otherLine.stations.includes(destinationId)) {
        // Get current station index on this line
        const currentIdx = otherLine.stations.indexOf(currentStationId);
        const destIdx = otherLine.stations.indexOf(destinationId);

        // Calculate number of stops
        const stopsCount = Math.abs(destIdx - currentIdx);

        // More flexible threshold: consider the length of the journey
        // For longer journeys, we can accept more stops on a direct line
        const maxAcceptableStops = Math.max(5, Math.ceil(otherLine.stations.length / 4));
        return stopsCount <= maxAcceptableStops;
      }

      return false;
    });

  // If there's a better direct line, don't transfer to this line
  if (directLineToDestination) {
    return false;
  }

  // Get current station coordinates for distance comparison
  const currentStation = graph.stations[currentStationId];
  if (!currentStation) return false;

  const currentDistance = calculateDistance(
    currentStation.coordinates,
    destinationStation.coordinates
  );

  // Check if this line has unvisited stations
  let hasUnvisitedStations = false;
  let closerToDestination = false;

  // Check all stations on this line (combine forward/backward checks)
  for (const stationId of line.stations) {
    // Skip the current station
    if (stationId === currentStationId) continue;

    // Check if station is unvisited
    if (!visitedStations.has(stationId)) {
      hasUnvisitedStations = true;
    }

    // Check if station is closer to destination
    const station = graph.stations[stationId];
    if (station) {
      const stationDistance = calculateDistance(
        station.coordinates,
        destinationStation.coordinates
      );

      // If this station is significantly closer to destination (at least 10% closer)
      if (stationDistance < currentDistance * 0.9) {
        closerToDestination = true;
      }
    }

    // Early return if we've found both benefits
    if (hasUnvisitedStations && closerToDestination) {
      return true;
    }
  }

  // Return true if either condition is met:
  // 1. We can reach new unvisited stations
  // 2. We can get significantly closer to the destination
  return hasUnvisitedStations || closerToDestination;
}

/**
 * Find stations that serve as transfer points between two or more lines
 */
function findCommonStations(lineIds: string[], graph: TransitGraph): Station[] {
  const commonStations: Station[] = [];

  // Check all stations for these lines
  for (const stationId of Object.keys(graph.stations)) {
    const station = graph.stations[stationId];
    if (!station) continue;

    // Use the transferStations map to find stations that serve multiple lines
    if (graph.isTransferStation(stationId)) {
      const stationLines = graph.getStationLines(stationId);

      // Check if this station serves all the requested lines
      const servesAllLines = lineIds.every((lineId) =>
        stationLines.includes(lineId)
      );

      if (servesAllLines) {
        commonStations.push(station);
      }
    }
  }

  return commonStations;
}

/**
 * Create a transit segment between two stations on a line
 */
function createSegmentBetweenStations(
  graph: TransitGraph,
  line: TransitLine,
  fromId: string,
  toId: string
): TransitRouteSegment | null {
  const stations = line.stations;

  // Find positions of origin and destination in the line's ordered stations
  const fromIndex = stations.indexOf(fromId);
  const toIndex = stations.indexOf(toId);

  // Skip if any station is not found in the line
  if (fromIndex === -1 || toIndex === -1) {
    return null;
  }

  // Determine segment station sequence
  let stationIds: string[] = [];
  if (toIndex > fromIndex) {
    // Forward direction
    stationIds = stations.slice(fromIndex, toIndex + 1);
  } else if (fromIndex > toIndex) {
    // Backward direction
    stationIds = stations.slice(toIndex, fromIndex + 1).reverse();
  } else {
    // Same station
    return null;
  }

  // Create transit segment
  return createTransitSegment(graph, line, stationIds);
}

/**
 * Construct a complete route from a BFS path
 */
function constructRouteFromPath(
  graph: TransitGraph,
  path: { stationId: string; lineId: string; isTransfer: boolean }[],
  originId?: string
): Route | null {
  if (path.length < 2) return null;

  const segments: TransitRouteSegment[] = [];
  let segmentStart = 0;

  // Process each transfer point to create segments
  for (let i = 1; i < path.length; i++) {
    if (path[i].isTransfer || i === path.length - 1) {
      // Extract segment from path
      const segmentPath = path.slice(segmentStart, i + 1);
      const lineId = segmentPath[0].lineId;
      const line = graph.lines[lineId];

      if (!line) continue;

      // Get station IDs for this segment
      const stationIds = segmentPath.map((p) => p.stationId);

      // Skip invalid segments - ensure we have at least 2 distinct stations
      if (stationIds.length < 2) continue;

      // Check for duplicate consecutive stations and remove them
      const uniqueStationIds = [];
      for (let j = 0; j < stationIds.length; j++) {
        if (j === 0 || stationIds[j] !== stationIds[j - 1]) {
          uniqueStationIds.push(stationIds[j]);
        }
      }

      // Skip if after deduplication we don't have at least 2 stations
      if (uniqueStationIds.length < 2) continue;

      // Check if stations are in correct order along the line
      const lineStations = line.stations;
      let validSegment = true;

      // Determine direction (forward or backward along line)
      const firstIdx = lineStations.indexOf(uniqueStationIds[0]);
      const lastIdx = lineStations.indexOf(
        uniqueStationIds[uniqueStationIds.length - 1]
      );

      if (firstIdx === -1 || lastIdx === -1) {
        validSegment = false;
      } else if (firstIdx < lastIdx) {
        // Forward direction - check all stations are in sequence
        for (let j = 1; j < uniqueStationIds.length; j++) {
          const expectedIdx = lineStations.indexOf(uniqueStationIds[j - 1]) + 1;
          const actualIdx = lineStations.indexOf(uniqueStationIds[j]);

          // Allow skipping stations, but ensure correct order
          if (actualIdx < expectedIdx) {
            validSegment = false;
            break;
          }
        }
      } else if (firstIdx > lastIdx) {
        // Backward direction - check all stations are in reverse sequence
        for (let j = 1; j < uniqueStationIds.length; j++) {
          const expectedIdx = lineStations.indexOf(uniqueStationIds[j - 1]) - 1;
          const actualIdx = lineStations.indexOf(uniqueStationIds[j]);

          // Allow skipping stations, but ensure correct order
          if (actualIdx > expectedIdx) {
            validSegment = false;
            break;
          }
        }
      }

      // Validate segment - ensure start and end stations are different
      if (
        validSegment &&
        uniqueStationIds[0] !== uniqueStationIds[uniqueStationIds.length - 1]
      ) {
        try {
          // Create segment only if it's a valid segment (no self-loops)
          const segment = createTransitSegment(graph, line, uniqueStationIds);
          if (segment) {
            segments.push(segment);
          }
        } catch (error) {
          console.warn(`Failed to create segment: ${error}`);
          continue;
        }
      }

      // If this was a transfer, make it the start of the next segment
      if (path[i].isTransfer) {
        segmentStart = i;
      }
    }
  }

  // Filter out segments with only one station or other invalid segments
  const validSegments = segments.filter(
    (segment) => segment.stations.length >= 2
  );

  // Only create a route if we have valid segments
  if (validSegments.length === 0) return null;

  // Add transfer wait times
  for (let i = 1; i < validSegments.length; i++) {
    validSegments[i].duration += INTERCHANGE_WALKING_TIME;
  }

  // Create and validate the route
  try {
    const route = createRoute(
      validSegments,
      originId ? ({ requestedOrigin: originId } as Route) : undefined
    );
    return route;
  } catch (error) {
    console.error('Error creating route from path:', error);
    return null;
  }
}
