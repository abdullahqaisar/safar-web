import { TransitSegment, WalkSegment } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { MetroLine } from '@/types/metro';
import { calculateTransitTime, calculateWalkingTime } from '@/lib/utils/maps';

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

    return {
      type: 'transit',
      line,
      stations,
      duration: transitTime,
    };
  } catch (error) {
    console.error('Error calculating transit segment:', error);
    return null;
  }
}
