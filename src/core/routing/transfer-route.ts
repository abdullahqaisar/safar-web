import { TransitGraph } from '../graph/graph';
import { Station, TransitLine } from '../types/graph';
import { Route, TransitRouteSegment } from '../types/route';
import { INTERCHANGE_WALKING_TIME } from '../utils/constants';
import { createRoute, createTransitSegment } from '../utils/route-builder';

// Maximum allowed transfers (we could make this configurable later)
const MAX_TRANSFERS = 2;

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
  maxTransfers: number = MAX_TRANSFERS
): Route[] {
  // First try single transfer routes (most common and more efficient to find directly)
  const singleTransferRoutes = findSingleTransferRoutes(
    graph,
    originId,
    destinationId
  );

  // If we need more transfers or single transfer didn't find anything
  if (maxTransfers > 1 || singleTransferRoutes.length === 0) {
    const multiTransferRoutes = findMultiTransferRoutes(
      graph,
      originId,
      destinationId,
      Math.min(maxTransfers, MAX_TRANSFERS) // Never exceed MAX_TRANSFERS
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
  destinationId: string
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

  // For each origin line
  originLines.forEach((originLineId) => {
    // For each destination line
    destinationLines.forEach((destLineId) => {
      // Skip if lines are the same (would be a direct route)
      if (originLineId === destLineId) return;

      const originLine = graph.lines[originLineId];
      const destLine = graph.lines[destLineId];

      if (!originLine || !destLine) return;

      // Find common interchange stations between these lines
      const transferStations = findCommonStations(
        [originLineId, destLineId],
        graph
      );

      // For each potential transfer station
      transferStations.forEach((transferStation) => {
        // Skip if transfer station is the origin or destination
        if (
          transferStation.id === originId ||
          transferStation.id === destinationId
        )
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
        const route = createRoute([firstSegment, secondSegment]);
        routes.push(route);
      });
    });
  });

  return routes;
}

/**
 * Find routes requiring multiple transfers using BFS
 */
function findMultiTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  maxTransfers: number = MAX_TRANSFERS
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
      const route = constructRouteFromPath(graph, path);
      if (route) routes.push(route);
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
    // Only if we haven't reached the max transfer count
    if (transferCount < maxTransfers) {
      // Get all lines passing through this station
      const stationLines = graph.getStationLines(stationId);

      // For each line at this station (potential transfer)
      stationLines.forEach((nextLineId) => {
        // Skip if it's the current line (no transfer needed)
        if (nextLineId === lineId) return;

        // Skip if we've already used this line (avoid circular transfers)
        if (currentState.visitedLines.has(nextLineId)) return;

        const nextLine = graph.lines[nextLineId];
        if (!nextLine) return;

        const newVisitedLines = new Set(currentState.visitedLines);
        newVisitedLines.add(nextLineId);

        // Enqueue the transfer state
        queue.push({
          stationId: stationId, // Same station, new line
          lineId: nextLineId,
          transferCount: transferCount + 1,
          visitedStations: new Set(visitedStations),
          visitedLines: newVisitedLines,
          path: [
            ...path,
            {
              stationId: stationId,
              lineId: nextLineId,
              isTransfer: true, // Mark as a transfer point
            },
          ],
        });
      });
    }
  }

  return routes;
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

      // Create segment
      const segment = createTransitSegment(graph, line, stationIds);
      segments.push(segment);

      // If this was a transfer, make it the start of the next segment
      if (path[i].isTransfer) {
        segmentStart = i;
      }
    }
  }

  // Add transfer wait times
  for (let i = 1; i < segments.length; i++) {
    segments[i].duration += INTERCHANGE_WALKING_TIME;
  }

  // Create the route
  return createRoute(segments);
}
