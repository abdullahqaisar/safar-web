import { MetroLine } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import {
  calculateSegmentDistance,
  findInterchanges,
  getStationsBetween,
} from '@/lib/utils/station';
import { calculateTransitTime } from '@/lib/utils/maps';
import { createWalkingSegment } from './walk-routes';
import { Coordinates, Station } from '@/types/station';
import { Route, RouteSegment } from '@/types/route';

/**
 * Find a direct route between two stations
 */
export async function findDirectRoute(
  fromLocation: Coordinates,
  toLocation: Coordinates,
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
  if (!stations || stations.length < 2) return null;

  const segments: RouteSegment[] = [];
  let totalDuration = 0;

  // Initial walk to the first metro station if needed
  if (
    fromLocation.lat !== fromStation.coordinates.lat ||
    fromLocation.lng !== fromStation.coordinates.lng
  ) {
    const initialWalk = await createWalkingSegment(
      fromStation,
      stations[0],
      fromLocation,
      stations[0].coordinates
    );
    if (initialWalk) {
      segments.push(initialWalk);
      totalDuration += initialWalk.duration;
    }
  }

  // Transit segment
  const transitTime = await calculateTransitTime(
    stations[0],
    stations[stations.length - 1]
  );
  if (transitTime <= 0) return null;

  segments.push({
    type: 'transit',
    line: directLine,
    stations,
    duration: transitTime,
  });
  totalDuration += transitTime;

  // Final walk from last metro station if needed
  if (
    toLocation.lat !== toStation.coordinates.lat ||
    toLocation.lng !== toStation.coordinates.lng
  ) {
    const finalWalk = await createWalkingSegment(
      stations[stations.length - 1],
      toStation,
      stations[stations.length - 1].coordinates,
      toLocation
    );
    if (finalWalk) {
      segments.push(finalWalk);
      totalDuration += finalWalk.duration;
    }
  }

  if (segments.length === 0) return null;

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
export async function findAllTransferRoutes(
  fromStation: Station,
  toStation: Station,
  fromLines: MetroLine[],
  maxTransfers: number,
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[]> {
  const routes: Route[] = [];
  const processedPaths = new Set<string>();

  const queue = fromLines
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((line) => ({
      station: fromStation,
      line,
      visited: new Set([fromStation.id]),
      visitedLines: new Set([line.id]),
      segments: [] as RouteSegment[],
      transfers: 0,
      duration: 0,
    }));

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Skip if we've visited this station in a better way
    const pathKey = `${current.station.id}-${Array.from(
      current.visitedLines
    ).join(',')}`;
    if (processedPaths.has(pathKey)) continue;
    processedPaths.add(pathKey);

    // Try to reach destination from current position
    const directSegment = getStationsBetween(
      current.line,
      current.station,
      toStation
    );
    if (directSegment.length >= 2) {
      const transitTime = await calculateTransitTime(
        directSegment[0],
        directSegment[directSegment.length - 1]
      );

      if (transitTime > 0) {
        const newSegments = [...current.segments];

        // Add initial walk if this is the first segment
        if (newSegments.length === 0) {
          const initialWalk = await createWalkingSegment(
            fromStation,
            directSegment[0],
            fromLocation,
            directSegment[0].coordinates
          );
          if (initialWalk) newSegments.push(initialWalk);
        }

        // Add transit segment
        newSegments.push({
          type: 'transit',
          line: current.line,
          stations: directSegment,
          duration: transitTime,
        });

        // Add final walk if needed
        const finalWalk = await createWalkingSegment(
          directSegment[directSegment.length - 1],
          toStation,
          directSegment[directSegment.length - 1].coordinates,
          toLocation
        );
        if (finalWalk) newSegments.push(finalWalk);

        routes.push({
          segments: newSegments,
          totalStops: directSegment.length - 1,
          totalDistance: calculateSegmentDistance(directSegment),
          totalDuration:
            current.duration + transitTime + (finalWalk?.duration || 0),
        });
      }
    }

    // Continue searching for transfers if under limit
    if (current.transfers < maxTransfers) {
      const interchanges = metroLines
        .filter((line) => !current.visitedLines.has(line.id))
        .flatMap((line) =>
          findInterchanges(current.line, line)
            .filter((station) => !current.visited.has(station.id))
            .map((station) => ({ station, line }))
        )
        .sort((a, b) => a.station.id.localeCompare(b.station.id));

      for (const { station: interchange, line: nextLine } of interchanges) {
        const segmentToInterchange = getStationsBetween(
          current.line,
          current.station,
          interchange
        );

        if (segmentToInterchange.length >= 2) {
          const transitTime = await calculateTransitTime(
            segmentToInterchange[0],
            segmentToInterchange[segmentToInterchange.length - 1]
          );

          if (transitTime > 0) {
            const newVisited = new Set(current.visited);
            newVisited.add(interchange.id);

            const newVisitedLines = new Set(current.visitedLines);
            newVisitedLines.add(nextLine.id);

            const newSegments = [...current.segments];

            if (newSegments.length === 0) {
              const initialWalk = await createWalkingSegment(
                fromStation,
                segmentToInterchange[0],
                fromLocation,
                segmentToInterchange[0].coordinates
              );
              if (initialWalk) newSegments.push(initialWalk);
            }

            newSegments.push({
              type: 'transit',
              line: current.line,
              stations: segmentToInterchange,
              duration: transitTime,
            });

            queue.push({
              station: interchange,
              line: nextLine,
              visited: newVisited,
              visitedLines: newVisitedLines,
              segments: newSegments,
              transfers: current.transfers + 1,
              duration: current.duration + transitTime,
            });
          }
        }
      }
    }
  }

  return routes;
}
