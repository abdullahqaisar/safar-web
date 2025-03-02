import { MetroLine, Route, RouteSegment, Station } from '@/types/metro';
import { findNearestStation, findStation } from '@/utils/station';
import { findDirectRoute } from './direct-route';
import { findTransferRoutes } from './transfer-route';

/**
 * Finds the best route between two stations
 * @param fromStationId ID of the starting station
 * @param toStationId ID of the destination station
 * @returns The best route or null if no route is found
 */
export function findBestRoute(
  fromStationId: string,
  toStationId: string
): Route | null {
  const fromStation = findStation(fromStationId);
  const toStation = findStation(toStationId);

  if (!fromStation || !toStation) return null;

  const directRoute = findDirectRoute(fromStation, toStation);
  if (directRoute) return directRoute;

  const transferRoutes = findTransferRoutes(fromStation, toStation);
  if (transferRoutes.length === 0) return null;

  return transferRoutes.sort((a, b) => {
    if (a.segments.length !== b.segments.length) {
      return a.segments.length - b.segments.length;
    }
    if (a.totalStops !== b.totalStops) {
      return a.totalStops - b.totalStops;
    }
    return a.totalDistance - b.totalDistance;
  })[0];
}

// Re-export needed functions and types
export { findNearestStation };
export type { Route, RouteSegment, Station, MetroLine };
