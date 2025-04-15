import { TransitGraph } from '../graph/graph';
import { TransitLine } from '../types/graph';
import {
  Route,
  RouteSegment,
  TransitRouteSegment,
  WalkingRouteSegment,
  RouteStation,
} from '../types/route';
import { DEFAULT_STOP_WAIT_TIME } from './constants';
import { calculateDistance } from './geo-utils';
import { convertToRouteStation } from './station-utils';
import { calculateTransitTime } from './time-utils';

/**
 * Generate a unique ID for a route
 */
function generateUniqueId(): string {
  return `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a transit segment from a sequence of station IDs on a line
 */
export function createTransitSegment(
  graph: TransitGraph,
  line: TransitLine,
  stationIds: string[]
): TransitRouteSegment | null {
  // Validate: require at least two distinct stations
  if (stationIds.length < 2) {
    throw new Error(
      `Transit segment must have at least 2 stations, got ${stationIds.length}`
    );
  }

  // Validate: check that first and last stations are different
  if (stationIds[0] === stationIds[stationIds.length - 1]) {
    throw new Error(`Transit segment start and end stations must be different`);
  }

  // Remove any duplicate consecutive stations
  const cleanedStationIds = stationIds.filter(
    (stationId, index) => index === 0 || stationId !== stationIds[index - 1]
  );

  // Convert station IDs to route stations
  const stations: RouteStation[] = cleanedStationIds.map((stationId) =>
    convertToRouteStation(graph.stations[stationId])
  );

  // Calculate segment duration and distance
  let duration = 0;

  for (let i = 0; i < cleanedStationIds.length - 1; i++) {
    const fromId = cleanedStationIds[i];
    const toId = cleanedStationIds[i + 1];
    const fromStation = graph.stations[fromId];
    const toStation = graph.stations[toId];

    const distance = calculateDistance(
      fromStation.coordinates,
      toStation.coordinates
    );

    // Get edge attributes (duration) from the graph if they exist
    let segmentDuration = calculateTransitTime(distance);
    try {
      const edgeAttributes = graph.graph.getEdgeAttributes(fromId, toId);
      if (edgeAttributes && edgeAttributes.duration) {
        segmentDuration = edgeAttributes.duration;
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _err = e;
    }

    duration += segmentDuration;
  }

  // Add wait time for intermediate stops
  const stopWaitTime = DEFAULT_STOP_WAIT_TIME;
  const waitTime = (cleanedStationIds.length - 2) * stopWaitTime; // No wait at origin and destination
  duration += waitTime;

  return {
    type: 'transit',
    line: {
      id: line.id,
      name: line.name,
      color: line.color,
    },
    stations,
    duration,
    stopWaitTime,
    ticketCost: line.ticketCost || 30,
  };
}

/**
 * Create a walking segment between two stations
 */
export function createWalkingSegment(
  fromStation: RouteStation,
  toStation: RouteStation,
  distance: number,
  duration: number
): WalkingRouteSegment {
  return {
    type: 'walk',
    stations: [fromStation, toStation],
    walkingDistance: distance,
    walkingTime: duration,
    duration: duration,
  };
}

/**
 * Create a new route from segments
 */
export function createRoute(
  segments: RouteSegment[],
  sourceRoute?: Route
): Route {
  // Validate segment continuity before creating route
  for (let i = 0; i < segments.length - 1; i++) {
    const currentSegment = segments[i];
    const nextSegment = segments[i + 1];

    const lastStationId =
      currentSegment.stations[currentSegment.stations.length - 1].id;
    const firstStationId = nextSegment.stations[0].id;

    if (lastStationId !== firstStationId) {
      throw new Error(
        `Route segments must connect: the last station of segment ${i} (${lastStationId}) must match the first station of segment ${i + 1} (${firstStationId})`
      );
    }
  }

  // Generate unique route ID
  const routeId = generateUniqueId();

  // Calculate route statistics
  let totalDuration = 0;
  let totalDistance = 0;
  let totalStops = 0;
  let totalFare = 0;

  // Count transfers properly - only when changing transit lines, not when walking
  let transfers = 0;
  let previousTransitLine: string | null = null;

  segments.forEach((segment, index) => {
    totalDuration += segment.duration;

    if (segment.type === 'transit') {
      const transitSegment = segment as TransitRouteSegment;

      // Check if this is a transfer from a previous transit line
      if (
        previousTransitLine !== null &&
        previousTransitLine !== transitSegment.line.id
      ) {
        transfers++;
      }

      // Update previous transit line
      previousTransitLine = transitSegment.line.id;

      // Add fare for this transit segment
      if (transitSegment.ticketCost) {
        totalFare += transitSegment.ticketCost;
      }

      for (let i = 0; i < transitSegment.stations.length - 1; i++) {
        const from = transitSegment.stations[i];
        const to = transitSegment.stations[i + 1];
        totalDistance += calculateDistance(from.coordinates, to.coordinates);
      }
      // Count stations minus 1 for stops
      totalStops += segment.stations.length - 1;
    } else if (segment.type === 'walk') {
      const walkSegment = segment as WalkingRouteSegment;
      totalDistance += walkSegment.walkingDistance;

      // If this is a walking transfer (not at start/end) and followed by transit,
      // add wait time for the next transit service
      if (
        index > 0 &&
        index < segments.length - 1 &&
        segments[index + 1].type === 'transit'
      ) {
        // Add average wait time for next service (half the typical headway)
        totalDuration += DEFAULT_STOP_WAIT_TIME;
      }
    }
  });

  // Create the route object
  const route: Route = {
    id: routeId,
    segments,
    totalDuration,
    totalDistance,
    transfers,
    totalStops,
    totalFare: totalFare > 0 ? totalFare : undefined,
  };

  // If a source route was provided with a requestedOrigin, preserve it
  if (sourceRoute && sourceRoute.requestedOrigin) {
    route.requestedOrigin = sourceRoute.requestedOrigin;
  }

  return route;
}
