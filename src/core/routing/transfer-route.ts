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
      Math.min(maxTransfers, MAX_TRANSFERS), // Never exceed MAX_TRANSFERS
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
    const { stationId, lineId, transferCount, visitedStations, path } =
      currentState;

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
      if (!hasUnnecessaryTransfers(path)) {
        const route = constructRouteFromPath(graph, path);

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
        if (!visitedStations.has(nextStationId)) {
          const newVisitedStations = new Set(visitedStations);
          newVisitedStations.add(nextStationId);

          queue.push({
            stationId: nextStationId,
            lineId: lineId,
            transferCount: transferCount,
            visitedStations: newVisitedStations,
            visitedLines: currentState.visitedLines,
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
        if (!visitedStations.has(prevStationId)) {
          const newVisitedStations = new Set(visitedStations);
          newVisitedStations.add(prevStationId);

          queue.push({
            stationId: prevStationId,
            lineId: lineId,
            transferCount: transferCount,
            visitedStations: newVisitedStations,
            visitedLines: currentState.visitedLines,
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
      if (
        !graph.stations[stationId].isInterchange &&
        stationLines.length <= 1
      ) {
        continue; // Skip if not an interchange
      }

      stationLines.forEach((nextLineId) => {
        // Skip if it's the current line (no transfer needed)
        if (nextLineId === lineId) return;

        // Skip if we've already used this line
        if (currentState.visitedLines.has(nextLineId)) return;

        const nextLine = graph.lines[nextLineId];
        if (!nextLine) return;

        // Check if this transfer would be useful
        // 1. Can this line reach new stations or approach destination more efficiently?
        const isTransferValuable = hasNewReachableStations(
          nextLine,
          stationId,
          visitedStations,
          destinationId,
          graph
        );

        if (!isTransferValuable) return;

        // 2. Can this transfer get us closer to the destination?
        // Only allow transfers that are either:
        // - To a line that contains the destination
        // - To a line that intersects with a line containing the destination
        const destinationLines = graph.getStationLines(destinationId);
        const canReachDestination =
          destinationLines.includes(nextLineId) ||
          hasCommonInterchange(nextLineId, destinationLines, graph);

        if (!canReachDestination) return;

        // Proceed with transfer
        const newVisitedLines = new Set(currentState.visitedLines);
        newVisitedLines.add(nextLineId);

        // Enqueue the transfer state
        queue.push({
          stationId: stationId,
          lineId: nextLineId,
          transferCount: transferCount + 1,
          visitedStations: new Set(visitedStations),
          visitedLines: newVisitedLines,
          path: [
            ...path,
            {
              stationId: stationId,
              lineId: nextLineId,
              isTransfer: true,
            },
          ],
        });
      });
    }
  }

  return routes;
}

/**
 * Check if a path has unnecessary transfers (transferring at interchange without line change)
 */
function hasUnnecessaryTransfers(
  path: { stationId: string; lineId: string; isTransfer: boolean }[]
): boolean {
  // Need at least one transfer to have unnecessary transfers
  if (path.length < 3) return false;

  // Check each transfer point
  let lastLineId = path[0].lineId;
  let consecutiveTransfersAtSameStation = 0;

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

      lastLineId = currentLineId;
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
  // Get all interchanges for the line
  const lineStations = graph.lines[lineId]?.stations || [];

  for (const stationId of lineStations) {
    if (graph.stations[stationId]?.isInterchange) {
      // Check if this interchange connects to any of the target lines
      const stationLines = graph.getStationLines(stationId);

      for (const otherLineId of otherLineIds) {
        if (stationLines.includes(otherLineId)) {
          return true;
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

  // Option 1: Check for new stations (existing functionality)
  let hasUnvisitedStations = false;
  let closerToDestination = false;
  let currentDistance = Number.MAX_SAFE_INTEGER;

  // Get current station coordinates for distance comparison
  const currentStation = graph.stations[currentStationId];
  if (currentStation) {
    currentDistance = calculateDistance(
      currentStation.coordinates,
      destinationStation.coordinates
    );
  }

  // Check forward direction
  for (let i = stationIndex + 1; i < line.stations.length; i++) {
    const stationId = line.stations[i];

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

  // Check backward direction
  for (let i = stationIndex - 1; i >= 0; i--) {
    const stationId = line.stations[i];

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
 * Find stations that connect multiple lines
 */
function findCommonStations(lineIds: string[], graph: TransitGraph): Station[] {
  const commonStations: Station[] = [];

  // Look at all interchange points in the graph
  for (const stationId of graph.interchangePoints) {
    const station = graph.stations[stationId];
    if (!station) continue;

    // Get the lines that pass through this station
    const stationLines = graph.getStationLines(stationId);

    // Check if this station serves all the lines we're interested in
    const hasAllLines = lineIds.every((lineId) =>
      stationLines.includes(lineId)
    );

    if (hasAllLines) {
      commonStations.push(station);
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
  path: { stationId: string; lineId: string; isTransfer: boolean }[]
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

      // NEW CODE: Validate segment - ensure start and end stations are different
      if (
        stationIds.length >= 2 &&
        stationIds[0] !== stationIds[stationIds.length - 1]
      ) {
        // Create segment only if it's a valid segment (no self-loops)
        const segment = createTransitSegment(graph, line, stationIds);
        segments.push(segment);
      }

      // If this was a transfer, make it the start of the next segment
      if (path[i].isTransfer) {
        segmentStart = i;
      }
    }
  }

  // NEW CODE: Filter out segments with only one station
  const validSegments = segments.filter(
    (segment) => segment.stations.length > 1
  );

  // Only create a route if we have valid segments
  if (validSegments.length === 0) return null;

  // Add transfer wait times
  for (let i = 1; i < validSegments.length; i++) {
    validSegments[i].duration += INTERCHANGE_WALKING_TIME;
  }

  // Create the route
  return createRoute(validSegments);
}
