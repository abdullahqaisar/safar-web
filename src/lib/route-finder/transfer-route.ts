import { MetroLine, Route, RouteSegment, Station } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import {
  calculateSegmentDistance,
  findInterchanges,
  getStationsBetween,
} from '@/utils/station';
import { calculateTransitTime } from '@/utils/maps';
import { calculateRouteTimes, createWalkingSegment } from './walk-routes';

/**
 * Finds all possible routes including direct and transfer routes
 */
export async function findRoutes(
  fromLocation: google.maps.LatLngLiteral,
  toLocation: google.maps.LatLngLiteral,
  fromStation: Station,
  toStation: Station,
  maxTransfers = Infinity
): Promise<Route[]> {
  const routes: Route[] = [];

  // Find direct route
  const directRoute = await findDirectRoute(
    fromLocation,
    toLocation,
    fromStation,
    toStation
  );

  if (directRoute) {
    routes.push(directRoute);
  }

  // Find all possible transfer routes
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );

  // Initialize a path tracking structure for BFS/DFS
  const transferRoutes = await findAllTransferRoutes(
    fromStation,
    toStation,
    fromLines,
    maxTransfers,
    fromLocation,
    toLocation
  );

  routes.push(...transferRoutes);

  // Calculate times for each route
  const calculatedRoutes = await calculateRouteTimes(routes);

  return calculatedRoutes
    .filter((route) => route.totalDuration > 0)
    .sort((a, b) => {
      // Sort by duration first, then number of segments (transfers), then stops
      if (a.totalDuration !== b.totalDuration) {
        return a.totalDuration - b.totalDuration;
      }
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length;
      }
      return a.totalStops - b.totalStops;
    });
}

/**
 * Find a direct route between two stations
 */
async function findDirectRoute(
  fromLocation: google.maps.LatLngLiteral,
  toLocation: google.maps.LatLngLiteral,
  fromStation: Station,
  toStation: Station
): Promise<Route | null> {
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );
  const toLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === toStation.id)
  );

  // Check if there's a direct line
  const directLine = fromLines.find((line) => toLines.includes(line));
  if (!directLine) return null;

  const stations = getStationsBetween(directLine, fromStation, toStation);
  if (stations.length === 0) return null;

  const segments: RouteSegment[] = [];

  // Initial walk to the first station
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

  // Final walk from the last station
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

  return {
    segments,
    totalStops: stations.length - 1,
    totalDistance: calculateSegmentDistance(stations),
    totalDuration,
  };
}

/**
 * Find all possible transfer routes using breadth-first search
 */
async function findAllTransferRoutes(
  fromStation: Station,
  toStation: Station,
  fromLines: MetroLine[],
  maxTransfers: number,
  fromLocation: google.maps.LatLngLiteral,
  toLocation: google.maps.LatLngLiteral
): Promise<Route[]> {
  const routes: Route[] = [];

  // Using BFS to find all possible routes with transfers up to maxTransfers
  const queue: {
    station: Station;
    lines: MetroLine[];
    visitedLines: Set<string>;
    segments: RouteSegment[];
    transfers: number;
  }[] = [];

  // Initialize the queue with starting station
  for (const line of fromLines) {
    queue.push({
      station: fromStation,
      lines: [line],
      visitedLines: new Set([line.id]),
      segments: [],
      transfers: 0,
    });
  }

  while (queue.length > 0) {
    const { station, lines, visitedLines, segments, transfers } =
      queue.shift()!;

    for (const currentLine of lines) {
      // Skip if we've already processed this line
      if (
        segments.length > 0 &&
        segments[segments.length - 1].type === 'transit' &&
        'line' in segments[segments.length - 1] &&
        segments[segments.length - 1].line?.id === currentLine.id
      ) {
        continue;
      }

      // Check if we can reach the destination directly from here
      if (currentLine.stations.some((s) => s.id === toStation.id)) {
        const directSegment = getStationsBetween(
          currentLine,
          station,
          toStation
        );
        if (directSegment.length > 0) {
          const newSegments = [...segments];

          // Add initial walking segment if this is the first segment
          if (segments.length === 0) {
            const walkSegment = await createWalkingSegment(
              station,
              directSegment[0],
              fromLocation,
              directSegment[0].coordinates
            );
            if (walkSegment) newSegments.push(walkSegment);
          }

          // Add the transit segment
          newSegments.push({
            type: 'transit',
            line: currentLine,
            stations: directSegment,
            duration: 0, // Will be calculated later
          });

          // Add final walking segment
          const finalWalk = await createWalkingSegment(
            directSegment[directSegment.length - 1],
            toStation,
            directSegment[directSegment.length - 1].coordinates,
            toLocation
          );
          if (finalWalk) newSegments.push(finalWalk);

          // Calculate route statistics
          const totalStops = newSegments.reduce(
            (total, seg) =>
              total + (seg.type === 'transit' ? seg.stations.length - 1 : 0),
            0
          );

          const totalDistance = newSegments.reduce(
            (total, seg) =>
              total +
              (seg.type === 'transit'
                ? calculateSegmentDistance(seg.stations)
                : 0),
            0
          );

          routes.push({
            segments: newSegments,
            totalStops,
            totalDistance,
            totalDuration: 0, // Will be calculated later
          });

          continue; // Found a route to destination, continue to next line
        }
      }

      // If we haven't hit max transfers, try interchange stations
      if (transfers < maxTransfers) {
        // Find all interchange stations from current line
        const interchangeMap = new Map<
          string,
          { station: Station; lines: MetroLine[] }
        >();

        for (const otherLine of metroLines) {
          if (visitedLines.has(otherLine.id)) continue;

          const interchanges = findInterchanges(currentLine, otherLine);
          for (const interchange of interchanges) {
            if (!interchangeMap.has(interchange.id)) {
              interchangeMap.set(interchange.id, {
                station: interchange,
                lines: [otherLine],
              });
            } else {
              interchangeMap.get(interchange.id)!.lines.push(otherLine);
            }
          }
        }

        // Process each interchange
        for (const {
          station: interchange,
          lines: nextLines,
        } of interchangeMap.values()) {
          const segmentToInterchange = getStationsBetween(
            currentLine,
            station,
            interchange
          );
          if (segmentToInterchange.length === 0) continue;

          const newSegments = [...segments];

          // Add walking segment if this is the first segment
          if (segments.length === 0) {
            const walkSegment = await createWalkingSegment(
              station,
              segmentToInterchange[0],
              fromLocation,
              segmentToInterchange[0].coordinates
            );
            if (walkSegment) newSegments.push(walkSegment);
          }

          // Add transit segment to the interchange
          newSegments.push({
            type: 'transit',
            line: currentLine,
            stations: segmentToInterchange,
            duration: 0, // Will be calculated later
          });

          // Create a new visited lines set
          const newVisitedLines = new Set(visitedLines);
          for (const line of nextLines) {
            newVisitedLines.add(line.id);
          }

          // Add to queue for further exploration
          queue.push({
            station: interchange,
            lines: nextLines,
            visitedLines: newVisitedLines,
            segments: newSegments,
            transfers: transfers + 1,
          });
        }
      }
    }
  }

  return routes;
}
