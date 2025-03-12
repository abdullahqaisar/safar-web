import { TransitSegment, WalkSegment, RouteSegment } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { MetroLine } from '@/types/metro';
import {
  calculateTransitTime,
  calculateWalkingTime,
} from '@/server/core/shared/maps';
import { calculateHaversineDistance } from '@/server/core/shared/distance';
import { STOP_WAIT_TIME_SECONDS } from '@/lib/constants/config';
import { metroLines } from '@/lib/constants/metro-data';

/**
 * Creates a walking segment between two points
 */
export async function createWalkingSegment(
  from: Station,
  to: Station,
  fromCoords: Coordinates,
  toCoords: Coordinates
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
        color: line.color,
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
 * Calculate transit segment metrics (distance, stops)
 */
export function calculateTransitMetrics(segment: TransitSegment): {
  distance: number;
  stops: number;
} {
  let distance = 0;
  const stops = segment.stations.length - 1;

  for (let i = 0; i < segment.stations.length - 1; i++) {
    const from = segment.stations[i].coordinates;
    const to = segment.stations[i + 1].coordinates;
    distance += calculateHaversineDistance(from, to);
  }

  return { distance, stops };
}
