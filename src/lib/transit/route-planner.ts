import { findStation } from '@/lib/utils/station';

import { Route } from '@/types/route';
import { Coordinates, Station } from '@/types/station';
import { metroLines } from '@/constants/metro-data';
import { findAllTransferRoutes, findDirectRoute } from './transit-routes';
import { calculateRouteTimes } from './walk-routes';

/**
 * Finds the best route between two stations
 */
export async function findBestRoute(
  fromStationId: string,
  toStationId: string,
  fromLocation?: Coordinates,
  toLocation?: Coordinates
): Promise<Route | null> {
  const fromStation = findStation(fromStationId);
  const toStation = findStation(toStationId);

  if (!fromStation || !toStation) return null;

  // Use station coordinates as fallback if no specific locations provided
  const startLocation = fromLocation || {
    lat: fromStation.coordinates.lat,
    lng: fromStation.coordinates.lng,
  };

  const endLocation = toLocation || {
    lat: toStation.coordinates.lat,
    lng: toStation.coordinates.lng,
  };

  const routes = await findRoutes(
    startLocation,
    endLocation,
    fromStation,
    toStation
  );

  if (!routes || routes.length === 0) return null;

  // Sort routes by total duration, then number of transfers, then stops
  return routes.sort((a, b) => {
    if (a.totalDuration !== b.totalDuration) {
      return a.totalDuration - b.totalDuration;
    }
    if (a.segments.length !== b.segments.length) {
      return a.segments.length - b.segments.length;
    }
    return a.totalStops - b.totalStops;
  })[0];
}

/**
 * Finds all possible routes including direct and transfer routes
 */
async function findRoutes(
  fromLocation: Coordinates,
  toLocation: Coordinates,
  fromStation: Station,
  toStation: Station,
  maxTransfers = Infinity
): Promise<Route[]> {
  const routes: Route[] = [];

  // Find direct route
  const directRoute = await findDirectRoute(
    fromLocation,
    toLocation,
    fromStation,
    toStation
  );

  console.log('Direct Route: ', JSON.stringify(directRoute));

  if (directRoute) {
    routes.push(directRoute);
  }

  // Find all possible transfer routes
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );

  // Initialize a path tracking structure for BFS/DFS
  const transferRoutes = await findAllTransferRoutes(
    fromStation,
    toStation,
    fromLines,
    maxTransfers,
    fromLocation,
    toLocation
  );

  routes.push(...transferRoutes);

  // Calculate times for each route
  const calculatedRoutes = await calculateRouteTimes(routes);

  return calculatedRoutes
    .filter((route) => route.totalDuration > 0)
    .sort((a, b) => {
      // Sort by duration first, then number of segments (transfers), then stops
      if (a.totalDuration !== b.totalDuration) {
        return a.totalDuration - b.totalDuration;
      }
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length;
      }
      return a.totalStops - b.totalStops;
    });
}
