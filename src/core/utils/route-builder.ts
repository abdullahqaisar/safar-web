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
 * Create a transit segment from a sequence of station IDs on a line
 */
export function createTransitSegment(
  graph: TransitGraph,
  line: TransitLine,
  stationIds: string[]
): TransitRouteSegment {
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
      console.error(
        `Error getting edge attributes for ${fromId} -> ${toId}, ${e}`
      );
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
    duration,
    walkingTime: duration,
    walkingDistance: distance,
  };
}

/**
 * Create a complete route from segments
 */
export function createRoute(segments: RouteSegment[]): Route {
  // Validate segments: skip empty segments
  const validSegments = segments.filter(
    (segment) => segment.stations.length >= 2
  );

  // If no valid segments, throw an error
  if (validSegments.length === 0) {
    throw new Error('Cannot create route with no valid segments');
  }

  let totalStops = 0;
  let totalDistance = 0;
  let totalDuration = 0;

  // Calculate route stats
  validSegments.forEach((segment) => {
    if (segment.type === 'transit') {
      totalStops += segment.stations.length - 1;
    }
    totalDuration += segment.duration;

    // Calculate distance
    for (let i = 0; i < segment.stations.length - 1; i++) {
      const from = segment.stations[i];
      const to = segment.stations[i + 1];
      const distance = calculateDistance(from.coordinates, to.coordinates);
      totalDistance += distance;
    }
  });

  // Generate a unique ID
  const id = `transit-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 11)}`;

  // Adjust transfers count to count only transitions between different transport modes or lines
  let transferCount = 0;
  for (let i = 1; i < validSegments.length; i++) {
    const prevSegment = validSegments[i - 1];
    const currSegment = validSegments[i];

    // If segment types are different, or both are transit but different lines
    if (
      prevSegment.type !== currSegment.type ||
      (prevSegment.type === 'transit' &&
        currSegment.type === 'transit' &&
        prevSegment.line.id !== currSegment.line.id)
    ) {
      transferCount++;
    }
  }

  return {
    segments: validSegments,
    totalStops,
    totalDistance,
    totalDuration,
    transfers: transferCount,
    id,
  };
}
