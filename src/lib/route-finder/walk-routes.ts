import { Route, RouteSegment, Station } from '@/types/metro';
import { calculateTransitTime, calculateWalkingTime } from '@/utils/maps';

export async function createWalkingSegment(
  from: Station,
  to: Station,
  fromCoords: google.maps.LatLngLiteral,
  toCoords: google.maps.LatLngLiteral
): Promise<RouteSegment | null> {
  const walkResult = await calculateWalkingTime(fromCoords, toCoords);
  if (!walkResult) return null;

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
  const calculatedRoutes: Route[] = [];

  for (const route of routes) {
    let totalDuration = 0;
    const newSegments: RouteSegment[] = [];

    for (let i = 0; i < route.segments.length; i++) {
      const segment = { ...route.segments[i] };

      if (segment.type === 'walk') {
        // Check if stations are at the same location
        const isSameLocation =
          segment.stations[0].coordinates.lat ===
            segment.stations[1].coordinates.lat &&
          segment.stations[0].coordinates.lng ===
            segment.stations[1].coordinates.lng;

        if (isSameLocation) {
          continue; // Skip walking segment for same location
        }

        const walkResult = await calculateWalkingTime(
          {
            lat: segment.stations[0].coordinates.lat,
            lng: segment.stations[0].coordinates.lng,
          },
          {
            lat: segment.stations[1].coordinates.lat,
            lng: segment.stations[1].coordinates.lng,
          }
        );

        if (!walkResult) continue;

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
        segment.duration = transitTime;
        totalDuration += transitTime;
        newSegments.push(segment);

        // Add transfer walking time between transit segments if needed
        if (
          i < route.segments.length - 1 &&
          route.segments[i + 1].type === 'transit'
        ) {
          const lastStation = segment.stations[segment.stations.length - 1];
          const nextFirstStation = route.segments[i + 1].stations[0];

          // Check if interchange stations are at the same location
          const isSameLocation =
            lastStation.coordinates.lat === nextFirstStation.coordinates.lat &&
            lastStation.coordinates.lng === nextFirstStation.coordinates.lng;

          if (!isSameLocation) {
            const walkTime = await calculateWalkingTime(
              {
                lat: lastStation.coordinates.lat,
                lng: lastStation.coordinates.lng,
              },
              {
                lat: nextFirstStation.coordinates.lat,
                lng: nextFirstStation.coordinates.lng,
              }
            );

            if (walkTime) {
              const transferSegment: RouteSegment = {
                type: 'walk',
                stations: [lastStation, nextFirstStation],
                duration: walkTime.duration,
                walkingTime: walkTime.duration,
                walkingDistance: walkTime.distance,
              };

              newSegments.push(transferSegment);
              totalDuration += walkTime.duration;
            }
          }
        }
      }
    }

    calculatedRoutes.push({
      segments: newSegments,
      totalStops: route.totalStops,
      totalDistance: route.totalDistance,
      totalDuration,
    });
  }

  return calculatedRoutes;
}
