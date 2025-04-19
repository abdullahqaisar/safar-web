import { TransitGraph } from '../../graph/graph';
import { Station, TransitLine } from '../../types/graph';
import { Route, TransitRouteSegment } from '../../types/route';
import { INTERCHANGE_WALKING_TIME } from '../../utils/constants';
import { createRoute, createTransitSegment } from '../../utils/route-builder';
import { calculateDistance } from '../../utils/geo-utils';

/**
 * Calculate number of stops between two stations on a line
 * Returns -1 if not possible (stations not on same line or in wrong order)
 */
export function getStopsToDestination(
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
 * Check if a line is part of any network path in possible routes
 */
export function isOnNetworkPath(lineId: string, networkPaths: string[][]): boolean {
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
export function hasUnnecessaryTransfers(
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
export function hasCommonInterchange(
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
export function hasNewReachableStations(
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
export function findCommonStations(lineIds: string[], graph: TransitGraph): Station[] {
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
export function createSegmentBetweenStations(
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
export function constructRouteFromPath(
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
        } catch {
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
  } catch {
    return null;
  }
} 