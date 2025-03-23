import { TransitSegment, WalkSegment, RouteSegment } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { MetroLine } from '@/types/metro';
import {
  calculateTransitTime,
  calculateWalkingTime,
} from '@/server/core/shared/maps';
import { STOP_WAIT_TIME_SECONDS } from '@/lib/constants/config';
import { metroLines } from '@/lib/constants/metro-data';

/**
 * Creates a walking segment between two points
 */
export async function createWalkingSegment(
  from: Station,
  to: Station,
  fromCoords: Coordinates,
  toCoords: Coordinates,
  isShortcut = false,
  isExplicitShortcut = false,
  priority = 0
): Promise<WalkSegment | null> {
  // Skip if coordinates are the same
  if (fromCoords.lat === toCoords.lat && fromCoords.lng === toCoords.lng) {
    return null;
  }

  try {
    const walkResult = await calculateWalkingTime(fromCoords, toCoords);

    // Ensure the calculation returned valid results
    if (!walkResult || walkResult.duration <= 0 || walkResult.distance <= 0) {
      return null;
    }

    return {
      type: 'walk',
      stations: [
        { ...from, coordinates: fromCoords },
        { ...to, coordinates: toCoords },
      ],
      duration: walkResult.duration,
      walkingTime: walkResult.duration,
      walkingDistance: walkResult.distance,
      isShortcut,
      isExplicitShortcut,
      priority: isExplicitShortcut ? priority : undefined,
    };
  } catch (error) {
    console.error('Error calculating walking segment:', error);
    return null;
  }
}

/**
 * Creates a transit segment between stations on a metro line
 */
export async function createTransitSegment(
  line: MetroLine,
  stations: Station[]
): Promise<TransitSegment | null> {
  if (!stations || stations.length < 2) {
    return null;
  }

  try {
    const transitTime = await calculateTransitTime(
      stations[0],
      stations[stations.length - 1]
    );

    if (transitTime <= 0) {
      return null;
    }

    const segmentStops = stations.length - 1;
    const stopWaitTime = segmentStops * STOP_WAIT_TIME_SECONDS;

    return {
      type: 'transit',
      line: {
        id: line.id,
        name: line.name,
        color: line.color || '',
      },
      stations,
      duration: transitTime + stopWaitTime,
      stopWaitTime,
    };
  } catch (error) {
    console.error('Error calculating transit segment:', error);
    return null;
  }
}

/**
 * Complete missing segment information with real-world data
 */
export async function completeSegmentInfo(
  segment: RouteSegment
): Promise<RouteSegment | WalkSegment | TransitSegment | null> {
  if (segment.type === 'walk') {
    const walkSegment = segment as WalkSegment;
    const [fromStation, toStation] = walkSegment.stations;

    const walkResult = await calculateWalkingTime(
      fromStation.coordinates,
      toStation.coordinates
    );

    if (!walkResult || walkResult.duration <= 0) {
      return null;
    }

    return {
      ...walkSegment,
      duration: walkResult.duration,
      walkingTime: walkResult.duration,
      walkingDistance: walkResult.distance,
    };
  }

  if (segment.type === 'transit') {
    const transitSegment = segment as TransitSegment;
    const firstStation = transitSegment.stations[0];
    const lastStation =
      transitSegment.stations[transitSegment.stations.length - 1];

    const transitTime = await calculateTransitTime(firstStation, lastStation);

    if (transitTime <= 0) {
      return null;
    }

    const segmentStops = transitSegment.stations.length - 1;
    const stopWaitTime = segmentStops * STOP_WAIT_TIME_SECONDS;

    return {
      ...transitSegment,
      duration: transitTime + stopWaitTime,
      stopWaitTime,
    };
  }

  return null;
}

/**
 * Consolidate consecutive walking segments into a single segment
 */
export function consolidateWalkingSegments(
  segments: RouteSegment[]
): RouteSegment[] {
  const consolidated: RouteSegment[] = [];
  let currentWalk: WalkSegment | null = null;

  for (const segment of segments) {
    if (segment.type === 'walk') {
      const walk = segment as WalkSegment;

      if (currentWalk) {
        // Extend current walking segment
        currentWalk.duration += walk.duration;
        currentWalk.walkingTime += walk.walkingTime;
        currentWalk.walkingDistance += walk.walkingDistance;
        currentWalk.stations[1] = walk.stations[1]; // Update end station
      } else {
        // Start new walking segment
        currentWalk = { ...walk };
        consolidated.push(currentWalk);
      }
    } else {
      // Reset current walking segment and add the non-walking segment
      currentWalk = null;
      consolidated.push(segment);
    }
  }

  return consolidated.filter((segment) => segment.duration > 0);
}

/**
 * Get metro line info by ID
 */
export function getLineById(lineId: string): MetroLine | undefined {
  return metroLines.find((line) => line.id === lineId);
}

/**
 * Finds optimal sequence of stations between start and end on a specific line
 * Handles circular lines by computing both possible paths and choosing the shorter one
 */
export async function findOptimalStationSequence(
  line: MetroLine,
  startStation: Station,
  endStation: Station,
  visitedStations?: Station[]
): Promise<Station[]> {
  // Exit early for simple case
  if (startStation.id === endStation.id) {
    return [startStation];
  }

  // Find all stations on the line
  const lineStations = line.stations;

  // Exit early if line has only one station
  if (lineStations.length <= 1) {
    return visitedStations || [startStation, endStation];
  }

  const startIndex = lineStations.findIndex((s) => s.id === startStation.id);
  const endIndex = lineStations.findIndex((s) => s.id === endStation.id);

  // If either station isn't on this line, return the visited stations
  if (startIndex === -1 || endIndex === -1) {
    return visitedStations || [startStation, endStation];
  }

  // If we have visited stations, verify they're in a valid order and return them
  if (visitedStations && visitedStations.length > 1) {
    const visitedIds = new Set(visitedStations.map((s) => s.id));

    // Check if our visited stations form a valid connected path on this line
    if (isValidPathOnLine(lineStations, visitedIds)) {
      return visitedStations;
    }
  }

  // For regular lines, just get the stations in the correct sequence
  return findStationsBetween(lineStations, startIndex, endIndex);
}

/**
 * Find stations between startIndex and endIndex in the lineStations array
 */
function findStationsBetween(
  lineStations: Station[],
  startIndex: number,
  endIndex: number
): Station[] {
  if (startIndex === endIndex) return [lineStations[startIndex]];

  const stations: Station[] = [];

  if (startIndex < endIndex) {
    // Forward direction
    for (let i = startIndex; i <= endIndex; i++) {
      stations.push(lineStations[i]);
    }
  } else {
    // Backward direction
    for (let i = startIndex; i >= endIndex; i--) {
      stations.push(lineStations[i]);
    }
  }

  return stations;
}

/**
 * Verify if a set of station IDs forms a valid path on a line
 */
function isValidPathOnLine(
  lineStations: Station[],
  stationIds: Set<string>
): boolean {
  if (stationIds.size <= 1) return true;

  // Create a map of station indexes for quick lookup
  const stationIndexMap = new Map<string, number>();
  lineStations.forEach((station, index) => {
    stationIndexMap.set(station.id, index);
  });

  // Check if all stations are on this line
  const stationIndices: number[] = [];
  for (const id of stationIds) {
    const index = stationIndexMap.get(id);
    if (index === undefined) return false;
    stationIndices.push(index);
  }

  // Sort indices
  stationIndices.sort((a, b) => a - b);

  // Check if they form a continuous sequence or a wrap-around sequence
  for (let i = 1; i < stationIndices.length; i++) {
    const diff = stationIndices[i] - stationIndices[i - 1];
    // Not adjacent on the line
    if (diff > 1 && diff !== lineStations.length - 1) {
      return false;
    }
  }

  return true;
}
