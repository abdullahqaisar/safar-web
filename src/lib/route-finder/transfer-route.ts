import { Route, RouteSegment, Station } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import {
  calculateSegmentDistance,
  findInterchanges,
  getStationsBetween,
} from '@/utils/station';
import { calculateTransitTime, calculateWalkingTime } from '@/utils/maps';

async function createWalkingSegment(
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
 * Finds all possible routes including direct and transfer routes
 */
export async function findRoutes(
  fromLocation: google.maps.LatLngLiteral,
  toLocation: google.maps.LatLngLiteral,
  fromStation: Station,
  toStation: Station,
  maxTransfers = 2
): Promise<Route[]> {
  const routes: Route[] = [];
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );
  const toLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === toStation.id)
  );

  // Try direct route first
  const directLine = fromLines.find((line) => toLines.includes(line));
  if (directLine) {
    const stations = getStationsBetween(directLine, fromStation, toStation);
    if (stations.length > 0) {
      const segments: RouteSegment[] = [];

      // Initial walk
      const initialWalk = await createWalkingSegment(
        fromStation,
        stations[0],
        fromLocation,
        stations[0].coordinates
      );
      if (initialWalk) segments.push(initialWalk);

      // Transit segment
      const transitTime = await calculateTransitTime(
        stations[0],
        stations[stations.length - 1]
      );
      segments.push({
        type: 'transit',
        line: directLine,
        stations,
        duration: transitTime,
      });

      // Final walk
      const finalWalk = await createWalkingSegment(
        stations[stations.length - 1],
        toStation,
        stations[stations.length - 1].coordinates,
        toLocation
      );
      if (finalWalk) segments.push(finalWalk);

      const totalDuration = segments.reduce(
        (total, seg) => total + seg.duration,
        0
      );
      routes.push({
        segments,
        totalStops: stations.length - 1,
        totalDistance: calculateSegmentDistance(stations),
        totalDuration,
      });
    }
  }

  // Try transfer routes
  // Try single transfer routes
  for (const fromLine of fromLines) {
    for (const toLine of toLines) {
      if (fromLine.id === toLine.id) continue;

      const interchangeStations = findInterchanges(fromLine, toLine);

      for (const transfer of interchangeStations) {
        const segment1 = getStationsBetween(fromLine, fromStation, transfer);
        const segment2 = getStationsBetween(toLine, transfer, toStation);

        if (segment1.length > 0 && segment2.length > 0) {
          const totalDistance =
            calculateSegmentDistance(segment1) +
            calculateSegmentDistance(segment2);

          const segments: RouteSegment[] = [];

          // Add initial walking segment
          const walkToFirstStation = await createWalkingSegment(
            fromStation,
            segment1[0],
            fromLocation,
            {
              lat: segment1[0].coordinates.lat,
              lng: segment1[0].coordinates.lng,
            }
          );

          if (!walkToFirstStation) continue;

          segments.push(walkToFirstStation);

          // Add first transit segment
          segments.push({
            type: 'transit',
            line: fromLine,
            stations: segment1,
            duration: 0,
          });

          // Add second transit segment
          segments.push({
            type: 'transit',
            line: toLine,
            stations: segment2,
            duration: 0,
          });

          // Add final walking segment
          const walkToDestination = await createWalkingSegment(
            segment2[segment2.length - 1],
            toStation,
            {
              lat: segment2[segment2.length - 1].coordinates.lat,
              lng: segment2[segment2.length - 1].coordinates.lng,
            },
            toLocation
          );

          if (!walkToDestination) continue;

          segments.push(walkToDestination);

          routes.push({
            segments,
            totalStops: segment1.length + segment2.length - 2,
            totalDistance,
            totalDuration: 0,
          });
        }
      }
    }
  }

  // Try double transfer routes if needed
  if (routes.length === 0 && maxTransfers > 1) {
    const allLines = new Set(metroLines);

    for (const middleLine of Array.from(allLines)) {
      if (fromLines.includes(middleLine) || toLines.includes(middleLine))
        continue;

      for (const fromLine of fromLines) {
        for (const toLine of toLines) {
          const firstTransfers = findInterchanges(fromLine, middleLine);
          const secondTransfers = findInterchanges(middleLine, toLine);

          for (const firstTransfer of firstTransfers) {
            for (const secondTransfer of secondTransfers) {
              const segment1 = getStationsBetween(
                fromLine,
                fromStation,
                firstTransfer
              );
              const segment2 = getStationsBetween(
                middleLine,
                firstTransfer,
                secondTransfer
              );
              const segment3 = getStationsBetween(
                toLine,
                secondTransfer,
                toStation
              );

              if (
                segment1.length > 0 &&
                segment2.length > 0 &&
                segment3.length > 0
              ) {
                const totalDistance =
                  calculateSegmentDistance(segment1) +
                  calculateSegmentDistance(segment2) +
                  calculateSegmentDistance(segment3);

                const segments: RouteSegment[] = [];

                // Add initial walking segment
                const walkToFirstStation = await createWalkingSegment(
                  fromStation,
                  segment1[0],
                  fromLocation,
                  {
                    lat: segment1[0].coordinates.lat,
                    lng: segment1[0].coordinates.lng,
                  }
                );

                if (!walkToFirstStation) continue;

                segments.push(walkToFirstStation);

                // Add all transit segments
                segments.push(
                  {
                    type: 'transit',
                    line: fromLine,
                    stations: segment1,
                    duration: 0,
                  },
                  {
                    type: 'transit',
                    line: middleLine,
                    stations: segment2,
                    duration: 0,
                  },
                  {
                    type: 'transit',
                    line: toLine,
                    stations: segment3,
                    duration: 0,
                  }
                );

                // Add final walking segment
                const walkToDestination = await createWalkingSegment(
                  segment3[segment3.length - 1],
                  toStation,
                  {
                    lat: segment3[segment3.length - 1].coordinates.lat,
                    lng: segment3[segment3.length - 1].coordinates.lng,
                  },
                  toLocation
                );

                if (!walkToDestination) continue;

                segments.push(walkToDestination);

                routes.push({
                  segments,
                  totalStops:
                    segment1.length + segment2.length + segment3.length - 3,
                  totalDistance,
                  totalDuration: 0,
                });
              }
            }
          }
        }
      }
    }
  }

  // Calculate times for each route
  for (const route of routes) {
    let totalDuration = 0;

    for (let i = 0; i < route.segments.length; i++) {
      const segment = route.segments[i];

      if (segment.type === 'walk') {
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
      } else if (segment.type === 'transit') {
        const transitTime = await calculateTransitTime(
          segment.stations[0],
          segment.stations[segment.stations.length - 1]
        );
        segment.duration = transitTime;
        totalDuration += transitTime;

        // Handle transfer walking if needed
        if (
          i < route.segments.length - 1 &&
          route.segments[i + 1].type === 'transit'
        ) {
          const walkTime = await calculateWalkingTime(
            {
              lat: segment.stations[segment.stations.length - 1].coordinates
                .lat,
              lng: segment.stations[segment.stations.length - 1].coordinates
                .lng,
            },
            {
              lat: route.segments[i + 1].stations[0].coordinates.lat,
              lng: route.segments[i + 1].stations[0].coordinates.lng,
            }
          );

          if (!walkTime) continue;
          totalDuration += walkTime.duration;
        }
      }
    }

    route.totalDuration = totalDuration;
  }

  return routes.filter((route) => route.totalDuration > 0);
}
