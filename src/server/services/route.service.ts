import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import { MAX_ROUTES_TO_RETURN } from '@/lib/constants/config';
import { findRoutes } from '@/server/core/journey/route/finder';
import { DISTANCE_THRESHOLDS } from '@/lib/constants/route-config';
import { routeCache } from '@/server/core/shared/cache';
import { filterAndRankRoutes } from '../core/journey/route/optimization';
import { stationService } from './station.service';

/**
 * Main entry point for route planning - finds the best routes between two stations
 */
export async function findBestRoutes(
  fromStationId: string,
  toStationId: string,
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[] | null> {
  // Validate stations
  const fromStation = stationService.findStationById(fromStationId);
  const toStation = stationService.findStationById(toStationId);

  if (!fromStation || !toStation) {
    console.error(
      `Invalid station: ${!fromStation ? fromStationId : toStationId}`
    );
    return null;
  }

  const startLocation = fromLocation || fromStation.coordinates;
  const endLocation = toLocation || toStation.coordinates;

  const cacheKey = routeCache.createKey(startLocation, endLocation);
  const cachedRoutes = routeCache.get(cacheKey);

  if (cachedRoutes) {
    console.log('Using cached routes');
    return cachedRoutes;
  }

  const directDistance = calculateDistanceSync(startLocation, endLocation);

  const isVeryShortDistance = directDistance < DISTANCE_THRESHOLDS.VERY_SHORT;
  const isMediumDistance =
    directDistance >= DISTANCE_THRESHOLDS.MEDIUM_MIN &&
    directDistance <= DISTANCE_THRESHOLDS.MEDIUM_MAX;
  const isLongDistance = directDistance > DISTANCE_THRESHOLDS.LONG;

  try {
    console.time('Route finding');
    const allRoutes = await findRoutes(startLocation, endLocation);

    if (!allRoutes || allRoutes.length === 0) {
      console.error('No routes found between:', {
        fromStation: fromStationId,
        toStation: toStationId,
        startLocation,
        endLocation,
        directDistance,
      });

      return null;
    }

    console.log(`Found ${allRoutes.length} potential routes`);

    let optimizedRoutes = filterAndRankRoutes(
      allRoutes,
      isVeryShortDistance,
      isMediumDistance,
      isLongDistance
    );

    if (optimizedRoutes.length === 0 && allRoutes.length > 0) {
      console.warn('All routes filtered out, using fallback logic');

      optimizedRoutes = [
        allRoutes.reduce(
          (fastest, route) =>
            route.totalDuration < fastest.totalDuration ? route : fastest,
          allRoutes[0]
        ),
      ];
    }

    optimizedRoutes = optimizedRoutes.slice(0, MAX_ROUTES_TO_RETURN);

    routeCache.set(cacheKey, optimizedRoutes);

    console.timeEnd('Route finding');
    return optimizedRoutes;
  } catch (error) {
    console.error('Error finding routes:', error);
    console.timeEnd('Route finding');
    return null;
  }
}
