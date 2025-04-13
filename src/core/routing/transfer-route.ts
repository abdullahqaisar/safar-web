import { TransitGraph } from '../graph/graph';
import { Station, TransitLine } from '../types/graph';
import { Route, TransitRouteSegment } from '../types/route';
import { INTERCHANGE_WALKING_TIME, MAX_TRANSFERS } from '../utils/constants';
import { createRoute, createTransitSegment } from '../utils/route-builder';
import { calculateDistance } from '../utils/geo-utils';

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

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return routes;
  }

  // Get all lines for origin and destination
  const originLines = graph.getStationLines(originId);
  const destinationLines = graph.getStationLines(destinationId);

  // Track line pairs to avoid duplicate strategies
  const processedLinePairs = new Map<string, Route>();

  // For each origin line
  originLines.forEach((originLineId) => {
    // For each destination line
    destinationLines.forEach((destLineId) => {
      // Skip if lines are the same (would be a direct route)
      if (originLineId === destLineId) return;

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
      if (transferStations.length === 0) return;

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
        // Only add if it passes the duration threshold check (if specified)
        if (durationThreshold && bestRoute.totalDuration >= durationThreshold) {
          // Skip this route as it's not significantly better than direct options
          return;
        }

        processedLinePairs.set(linePairKey, bestRoute);
        routes.push(bestRoute);
      }
    });
  });

  return routes;
}

/**
 * Find the best transfer option among multiple possible transfer stations
 * for the same pair of lines
 */
function findBestTransferOption(
  graph: TransitGraph,
  originLine: TransitLine,
  destLine: TransitLine,
  originId: string,
  destinationId: string,
  transferStations: Station[]
): Route | null {
  const transferOptions: Route[] = [];

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

    // Calculate transfer time
    const transferTime = INTERCHANGE_WALKING_TIME;

    // Adjust second segment duration to include transfer time
    secondSegment.duration += transferTime;

    // Create complete route
    try {
      const route = createRoute([firstSegment, secondSegment]);
      transferOptions.push(route);
    } catch (error) {
      console.error('Error creating route:', error);
    }
  });

  // If no valid options, return null
  if (transferOptions.length === 0) return null;

  // Return the best option based on duration
  return transferOptions.sort((a, b) => a.totalDuration - b.totalDuration)[0];
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

  // Initialize queue with all lines at the origin station
  const originLines = graph.getStationLines(originId);
  if (!originLines.length) return routes;

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

      // First check: Are we at an interchange point?
      if (!graph.isTransferStation(stationId)) {
        continue; // Skip if not a transfer station
      }

      // Get line priority for destination
      const linePriorities: { lineId: string; priority: number }[] = [];

      // Calculate priority for each line at this station
      for (const nextLineId of stationLines) {
        // Skip current line
        if (nextLineId === lineId) continue;

        // Skip if we've already visited this station-line pair
        const nextStationLinePair = `${stationId}|${nextLineId}`;
        if (visitedStationLinePairs.has(nextStationLinePair)) continue;

        const nextLine = graph.lines[nextLineId];
        if (!nextLine) continue;

        // Check if this line directly contains the destination
        const directStopsToDestination = getStopsToDestination(
          nextLine,
          stationId,
          destinationId
        );

        // Assign priority based on destination presence
        let priority = 0;

        if (directStopsToDestination >= 0) {
          // Highest priority - direct line to destination
          priority = 100 - directStopsToDestination; // Fewer stops = higher priority
        } else if (hasCommonInterchange(nextLineId, [destinationId], graph)) {
          // Medium priority - line connects to destination via transfer
          priority = 50;
        } else {
          // Base priority - potentially useful line
          priority = 10;
        }

        linePriorities.push({ lineId: nextLineId, priority });
      }

      // Sort lines by priority (highest first)
      linePriorities.sort((a, b) => b.priority - a.priority);

      // Process lines in priority order
      for (const { lineId: nextLineId } of linePriorities) {
        const nextLine = graph.lines[nextLineId];
        const nextStationLinePair = `${stationId}|${nextLineId}`;

        // Check if this transfer would be useful
        const isTransferValuable = hasNewReachableStations(
          nextLine,
          stationId,
          visitedStations,
          destinationId,
          graph
        );

        if (!isTransferValuable) continue;

        // Check if this transfer gets us closer to the destination
        const destinationLines = graph.getStationLines(destinationId);
        const canReachDestination =
          destinationLines.includes(nextLineId) ||
          hasCommonInterchange(nextLineId, destinationLines, graph);

        if (!canReachDestination) continue;

        // Proceed with transfer
        const newVisitedLines = new Set(currentState.visitedLines);
        newVisitedLines.add(nextLineId);

        // Create new set of visited station-line pairs
        const newVisitedPairs = new Set(visitedStationLinePairs);
        newVisitedPairs.add(nextStationLinePair);

        // Enqueue the transfer state
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

        // If there's a direct line with fewer than 3 stops, prefer that
        return stopsCount <= 3;
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
