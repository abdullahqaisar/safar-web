import { Route, RouteSegment } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { calculateTransitTime, calculateWalkingTime } from '@/lib/utils/maps';

export async function createWalkingSegment(
  from: Station,
  to: Station,
  fromCoords: Coordinates,
  toCoords: Coordinates
): Promise<RouteSegment | null> {
  // Validate coordinates
  if (!fromCoords || !toCoords) return null;

  // Check if stations are at the same location
  const isSameLocation =
    fromCoords.lat === toCoords.lat && fromCoords.lng === toCoords.lng;
  if (isSameLocation) return null;

  // Ensure we get a valid walking result
  const walkResult = await calculateWalkingTime(fromCoords, toCoords);
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
}

/**
 * Calculate the timing for all routes
 */
export async function calculateRouteTimes(routes: Route[]): Promise<Route[]> {
  const validRoutes: Route[] = [];

  for (const route of routes) {
    let isValidRoute = true;
    let totalDuration = 0;
    const newSegments: RouteSegment[] = [];

    for (let i = 0; i < route.segments.length; i++) {
      const segment = { ...route.segments[i] };

      if (segment.type === 'walk') {
        const [fromStation, toStation] = segment.stations;

        // Skip invalid or unnecessary walks
        if (
          fromStation.coordinates.lat === toStation.coordinates.lat &&
          fromStation.coordinates.lng === toStation.coordinates.lng
        ) {
          continue;
        }

        const walkResult = await calculateWalkingTime(
          fromStation.coordinates,
          toStation.coordinates
        );

        if (!walkResult || walkResult.duration <= 0) {
          isValidRoute = false;
          break;
        }

        segment.duration = walkResult.duration;
        segment.walkingTime = walkResult.duration;
        segment.walkingDistance = walkResult.distance;
        totalDuration += walkResult.duration;
        newSegments.push(segment);
      } else if (segment.type === 'transit') {
        const transitTime = await calculateTransitTime(
          segment.stations[0],
          segment.stations[segment.stations.length - 1]
        );

        if (transitTime <= 0) {
          isValidRoute = false;
          break;
        }

        segment.duration = transitTime;
        totalDuration += transitTime;
        newSegments.push(segment);

        // Handle transfers
        if (
          i < route.segments.length - 1 &&
          route.segments[i + 1].type === 'transit'
        ) {
          const lastStation = segment.stations[segment.stations.length - 1];
          const nextFirstStation = route.segments[i + 1].stations[0];

          if (
            lastStation.id !== nextFirstStation.id &&
            (lastStation.coordinates.lat !== nextFirstStation.coordinates.lat ||
              lastStation.coordinates.lng !== nextFirstStation.coordinates.lng)
          ) {
            const transferWalk = await createWalkingSegment(
              lastStation,
              nextFirstStation,
              lastStation.coordinates,
              nextFirstStation.coordinates
            );

            if (transferWalk) {
              newSegments.push(transferWalk);
              totalDuration += transferWalk.duration;
            }
          }
        }
      }
    }

    if (isValidRoute && newSegments.length > 0 && totalDuration > 0) {
      validRoutes.push({
        segments: newSegments,
        totalStops: route.totalStops,
        totalDistance: route.totalDistance,
        totalDuration,
      });
    }
  }

  return validRoutes;
}
