import { findStation, getStationLines } from '@/lib/utils/station';
import { Route } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { RoutePreferences, DEFAULT_PREFERENCES } from '../types/preferences';
import { findDirectRoute, findAllTransferRoutes } from './route-finder';
import { calculateRouteTimes } from '../segments/segment-calculator';
import {
  filterRoutes,
  rankRoutes,
  ensureRouteDiversity,
} from './route-optimizer';
import { MAX_TRANSFERS } from '@/constants/config';

/**
 * Main entry point for route planning - finds the best route between two stations
 * with optional user preferences
 */
export async function findRoutes(
  fromStationId: string,
  toStationId: string,
  fromLocation?: Coordinates,
  toLocation?: Coordinates,
  preferences?: RoutePreferences
): Promise<Route[] | null> {
  const mergedPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  const fromStation = findStation(fromStationId);
  const toStation = findStation(toStationId);

  if (!fromStation) {
    console.error(`Origin station not found: ${fromStationId}`);
    return null;
  }

  if (!toStation) {
    console.error(`Destination station not found: ${toStationId}`);
    return null;
  }

  // Use station coordinates as fallback if no specific locations provided
  const startLocation = fromLocation || fromStation.coordinates;
  const endLocation = toLocation || toStation.coordinates;

  // Find all possible routes
  let routes = await findRoutesWithTime(
    startLocation,
    endLocation,
    fromStation,
    toStation
  );

  if (!routes || routes.length === 0) {
    console.info(`No routes found between ${fromStationId} and ${toStationId}`);
    return null;
  }

  routes = filterRoutes(routes, mergedPreferences);

  const rankedRoutes = rankRoutes(routes, mergedPreferences);

  return ensureRouteDiversity(rankedRoutes);
}

/**
 * Finds all possible routes including direct and transfer routes
 */
async function findRoutesWithTime(
  fromLocation: Coordinates,
  toLocation: Coordinates,
  fromStation: Station,
  toStation: Station
): Promise<Route[]> {
  const routes: Route[] = [];
  const fromLines = getStationLines(fromStation);

  // Try to find a direct route first
  const directRoute = await findDirectRoute(
    fromLocation,
    toLocation,
    fromStation,
    toStation
  );

  if (directRoute) {
    routes.push(directRoute);
  } else {
    // Only search for transfer routes if no direct route exists
    const transferRoutes = await findAllTransferRoutes(
      fromStation,
      toStation,
      fromLines,
      MAX_TRANSFERS,
      fromLocation,
      toLocation
    );
    routes.push(...transferRoutes);
  }

  // Calculate accurate timings for each route
  return calculateRouteTimes(routes);
}
