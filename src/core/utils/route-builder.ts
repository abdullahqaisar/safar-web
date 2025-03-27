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
  // Convert station IDs to route stations
  const stations: RouteStation[] = stationIds.map((stationId) =>
    convertToRouteStation(graph.stations[stationId])
  );

  // Calculate segment duration and distance
  let totalDistance = 0;
  let duration = 0;

  for (let i = 0; i < stationIds.length - 1; i++) {
    const fromId = stationIds[i];
    const toId = stationIds[i + 1];
    const fromStation = graph.stations[fromId];
    const toStation = graph.stations[toId];

    const distance = calculateDistance(
      fromStation.coordinates,
      toStation.coordinates
    );
    totalDistance += distance;

    // Get edge attributes (duration) from the graph if they exist
    let segmentDuration = calculateTransitTime(distance);
    try {
      const edgeAttributes = graph.graph.getEdgeAttributes(fromId, toId);
      if (edgeAttributes && edgeAttributes.duration) {
        segmentDuration = edgeAttributes.duration;
      }
    } catch (e) {
      // Edge may not exist directly, use calculated duration
    }

    duration += segmentDuration;
  }

  // Add wait time for intermediate stops
  const stopWaitTime = DEFAULT_STOP_WAIT_TIME;
  const waitTime = (stationIds.length - 2) * stopWaitTime; // No wait at origin and destination
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
  let totalStops = 0;
  let totalDistance = 0;
  let totalDuration = 0;

  // Calculate route stats
  segments.forEach((segment) => {
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

  return {
    segments,
    totalStops,
    totalDistance,
    totalDuration,
    transfers: segments.length - 1,
    id,
  };
}
