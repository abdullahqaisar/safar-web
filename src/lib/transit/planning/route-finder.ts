import { MetroLine } from '@/types/metro';
import { metroLines } from '@/lib/constants/metro-data';
import {
  calculateSegmentDistance,
  getStationsBetween,
  findAccessibleStations,
} from '@/lib/utils/station';
import { Coordinates, Station } from '@/types/station';
import { Route, RouteSegment } from '@/types/route';
import {
  createWalkingSegment,
  createTransitSegment,
} from '../segments/segment-builder';
import { coordinatesEqual, calculateDistance } from '@/lib/utils/geo';
import { WALKING_SPEED_MPS, MAX_TRANSFERS } from '@/lib/constants/config';
import { PriorityQueue } from '../planning/path-finder';

/**
 * Calculate walking time between two stations
 */
function calculateWalkingTime(from: Coordinates, to: Coordinates): number {
  const distance = calculateDistance(
    { coordinates: from },
    { coordinates: to }
  );
  return Math.round(distance / WALKING_SPEED_MPS);
}

/**
 * State representation for A* search
 */
interface RouteState {
  station: Station;
  line: MetroLine | null;
  visited: Set<string>;
  visitedLines: Set<string>;
  segments: RouteSegment[];
  transfers: number;
  cost: number; // Time cost so far
  heuristic: number; // Estimated time to destination
  pathKey: string; // Unique identifier for this state
}

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
    transfers: 0, // Direct route has 0 transfers
  };
}

/**
 * Find all possible transfer routes using A* algorithm
 */
export async function findAllTransferRoutes(
  fromStation: Station,
  toStation: Station,
  fromLines: MetroLine[],
  maxTransfers: number,
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[]> {
  console.time('A* route finding');
  const routes: Route[] = [];
  const processedPaths = new Map<string, number>(); // Map pathKey to cost for better comparison
  const stationsById = new Map<string, Station>();
  const stationLines = new Map<string, MetroLine[]>();

  // Pre-process station data for quick lookup
  for (const line of metroLines) {
    for (const station of line.stations) {
      stationsById.set(station.id, station);

      const lines = stationLines.get(station.id) || [];
      if (!lines.some((l) => l.id === line.id)) {
        lines.push(line);
        stationLines.set(station.id, lines);
      }
    }
  }

  // Initialize the priority queue with possible starting lines
  const openSet = new PriorityQueue<RouteState>();

  fromLines.forEach((line) => {
    const initialState: RouteState = {
      station: fromStation,
      line,
      visited: new Set([fromStation.id]),
      visitedLines: new Set([line.id]),
      segments: [],
      transfers: 0,
      cost: 0,
      heuristic:
        calculateDistance(
          { coordinates: fromStation.coordinates },
          { coordinates: toStation.coordinates }
        ) / 30, // Heuristic: distance / avg speed (30 m/s)
      pathKey: `${fromStation.id}-${line.id}`,
    };

    openSet.push(initialState, initialState.cost + initialState.heuristic);
  });

  // Try direct walking route if stations are close enough
  const directWalkTime = calculateWalkingTime(
    fromStation.coordinates,
    toStation.coordinates
  );
  const MAX_DIRECT_WALK = 1200; // 20 minutes max for direct walking

  if (directWalkTime <= MAX_DIRECT_WALK) {
    const walkSegment = await createWalkingSegment(
      fromStation,
      toStation,
      fromLocation,
      toLocation
    );

    if (walkSegment) {
      routes.push({
        segments: [walkSegment],
        totalStops: 0,
        totalDistance: calculateDistance(
          { coordinates: fromStation.coordinates },
          { coordinates: toStation.coordinates }
        ),
        totalDuration: walkSegment.duration,
        transfers: 0,
      });
    }
  }

  // A* main search loop
  const MAX_ITERATIONS = 10000; // Safety limit
  let iterations = 0;

  while (!openSet.isEmpty() && iterations < MAX_ITERATIONS) {
    iterations++;
    const current = openSet.pop();
    if (!current) continue;

    // Skip if we've already processed this path with a better cost
    const existingCost = processedPaths.get(current.pathKey);
    if (existingCost !== undefined && existingCost <= current.cost) continue;

    processedPaths.set(current.pathKey, current.cost);

    // Check if we've reached the destination
    if (current.station.id === toStation.id) {
      await finalizeRoute(current, toLocation, routes);
      continue;
    }

    // Try to reach destination from current position
    await tryDirectToDestination(current, toStation, toLocation, routes);

    // Continue searching for transfers if under limit
    if (current.transfers < maxTransfers) {
      await expandTransfers(current, toStation, openSet, processedPaths);
    }
  }

  console.timeEnd('A* route finding');
  console.log(`A* iterations: ${iterations}, routes found: ${routes.length}`);

  return routes;

  /**
   * Create final route when destination is reached
   */
  async function finalizeRoute(
    current: RouteState,
    toLocation: Coordinates,
    routes: Route[]
  ): Promise<void> {
    // ...implementation similar to tryDirectToDestination but for when we're already at destination...
    const newSegments = [...current.segments];
    let routeDuration = current.cost;
    let totalStops = 0;
    let totalDistance = 0;

    // Calculate totals from segments
    for (const segment of newSegments) {
      if (segment.type === 'transit') {
        totalStops += segment.stations.length - 1;
        totalDistance += calculateSegmentDistance(segment.stations);
      }
    }

    // Add final walk if needed
    if (!coordinatesEqual(current.station.coordinates, toLocation)) {
      const finalWalk = await createWalkingSegment(
        current.station,
        { id: 'destination', name: 'Destination', coordinates: toLocation },
        current.station.coordinates,
        toLocation
      );

      if (finalWalk) {
        newSegments.push(finalWalk);
        routeDuration += finalWalk.duration;
      }
    }

    // Calculate transfers - it's the number of transit segments minus 1
    const transfers = Math.max(
      0,
      newSegments.filter((s) => s.type === 'transit').length - 1
    );

    routes.push({
      segments: newSegments,
      totalStops,
      totalDistance,
      totalDuration: routeDuration,
      transfers,
    });
  }

  /**
   * Try to add a direct route to destination from current position
   */
  async function tryDirectToDestination(
    current: RouteState,
    toStation: Station,
    toLocation: Coordinates,
    routes: Route[]
  ): Promise<void> {
    if (!current.line) return; // Can't go direct without a line

    const directSegment = getStationsBetween(
      current.line,
      current.station,
      toStation
    );

    if (directSegment.length < 2) return;

    const newSegments = [...current.segments];
    let routeDuration = current.cost;

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

    // Calculate totals
    let totalStops = 0;
    let totalDistance = 0;

    // Count stops from previous segments
    for (const segment of current.segments) {
      if (segment.type === 'transit') {
        totalStops += segment.stations.length - 1;
        totalDistance += calculateSegmentDistance(segment.stations);
      }
    }

    // Add stops from the current segment
    totalStops += directSegment.length - 1;
    totalDistance += calculateSegmentDistance(directSegment);

    // Calculate transfers - it's the number of transit segments minus 1
    const transfers =
      newSegments.filter((s) => s.type === 'transit').length - 1;

    routes.push({
      segments: newSegments,
      totalStops,
      totalDistance,
      totalDuration: routeDuration,
      transfers,
    });
  }

  /**
   * Expand search by considering transfers to other lines
   */
  async function expandTransfers(
    current: RouteState,
    toStation: Station,
    openSet: PriorityQueue<RouteState>,
    processedPaths: Set<string>
  ): Promise<void> {
    if (!current.line) return;

    // Get all station lines for current station
    const availableLines = stationLines.get(current.station.id) || [];

    // Find potential transfer lines that we haven't tried yet
    const transferLines = availableLines.filter(
      (line) =>
        !current.visitedLines.has(line.id) && line.id !== current.line?.id
    );

    // Sort by geographical progress toward destination
    transferLines.sort((a, b) => {
      // Find the next station on each line that gets us closest to destination
      const aStations = a.stations.filter((s) => !current.visited.has(s.id));
      const bStations = b.stations.filter((s) => !current.visited.has(s.id));

      if (aStations.length === 0) return 1;
      if (bStations.length === 0) return -1;

      const aDistance = Math.min(
        ...aStations.map((s) =>
          calculateDistance(
            { coordinates: s.coordinates },
            { coordinates: toStation.coordinates }
          )
        )
      );

      const bDistance = Math.min(
        ...bStations.map((s) =>
          calculateDistance(
            { coordinates: s.coordinates },
            { coordinates: toStation.coordinates }
          )
        )
      );

      return aDistance - bDistance;
    });

    // Calculate transfer penalty based on station size/complexity
    const transferPenalty = 120; // 2 minutes base penalty

    for (const nextLine of transferLines) {
      // Check if we've already processed this transfer
      const pathKey = `${current.station.id}-${nextLine.id}`;
      if (processedPaths.has(pathKey)) continue;

      // Create the new state after transfer
      const newState: RouteState = {
        station: current.station,
        line: nextLine,
        visited: new Set(current.visited),
        visitedLines: new Set([...current.visitedLines, nextLine.id]),
        segments: [...current.segments],
        transfers: current.transfers + 1,
        cost: current.cost + transferPenalty,
        heuristic:
          calculateDistance(
            { coordinates: current.station.coordinates },
            { coordinates: toStation.coordinates }
          ) / 30,
        pathKey,
      };

      // Calculate priority (f-score in A*)
      const priority = newState.cost + newState.heuristic;

      // Add to priority queue
      openSet.push(newState, priority);

      // For each transfer, also try to continue on the new line
      const lineStations = nextLine.stations;
      const currentIndex = lineStations.findIndex(
        (s) => s.id === current.station.id
      );

      if (currentIndex !== -1) {
        // Try both directions on the line
        const directions = [1, -1];

        for (const direction of directions) {
          const nextIndex = currentIndex + direction;
          if (nextIndex < 0 || nextIndex >= lineStations.length) continue;

          const nextStation = lineStations[nextIndex];
          if (current.visited.has(nextStation.id)) continue;

          // Get stations for this segment
          const segmentStations =
            direction > 0
              ? lineStations.slice(currentIndex, nextIndex + 1)
              : lineStations.slice(nextIndex, currentIndex + 1).reverse();

          // Create transit segment
          const transitSegment = await createTransitSegment(
            nextLine,
            segmentStations
          );
          if (!transitSegment) continue;

          // Create a new state for continuing on this line
          const nextVisited = new Set(current.visited);
          nextVisited.add(nextStation.id);

          const nextSegments = [...current.segments, transitSegment];
          const nextCost =
            current.cost + transferPenalty + transitSegment.duration;
          const nextHeuristic =
            calculateDistance(
              { coordinates: nextStation.coordinates },
              { coordinates: toStation.coordinates }
            ) / 30;

          const nextPathKey = `${nextStation.id}-${nextLine.id}`;

          const nextState: RouteState = {
            station: nextStation,
            line: nextLine,
            visited: nextVisited,
            visitedLines: new Set([...current.visitedLines, nextLine.id]),
            segments: nextSegments,
            transfers: current.transfers + 1,
            cost: nextCost,
            heuristic: nextHeuristic,
            pathKey: nextPathKey,
          };

          // Add to queue with priority
          openSet.push(nextState, nextState.cost + nextState.heuristic);
        }
      }
    }
  }
}

/**
 * Find route between two locations - starting by finding the nearest stations
 * Uses advanced station finding and multiple origin/destination points
 */
export async function findRoute(
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[] | null> {
  console.time('Route finding');

  // Calculate direct walking distance to determine if walking is viable
  const directDistance = calculateDistance(
    { coordinates: fromLocation },
    { coordinates: toLocation }
  );

  // If it's a short trip, consider just walking
  const MAX_DIRECT_WALK_DISTANCE = 1500; // 1.5km threshold
  if (directDistance <= MAX_DIRECT_WALK_DISTANCE) {
    const walkSegment = await createWalkingSegment(
      { id: 'origin', name: 'Origin', coordinates: fromLocation },
      { id: 'destination', name: 'Destination', coordinates: toLocation },
      fromLocation,
      toLocation
    );

    if (walkSegment) {
      const walkRoute = {
        segments: [walkSegment],
        totalStops: 0,
        totalDistance: directDistance,
        totalDuration: walkSegment.duration,
        transfers: 0,
      };
      console.timeEnd('Route finding');
      return [walkRoute];
    }
  }

  // Find the most accessible stations from both origin and destination
  const originAccessPoints = findAccessibleStations(fromLocation);
  const destAccessPoints = findAccessibleStations(toLocation);

  if (originAccessPoints.length === 0 || destAccessPoints.length === 0) {
    console.log('No nearby stations found');
    console.timeEnd('Route finding');
    return null;
  }

  // Try to find routes with increasing search complexity
  const allRoutes: Route[] = [];

  // Limit the combinations to keep performance reasonable
  const MAX_COMBINATIONS = 4;
  let combinationsChecked = 0;

  // Sort access points by distance first to try closest stations first
  originAccessPoints.sort((a, b) => a.distance - b.distance);
  destAccessPoints.sort((a, b) => a.distance - b.distance);

  // Prioritize stations with more lines (interchanges)
  originAccessPoints.sort((a, b) => b.lines.length - a.lines.length);
  destAccessPoints.sort((a, b) => b.lines.length - a.lines.length);

  // Try all reasonable combinations of origin and destination stations
  for (const origin of originAccessPoints) {
    for (const destination of destAccessPoints) {
      if (combinationsChecked >= MAX_COMBINATIONS) break;

      // Skip if stations are the same (unlikely but possible)
      if (origin.station.id === destination.station.id) continue;

      // Check if the stations share any lines for direct routes
      const commonLines = origin.lines.filter((l1) =>
        destination.lines.some((l2) => l2.id === l1.id)
      );

      // Try direct route first if stations share a line
      if (commonLines.length > 0) {
        for (const line of commonLines) {
          const directRoute = await findDirectRoute(
            fromLocation,
            toLocation,
            origin.station,
            destination.station
          );

          if (directRoute) {
            allRoutes.push(directRoute);
            break; // Only need one direct route per station pair
          }
        }
      }

      // Try transfer routes if needed or if direct route not found
      if (allRoutes.length === 0 || combinationsChecked === 0) {
        const transferRoutes = await findAllTransferRoutes(
          origin.station,
          destination.station,
          origin.lines,
          MAX_TRANSFERS,
          fromLocation,
          toLocation
        );

        allRoutes.push(...transferRoutes);
      }

      combinationsChecked++;
    }
  }

  if (allRoutes.length === 0) {
    console.log('No routes found');
    console.timeEnd('Route finding');
    return null;
  }

  // Process and return the best routes
  const uniqueRoutes = removeDuplicateRoutes(allRoutes);

  // Sort routes first by transfers, then by duration
  uniqueRoutes.sort((a, b) => {
    // First try to minimize transfers
    if (a.transfers !== b.transfers) {
      return a.transfers - b.transfers;
    }
    // Then minimize duration
    return a.totalDuration - b.totalDuration;
  });

  console.timeEnd('Route finding');
  return uniqueRoutes.slice(0, 5); // Return top 5 routes
}

/**
 * Remove duplicate routes (routes with same segments)
 */
function removeDuplicateRoutes(routes: Route[]): Route[] {
  const uniqueRoutes: Route[] = [];
  const routeKeys = new Set<string>();

  for (const route of routes) {
    const key = createRouteKey(route);
    if (!routeKeys.has(key)) {
      routeKeys.add(key);
      uniqueRoutes.push(route);
    }
  }

  return uniqueRoutes;
}

/**
 * Create a unique key for a route based on its segments
 */
function createRouteKey(route: Route): string {
  return route.segments
    .map((segment) => {
      if (segment.type === 'transit') {
        return `T-${segment.line.id}-${segment.stations[0].id}-${
          segment.stations[segment.stations.length - 1].id
        }`;
      } else {
        return `W-${segment.from.id}-${segment.to.id}`;
      }
    })
    .join('|');
}
