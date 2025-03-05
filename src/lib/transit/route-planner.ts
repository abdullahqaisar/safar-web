import { findStation, getStationLines } from '@/lib/utils/station';
import { Route } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { findAllTransferRoutes, findDirectRoute } from './transit-routes';
import { calculateRouteTimes } from './segment-utils';
import { MAX_TRANSFERS } from '@/constants/config';

/**
 * Finds the best route between two stations
 */
export async function findBestRoute(
  fromStationId: string,
  toStationId: string,
  fromLocation?: Coordinates,
  toLocation?: Coordinates
): Promise<Route[] | null> {
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
  const routes = await findRoutes(
    startLocation,
    endLocation,
    fromStation,
    toStation
  );

  if (!routes || routes.length === 0) {
    console.info(`No routes found between ${fromStationId} and ${toStationId}`);
    return null;
  }

  // Return the best route based on duration, transfers, and stops
  return selectBestRoute(routes);
}

/**
 * Finds all possible routes including direct and transfer routes
 */
async function findRoutes(
  fromLocation: Coordinates,
  toLocation: Coordinates,
  fromStation: Station,
  toStation: Station
): Promise<Route[]> {
  const routes: Route[] = [];
  const fromLines = getStationLines(fromStation);

  // Try to find a direct route first (often the best option)
  const directRoute = await findDirectRoute(
    fromLocation,
    toLocation,
    fromStation,
    toStation
  );

  if (directRoute) {
    routes.push(directRoute);
  }

  // Find routes with transfers
  const transferRoutes = await findAllTransferRoutes(
    fromStation,
    toStation,
    fromLines,
    MAX_TRANSFERS,
    fromLocation,
    toLocation
  );

  routes.push(...transferRoutes);

  // Calculate accurate timings for each route
  return calculateRouteTimes(routes);
}

/**
 * Select the best route based on duration, transfers, and stops
 */
function selectBestRoute(routes: Route[]): Route[] {
  return routes
    .filter((route) => route.totalDuration > 0)
    .sort((a, b) => {
      // Sort by duration first, then number of segments (transfers), then stops
      if (a.totalDuration !== b.totalDuration) {
        return a.totalDuration - b.totalDuration;
      }

      // Count transit segments to get number of lines used
      const aTransitCount = a.segments.filter(
        (s) => s.type === 'transit'
      ).length;
      const bTransitCount = b.segments.filter(
        (s) => s.type === 'transit'
      ).length;

      if (aTransitCount !== bTransitCount) {
        return aTransitCount - bTransitCount;
      }

      return a.totalStops - b.totalStops;
    });
}
