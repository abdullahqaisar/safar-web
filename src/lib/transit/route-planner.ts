import { findStation } from '@/lib/utils/station';

import { Route } from '@/types/route';
import { Coordinates } from '@/types/station';
import { findRoutes } from './transit-routes';

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
