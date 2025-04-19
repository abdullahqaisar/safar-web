import { TransitGraph } from '../graph/graph';
import { Route, RouteStation } from '../types/route';

import { WALKING_MAX_DISTANCE } from '../utils/constants';

import { findDirectRoutes } from './direct-route';
import { calculateWalkingTime } from '../utils/time-utils';
import { findNearbyStations, haveCommonLines } from '../utils/station-utils';
import { isRouteDuplicate } from '../utils/route-comparison';
import { createRoute, createWalkingSegment } from '../utils/route-builder';
import { calculateDistance } from '../utils/geo-utils';
import { findTransferRoutes } from './transfer-routes/finders';

/**
 * Find a direct walking route between two stations if they're within walking distance
 */
export function findDirectWalkingRoute(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route | null {
  console.log(
    `[Walking Route] Checking for direct walking route from ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    console.log(
      `[Walking Route] Invalid origin or destination station for direct walking`
    );
    return null;
  }

  // Calculate distance between stations
  const distance = calculateDistance(
    origin.coordinates,
    destination.coordinates
  );
  console.log(
    `[Walking Route] Direct walking distance between ${origin.name} and ${destination.name}: ${Math.round(distance)}m (max allowed: ${WALKING_MAX_DISTANCE}m)`
  );

  // Check if within walking distance
  if (distance <= WALKING_MAX_DISTANCE) {
    const walkingTime = calculateWalkingTime(distance);
    console.log(
      `[Walking Route] Distance is within walking range. Walking time: ${Math.round(walkingTime)}s`
    );

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
    const route = createRoute([walkingSegment]);
    console.log(
      `[Walking Route] Created direct walking route: ID=${route.id}, distance=${Math.round(distance)}m, duration=${Math.round(walkingTime)}s`
    );
    return route;
  }

  console.log(
    `[Walking Route] Distance exceeds walking threshold, no direct walking route created`
  );
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
  console.log(
    `[Walking Route] Finding initial walking routes from ${originId} (${origin?.name || 'unknown'}) to ${destinationId} (${destination?.name || 'unknown'})`
  );

  if (!origin || !destination) {
    console.log(
      `[Walking Route] Invalid origin or destination station for initial walking routes`
    );
    return routes;
  }

  // Find stations within walking distance from origin
  const nearbyStations = findNearbyStations(graph.stations, origin);
  console.log(
    `[Walking Route] Found ${nearbyStations.length} stations within walking distance from ${origin.name}`
  );

  // Log detailed info about each nearby station
  nearbyStations.forEach((station) => {
    const distance = calculateDistance(origin.coordinates, station.coordinates);
    console.log(
      `[Walking Route] Nearby station: ${station.id} (${station.name}), distance: ${Math.round(distance)}m, lines: ${graph.getStationLines(station.id).join(', ')}`
    );
  });

  // Check if any walking shortcuts are available from origin
  const walkingShortcuts = graph.walkingShortcuts.filter(
    (shortcut) => shortcut.from === originId
  );
  console.log(
    `[Walking Route] Found ${walkingShortcuts.length} predefined walking shortcuts from ${origin.name}`
  );
  walkingShortcuts.forEach((shortcut) => {
    const toStation = graph.stations[shortcut.to];
    console.log(
      `[Walking Route] Walking shortcut: ${origin.name} → ${toStation?.name || shortcut.to}, distance: ${Math.round(shortcut.distance)}m, duration: ${Math.round(shortcut.duration)}s, priority: ${shortcut.priority}`
    );
  });

  // For each nearby station, find transit routes to destination
  for (const nearbyStation of nearbyStations) {
    // Skip if the nearby station is the destination
    if (nearbyStation.id === destinationId) {
      console.log(
        `[Walking Route] Skipping nearby station ${nearbyStation.name} because it's the destination`
      );
      continue;
    }

    // Skip if the nearby station is on the same lines as origin (walking isn't beneficial)
    if (haveCommonLines(origin, nearbyStation, graph)) {
      console.log(
        `[Walking Route] Skipping nearby station ${nearbyStation.name} because it's on the same line(s) as origin`
      );
      continue;
    }

    console.log(
      `[Walking Route] Exploring transit routes from nearby station ${nearbyStation.name} to destination`
    );

    // Find transit routes from nearby station to destination
    const directRoutes = findDirectRoutes(
      graph,
      nearbyStation.id,
      destinationId
    );
    const transferRoutes = findTransferRoutes(
      graph,
      nearbyStation.id,
      destinationId
    );
    const transitRoutes = [...directRoutes, ...transferRoutes];

    console.log(
      `[Walking Route] Found ${transitRoutes.length} transit routes from ${nearbyStation.name} to ${destination.name} (direct: ${directRoutes.length}, transfer: ${transferRoutes.length})`
    );

    // For each transit route, prepend a walking segment
    for (const transitRoute of transitRoutes) {
      // Skip routes that don't start from the nearby station we walked to
      // This ensures continuity between walking and transit segments
      if (
        transitRoute.segments.length > 0 &&
        transitRoute.segments[0].stations[0].id !== nearbyStation.id
      ) {
        console.log(
          `[Walking Route] Skipping transit route that doesn't start from ${nearbyStation.name}`
        );
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
      console.log(
        `[Walking Route] Created initial walking route: ${origin.name} → ${nearbyStation.name} (walk ${Math.round(distance)}m) → transit → ${destination.name}, total duration: ${newRoute.totalDuration}s, transfers: ${newRoute.transfers}`
      );

      // Only add if this route is unique and better than existing routes
      if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
        routes.push(newRoute);
        console.log(
          `[Walking Route] Added initial walking route with ID: ${newRoute.id}`
        );
      } else {
        console.log(
          `[Walking Route] Discarded duplicate initial walking route`
        );
      }
    }
  }

  console.log(
    `[Walking Route] Total initial walking routes created: ${routes.length}`
  );
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
  console.log(
    `[Walking Route] Finding final walking routes from ${originId} (${origin?.name || 'unknown'}) to ${destinationId} (${destination?.name || 'unknown'})`
  );

  if (!origin || !destination) {
    console.log(
      `[Walking Route] Invalid origin or destination station for final walking routes`
    );
    return routes;
  }

  // Find stations within walking distance from destination
  const nearbyStations = findNearbyStations(graph.stations, destination);
  console.log(
    `[Walking Route] Found ${nearbyStations.length} stations within walking distance from ${destination.name}`
  );

  // Log detailed info about each nearby station
  nearbyStations.forEach((station) => {
    const distance = calculateDistance(
      destination.coordinates,
      station.coordinates
    );
    console.log(
      `[Walking Route] Nearby station to destination: ${station.id} (${station.name}), distance: ${Math.round(distance)}m, lines: ${graph.getStationLines(station.id).join(', ')}`
    );
  });

  // Check if any walking shortcuts are available to destination
  const walkingShortcuts = graph.walkingShortcuts.filter(
    (shortcut) => shortcut.to === destinationId
  );
  console.log(
    `[Walking Route] Found ${walkingShortcuts.length} predefined walking shortcuts to ${destination.name}`
  );
  walkingShortcuts.forEach((shortcut) => {
    const fromStation = graph.stations[shortcut.from];
    console.log(
      `[Walking Route] Walking shortcut: ${fromStation?.name || shortcut.from} → ${destination.name}, distance: ${Math.round(shortcut.distance)}m, duration: ${Math.round(shortcut.duration)}s, priority: ${shortcut.priority}`
    );
  });

  // For each nearby station, find transit routes from origin
  for (const nearbyStation of nearbyStations) {
    // Skip if the nearby station is the origin
    if (nearbyStation.id === originId) {
      console.log(
        `[Walking Route] Skipping nearby station ${nearbyStation.name} because it's the origin`
      );
      continue;
    }

    // Skip if the nearby station is on the same lines as destination
    if (haveCommonLines(destination, nearbyStation, graph)) {
      console.log(
        `[Walking Route] Skipping nearby station ${nearbyStation.name} because it's on the same line(s) as destination`
      );
      continue;
    }

    console.log(
      `[Walking Route] Exploring transit routes from origin to nearby station ${nearbyStation.name}`
    );

    // Find transit routes from origin to nearby station
    const directRoutes = findDirectRoutes(graph, originId, nearbyStation.id);
    const transferRoutes = findTransferRoutes(
      graph,
      originId,
      nearbyStation.id
    );
    const transitRoutes = [...directRoutes, ...transferRoutes];

    console.log(
      `[Walking Route] Found ${transitRoutes.length} transit routes from ${origin.name} to ${nearbyStation.name} (direct: ${directRoutes.length}, transfer: ${transferRoutes.length})`
    );

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
        console.log(
          `[Walking Route] Skipping transit route that doesn't end at ${nearbyStation.name}`
        );
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
      console.log(
        `[Walking Route] Created final walking route: ${origin.name} → transit → ${nearbyStation.name} → ${destination.name} (walk ${Math.round(distance)}m), total duration: ${newRoute.totalDuration}s, transfers: ${newRoute.transfers}`
      );

      // Only add if this route is unique and better than existing routes
      if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
        routes.push(newRoute);
        console.log(
          `[Walking Route] Added final walking route with ID: ${newRoute.id}`
        );
      } else {
        console.log(`[Walking Route] Discarded duplicate final walking route`);
      }
    }
  }

  console.log(
    `[Walking Route] Total final walking routes created: ${routes.length}`
  );
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
  console.log(
    `[Walking Route] Finding walking transfer routes from ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );

  // Identify walking shortcuts that could be used as transfers
  const relevantShortcuts = graph.walkingShortcuts.filter((shortcut) => {
    // The shortcut is relevant if we can get from origin to shortcut.from and from shortcut.to to destination
    const fromStationLines = graph.getStationLines(shortcut.from);
    const toStationLines = graph.getStationLines(shortcut.to);
    const originLines = graph.getStationLines(originId);
    const destLines = graph.getStationLines(destinationId);

    // Check if origin can reach shortcut.from and shortcut.to can reach destination via transit
    const canReachFrom = fromStationLines.some((line) =>
      originLines.includes(line)
    );
    const canReachTo = toStationLines.some((line) => destLines.includes(line));

    return canReachFrom && canReachTo;
  });

  console.log(
    `[Walking Route] Found ${relevantShortcuts.length} potentially relevant walking shortcuts for transfers`
  );

  // Log detailed info about each relevant shortcut
  relevantShortcuts.forEach((shortcut) => {
    const fromStation = graph.stations[shortcut.from];
    const toStation = graph.stations[shortcut.to];
    console.log(
      `[Walking Route] Potential transfer shortcut: ${fromStation?.name || shortcut.from} → ${toStation?.name || shortcut.to}, distance: ${Math.round(shortcut.distance)}m, duration: ${Math.round(shortcut.duration)}s, priority: ${shortcut.priority}`
    );
  });

  for (const shortcut of graph.walkingShortcuts) {
    const fromStation = graph.stations[shortcut.from];
    const toStation = graph.stations[shortcut.to];

    // Skip if either station doesn't exist
    if (!fromStation || !toStation) {
      console.log(
        `[Walking Route] Skipping shortcut with missing station: from=${!!fromStation}, to=${!!toStation}`
      );
      continue;
    }

    console.log(
      `[Walking Route] Evaluating walking shortcut from ${fromStation.name} to ${toStation.name} as a potential transfer`
    );

    // Skip if stations are on the same line (use regular transfers instead)
    if (haveCommonLines(fromStation, toStation, graph)) {
      console.log(
        `[Walking Route] Skipping shortcut between ${fromStation.name} and ${toStation.name} - stations are on same line(s)`
      );
      continue;
    }

    // Find direct routes from origin to shortcut start
    const routesToShortcutStart = findDirectRoutes(
      graph,
      originId,
      shortcut.from
    );
    console.log(
      `[Walking Route] Found ${routesToShortcutStart.length} direct routes from ${graph.stations[originId]?.name} to ${fromStation.name}`
    );

    // Find direct routes from shortcut end to destination
    const routesFromShortcutEnd = findDirectRoutes(
      graph,
      shortcut.to,
      destinationId
    );
    console.log(
      `[Walking Route] Found ${routesFromShortcutEnd.length} direct routes from ${toStation.name} to ${graph.stations[destinationId]?.name}`
    );

    // If either segment has no routes, this shortcut can't be used
    if (
      routesToShortcutStart.length === 0 ||
      routesFromShortcutEnd.length === 0
    ) {
      console.log(
        `[Walking Route] No viable routes for this shortcut (to start: ${routesToShortcutStart.length}, from end: ${routesFromShortcutEnd.length})`
      );
      continue;
    }

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
        console.log(
          `[Walking Route] Skipping route that doesn't end at shortcut start (${fromStation.name})`
        );
        continue; // Skip if first route doesn't end at walking shortcut start
      }

      for (const routeFromEnd of routesFromShortcutEnd) {
        // Ensure route starts from the walking shortcut end station
        if (
          routeFromEnd.segments.length > 0 &&
          routeFromEnd.segments[0].stations[0].id !== shortcut.to
        ) {
          console.log(
            `[Walking Route] Skipping route that doesn't start at shortcut end (${toStation.name})`
          );
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

        console.log(
          `[Walking Route] Created walking transfer route: ${graph.stations[originId]?.name} → transit → ${fromStation.name} → ${toStation.name} (walk ${Math.round(shortcut.distance)}m) → transit → ${graph.stations[destinationId]?.name}, total duration: ${newRoute.totalDuration}s, transfers: ${newRoute.transfers}`
        );

        // Only add if this route is unique and better than existing routes
        if (!isRouteDuplicate(newRoute, [...routes, ...existingRoutes])) {
          routes.push(newRoute);
          console.log(
            `[Walking Route] Added walking transfer route with ID: ${newRoute.id}`
          );
        } else {
          console.log(
            `[Walking Route] Discarded duplicate walking transfer route`
          );
        }
      }
    }
  }

  console.log(
    `[Walking Route] Total walking transfer routes created: ${routes.length}`
  );
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
