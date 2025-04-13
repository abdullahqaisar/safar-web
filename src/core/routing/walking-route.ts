import { TransitGraph } from '../graph/graph';
import { Route, RouteStation } from '../types/route';

import { WALKING_MAX_DISTANCE } from '../utils/constants';
import { findTransferRoutes } from './transfer-route';
import { findDirectRoutes } from './direct-route';
import { calculateWalkingTime } from '../utils/time-utils';
import { findNearbyStations, haveCommonLines } from '../utils/station-utils';
import { isRouteDuplicate } from '../utils/route-comparison';
import { createRoute, createWalkingSegment } from '../utils/route-builder';
import { calculateDistance } from '../utils/geo-utils';

/**
 * Find a direct walking route between two stations if they're within walking distance
 */
export function findDirectWalkingRoute(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route | null {
  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return null;
  }

  // Calculate distance between stations
  const distance = calculateDistance(
    origin.coordinates,
    destination.coordinates
  );

  // Check if within walking distance
  if (distance <= WALKING_MAX_DISTANCE) {
    const walkingTime = calculateWalkingTime(distance);

    // Convert stations to route stations
    const fromStation: RouteStation = {
      id: origin.id,
      name: origin.name,
      coordinates: origin.coordinates,
    };

    const toStation: RouteStation = {
      id: destination.id,
      name: destination.name,
      coordinates: destination.coordinates,
    };

    // Create walking segment
    const walkingSegment = createWalkingSegment(
      fromStation,
      toStation,
      distance,
      walkingTime
    );

    // Create route with just the walking segment
    return createRoute([walkingSegment]);
  }

  return null;
}

/**
 * Find routes that start with walking to a nearby station and then taking transit
 * @param transitRouteFinder Function to find transit routes
 */
export function createInitialWalkingRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  existingRoutes: Route[] = []
): Route[] {
  const routes: Route[] = [];
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return routes;
  }

  // Find stations within walking distance from origin
  const nearbyStations = findNearbyStations(graph.stations, origin);

  // For each nearby station, find transit routes to destination
  for (const nearbyStation of nearbyStations) {
    // Skip if the nearby station is the destination
    if (nearbyStation.id === destinationId) continue;

    // Skip if the nearby station is on the same lines as origin (walking isn't beneficial)
    if (haveCommonLines(origin, nearbyStation, graph)) continue;

    // Find transit routes from nearby station to destination
    const transitRoutes = [
      ...findDirectRoutes(graph, nearbyStation.id, destinationId),
      ...findTransferRoutes(graph, nearbyStation.id, destinationId),
    ];

    // For each transit route, prepend a walking segment
    for (const transitRoute of transitRoutes) {
      // Skip routes that don't start from the nearby station we walked to
      // This ensures continuity between walking and transit segments
      if (
        transitRoute.segments.length > 0 &&
        transitRoute.segments[0].stations[0].id !== nearbyStation.id
      ) {
        continue; // Skip invalid routes where transit doesn't start from the walked-to station
      }

      // Calculate walking segment
      const distance = calculateDistance(
        origin.coordinates,
        nearbyStation.coordinates
      );
      const walkingTime = calculateWalkingTime(distance);

      // Create walking segment
      const walkingSegment = createWalkingSegment(
        convertToRouteStation(origin),
        convertToRouteStation(nearbyStation),
        distance,
        walkingTime
      );

      // Create new route with walking segment + transit segments
      const newRoute = createRoute([walkingSegment, ...transitRoute.segments]);

      // Only add if this route is unique and better than existing routes
      if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
        routes.push(newRoute);
      }
    }
  }

  return routes;
}

/**
 * Find routes that end with walking from a station to the destination
 */
export function createFinalWalkingRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  existingRoutes: Route[] = []
): Route[] {
  const routes: Route[] = [];
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return routes;
  }

  // Find stations within walking distance from destination
  const nearbyStations = findNearbyStations(graph.stations, destination);

  // For each nearby station, find transit routes from origin
  for (const nearbyStation of nearbyStations) {
    // Skip if the nearby station is the origin
    if (nearbyStation.id === originId) continue;

    // Skip if the nearby station is on the same lines as destination
    if (haveCommonLines(destination, nearbyStation, graph)) continue;

    // Find transit routes from origin to nearby station
    const transitRoutes = [
      ...findDirectRoutes(graph, originId, nearbyStation.id),
      ...findTransferRoutes(graph, originId, nearbyStation.id),
    ];

    // For each transit route, append a walking segment
    for (const transitRoute of transitRoutes) {
      // Skip routes that don't end at the nearby station where we'll start walking from
      // This ensures continuity between transit and walking segments
      if (
        transitRoute.segments.length > 0 &&
        transitRoute.segments[transitRoute.segments.length - 1].stations[
          transitRoute.segments[transitRoute.segments.length - 1].stations
            .length - 1
        ].id !== nearbyStation.id
      ) {
        continue; // Skip invalid routes where transit doesn't end at the station we'll walk from
      }

      // Calculate walking segment
      const distance = calculateDistance(
        nearbyStation.coordinates,
        destination.coordinates
      );
      const walkingTime = calculateWalkingTime(distance);

      // Create walking segment
      const walkingSegment = createWalkingSegment(
        convertToRouteStation(nearbyStation),
        convertToRouteStation(destination),
        distance,
        walkingTime
      );

      // Create new route with transit segments + walking segment
      const newRoute = createRoute([...transitRoute.segments, walkingSegment]);

      // Only add if this route is unique and better than existing routes
      if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
        routes.push(newRoute);
      }
    }
  }

  return routes;
}

/**
 * Find routes that use walking as a transfer mechanism between lines
 */
export function createWalkingTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  existingRoutes: Route[] = []
): Route[] {
  const routes: Route[] = [];

  // Identify walking shortcuts that could be used as transfers
  for (const shortcut of graph.walkingShortcuts) {
    const fromStation = graph.stations[shortcut.from];
    const toStation = graph.stations[shortcut.to];

    // Skip if either station doesn't exist
    if (!fromStation || !toStation) continue;

    // Skip if stations are on the same line (use regular transfers instead)
    if (haveCommonLines(fromStation, toStation, graph)) continue;

    // Find direct routes from origin to shortcut start
    const routesToShortcutStart = findDirectRoutes(
      graph,
      originId,
      shortcut.from
    );

    // Find direct routes from shortcut end to destination
    const routesFromShortcutEnd = findDirectRoutes(
      graph,
      shortcut.to,
      destinationId
    );

    // Combine routes with walking transfer
    for (const routeToStart of routesToShortcutStart) {
      // Ensure route ends at the walking shortcut start station
      if (
        routeToStart.segments.length > 0 &&
        routeToStart.segments[routeToStart.segments.length - 1].stations[
          routeToStart.segments[routeToStart.segments.length - 1].stations
            .length - 1
        ].id !== shortcut.from
      ) {
        continue; // Skip if first route doesn't end at walking shortcut start
      }

      for (const routeFromEnd of routesFromShortcutEnd) {
        // Ensure route starts from the walking shortcut end station
        if (
          routeFromEnd.segments.length > 0 &&
          routeFromEnd.segments[0].stations[0].id !== shortcut.to
        ) {
          continue; // Skip if second route doesn't start at walking shortcut end
        }

        // Create walking segment
        const walkingSegment = createWalkingSegment(
          convertToRouteStation(fromStation),
          convertToRouteStation(toStation),
          shortcut.distance,
          shortcut.duration
        );

        // Create new route with segments from first route + walking + segments from second route
        const newRoute = createRoute([
          ...routeToStart.segments,
          walkingSegment,
          ...routeFromEnd.segments,
        ]);

        // Only add if this route is unique and better than existing routes
        if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
          routes.push(newRoute);
        }
      }
    }
  }

  return routes;
}

/**
 * Convert station to RouteStation
 */
function convertToRouteStation(station: {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
}): RouteStation {
  return {
    id: station.id,
    name: station.name,
    coordinates: station.coordinates,
  };
}
