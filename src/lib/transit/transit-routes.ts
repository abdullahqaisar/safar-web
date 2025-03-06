import { MetroLine } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import {
  calculateSegmentDistance,
  findInterchanges,
  getStationsBetween,
} from '@/lib/utils/station';
import { Coordinates, Station } from '@/types/station';
import { Route, RouteSegment } from '@/types/route';
import { createWalkingSegment, createTransitSegment } from './segment-utils';
import { coordinatesEqual } from '../utils/geo';

/**
 * Find a direct route between two stations
 */
export async function findDirectRoute(
  fromLocation: Coordinates,
  toLocation: Coordinates,
  fromStation: Station,
  toStation: Station
): Promise<Route | null> {
  // Find lines that contain both stations
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );
  const toLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === toStation.id)
  );
  const directLine = fromLines.find((line) => toLines.includes(line));

  if (!directLine) return null;

  const stations = getStationsBetween(directLine, fromStation, toStation);
  if (!stations || stations.length < 2) return null;

  const segments: RouteSegment[] = [];
  let totalDuration = 0;

  // Add initial walking segment if needed
  const needsInitialWalk = !coordinatesEqual(
    fromLocation,
    fromStation.coordinates
  );
  if (needsInitialWalk) {
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

  // Add transit segment
  const transitSegment = await createTransitSegment(directLine, stations);
  if (!transitSegment) return null;

  segments.push(transitSegment);
  totalDuration += transitSegment.duration;

  // Add final walking segment if needed
  const needsFinalWalk = !coordinatesEqual(toLocation, toStation.coordinates);
  if (needsFinalWalk) {
    const lastStation = stations[stations.length - 1];
    const finalWalk = await createWalkingSegment(
      lastStation,
      toStation,
      lastStation.coordinates,
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

  type QueueItem = {
    station: Station;
    line: MetroLine;
    visited: Set<string>;
    visitedLines: Set<string>;
    segments: RouteSegment[];
    transfers: number;
    duration: number;
  };

  const queue: QueueItem[] = fromLines
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

    // Skip if we've visited this station on these lines in a better way
    const pathKey = `${current.station.id}-${Array.from(
      current.visitedLines
    ).join(',')}`;
    if (processedPaths.has(pathKey)) continue;
    processedPaths.add(pathKey);

    // Try to reach destination from current position
    await tryDirectToDestination(current, toStation, toLocation, routes);

    // Continue searching for transfers if under limit
    if (current.transfers < maxTransfers) {
      await addPotentialTransfers(current, queue);
    }
  }

  return routes;

  /**
   * Try to add a direct route to destination from current position
   */
  async function tryDirectToDestination(
    current: QueueItem,
    toStation: Station,
    toLocation: Coordinates,
    routes: Route[]
  ): Promise<void> {
    const directSegment = getStationsBetween(
      current.line,
      current.station,
      toStation
    );
    if (directSegment.length < 2) return;

    const newSegments = [...current.segments];
    let routeDuration = current.duration;

    // Add initial walk if this is the first segment
    if (newSegments.length === 0) {
      const initialWalk = await createWalkingSegment(
        fromStation,
        directSegment[0],
        fromLocation,
        directSegment[0].coordinates
      );
      if (initialWalk) {
        newSegments.push(initialWalk);
        routeDuration += initialWalk.duration;
      }
    }

    // Add transit segment
    const transitSegment = await createTransitSegment(
      current.line,
      directSegment
    );
    if (!transitSegment) return;

    newSegments.push(transitSegment);
    routeDuration += transitSegment.duration;

    // Add final walk if needed
    const lastStation = directSegment[directSegment.length - 1];
    const finalWalk = await createWalkingSegment(
      lastStation,
      toStation,
      lastStation.coordinates,
      toLocation
    );

    if (finalWalk) {
      newSegments.push(finalWalk);
      routeDuration += finalWalk.duration;
    }

    routes.push({
      segments: newSegments,
      totalStops: directSegment.length - 1,
      totalDistance: calculateSegmentDistance(directSegment),
      totalDuration: routeDuration,
    });
  }

  /**
   * Find and add potential transfers from the current position
   */
  async function addPotentialTransfers(
    current: QueueItem,
    queue: QueueItem[]
  ): Promise<void> {
    // Find all possible interchanges from current line to other lines
    const interchanges = metroLines
      .filter((line) => !current.visitedLines.has(line.id))
      .flatMap((line) =>
        findInterchanges(current.line, line)
          .filter((station) => !current.visited.has(station.id))
          .map((station) => ({ station, line }))
      )
      .sort((a, b) => a.station.id.localeCompare(b.station.id));

    for (const { station: interchange, line: nextLine } of interchanges) {
      const segmentStations = getStationsBetween(
        current.line,
        current.station,
        interchange
      );
      if (segmentStations.length < 2) continue;

      const transitSegment = await createTransitSegment(
        current.line,
        segmentStations
      );
      if (!transitSegment) continue;

      const newSegments = [...current.segments];
      let newDuration = current.duration + transitSegment.duration;

      // Add initial walk if this is the first segment
      if (newSegments.length === 0) {
        const initialWalk = await createWalkingSegment(
          fromStation,
          segmentStations[0],
          fromLocation,
          segmentStations[0].coordinates
        );
        if (initialWalk) {
          newSegments.push(initialWalk);
          newDuration += initialWalk.duration;
        }
      }

      newSegments.push(transitSegment);

      // Create new queue item for next iteration
      queue.push({
        station: interchange,
        line: nextLine,
        visited: new Set([...current.visited, interchange.id]),
        visitedLines: new Set([...current.visitedLines, nextLine.id]),
        segments: newSegments,
        transfers: current.transfers + 1,
        duration: newDuration,
      });
    }
  }
}
