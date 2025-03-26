import { TransitSegment, WalkSegment, RouteSegment } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { MetroLine } from '@/types/metro';
import {
  calculateTransitTime,
  calculateWalkingTime,
} from '@/server/core/shared/maps';
import { STOP_WAIT_TIME_SECONDS } from '@/lib/constants/config';
import { metroLines } from '@/lib/constants/metro-data';
import { calculateWalkingDuration } from '../../shared/graph-utils';

// Common helper for calculating walking metrics
async function getWalkingMetrics(
  fromCoords: Coordinates,
  toCoords: Coordinates
): Promise<{ duration: number; distance: number } | null> {
  // Skip if coordinates are identical
  if (fromCoords.lat === toCoords.lat && fromCoords.lng === toCoords.lng) {
    return null;
  }

  try {
    // Try using the API-based calculation first
    const walkResult = await calculateWalkingTime(fromCoords, toCoords);

    // If API calculation succeeds and returns valid results
    if (walkResult && walkResult.duration > 0 && walkResult.distance > 0) {
      return walkResult;
    }

    // If API calculation fails, fall back to local calculation
    const distance =
      Math.sqrt(
        Math.pow(fromCoords.lat - toCoords.lat, 2) +
          Math.pow(fromCoords.lng - toCoords.lng, 2)
      ) * 111000; // Rough conversion from degrees to meters

    if (distance <= 0) return null;

    const duration = calculateWalkingDuration(distance);

    return {
      duration,
      distance,
    };
  } catch (error) {
    console.error('Error calculating walking metrics:', error);
    return null;
  }
}

export async function createWalkingSegment(
  from: Station,
  to: Station,
  fromCoords: Coordinates,
  toCoords: Coordinates,
  isShortcut = false,
  isExplicitShortcut = false,
  priority = 0,
  isAccessWalk = false
): Promise<WalkSegment | null> {
  const walkMetrics = await getWalkingMetrics(fromCoords, toCoords);
  if (!walkMetrics) return null;

  return {
    type: 'walk',
    stations: [
      { ...from, coordinates: fromCoords },
      { ...to, coordinates: toCoords },
    ],
    duration: walkMetrics.duration,
    walkingTime: walkMetrics.duration,
    walkingDistance: walkMetrics.distance,
    isShortcut,
    isExplicitShortcut,
    priority: isExplicitShortcut ? priority : undefined,
    isAccessWalk,
  };
}

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

export async function completeSegmentInfo(
  segment: RouteSegment
): Promise<RouteSegment | WalkSegment | TransitSegment | null> {
  if (segment.type === 'walk') {
    const walkSegment = segment as WalkSegment;
    const [fromStation, toStation] = walkSegment.stations;

    // Use shared walking metrics function
    const walkMetrics = await getWalkingMetrics(
      fromStation.coordinates,
      toStation.coordinates
    );

    if (!walkMetrics) return null;

    return {
      ...walkSegment,
      duration: walkMetrics.duration,
      walkingTime: walkMetrics.duration,
      walkingDistance: walkMetrics.distance,
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

export function consolidateWalkingSegments(
  segments: RouteSegment[]
): RouteSegment[] {
  const consolidated: RouteSegment[] = [];
  let currentWalk: WalkSegment | null = null;

  for (const segment of segments) {
    if (segment.type === 'walk') {
      const walk = segment as WalkSegment;

      if (currentWalk) {
        currentWalk.duration += walk.duration;
        currentWalk.walkingTime += walk.walkingTime;
        currentWalk.walkingDistance += walk.walkingDistance;
        currentWalk.stations[1] = walk.stations[1];
      } else {
        currentWalk = { ...walk };
        consolidated.push(currentWalk);
      }
    } else {
      currentWalk = null;
      consolidated.push(segment);
    }
  }

  return consolidated.filter((segment) => segment.duration > 0);
}

export function getLineById(lineId: string): MetroLine | undefined {
  return metroLines.find((line) => line.id === lineId);
}

export async function findOptimalStationSequence(
  line: MetroLine,
  startStation: Station,
  endStation: Station,
  visitedStations?: Station[]
): Promise<Station[]> {
  if (startStation.id === endStation.id) {
    return [startStation];
  }

  const lineStations = line.stations;

  if (lineStations.length <= 1) {
    return visitedStations || [startStation, endStation];
  }

  const startIndex = lineStations.findIndex((s) => s.id === startStation.id);
  const endIndex = lineStations.findIndex((s) => s.id === endStation.id);

  if (startIndex === -1 || endIndex === -1) {
    return visitedStations || [startStation, endStation];
  }

  if (visitedStations && visitedStations.length > 1) {
    const visitedIds = new Set(visitedStations.map((s) => s.id));
    if (isValidPathOnLine(lineStations, visitedIds)) {
      return visitedStations;
    }
  }

  return findStationsBetween(lineStations, startIndex, endIndex);
}

function findStationsBetween(
  lineStations: Station[],
  startIndex: number,
  endIndex: number
): Station[] {
  if (startIndex === endIndex) return [lineStations[startIndex]];

  const stations: Station[] = [];

  if (startIndex < endIndex) {
    for (let i = startIndex; i <= endIndex; i++) {
      stations.push(lineStations[i]);
    }
  } else {
    for (let i = startIndex; i >= endIndex; i--) {
      stations.push(lineStations[i]);
    }
  }

  return stations;
}

function isValidPathOnLine(
  lineStations: Station[],
  stationIds: Set<string>
): boolean {
  if (stationIds.size <= 1) return true;

  const stationIndexMap = new Map<string, number>();
  lineStations.forEach((station, index) => {
    stationIndexMap.set(station.id, index);
  });

  const stationIndices: number[] = [];
  for (const id of stationIds) {
    const index = stationIndexMap.get(id);
    if (index === undefined) return false;
    stationIndices.push(index);
  }

  stationIndices.sort((a, b) => a - b);

  for (let i = 1; i < stationIndices.length; i++) {
    const diff = stationIndices[i] - stationIndices[i - 1];
    if (diff > 1 && diff !== lineStations.length - 1) {
      return false;
    }
  }

  return true;
}
