import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { stationService } from '@/services/server/station.service';
import { calculateDistance } from '@/lib/utils/geo';
import { filterAndRankRoutes } from '../../lib/transit/routing/route-optimizer';
import { MAX_ROUTES_TO_RETURN } from '@/lib/constants/config';
import { routeCache } from '../../lib/utils/cache';
import { findRoutes } from '@/lib/transit/routing/route-generator';

/**
 * Main entry point for route planning - finds the best routes between two stations
 */
export async function findBestRoutes(
  fromStationId: string,
  toStationId: string,
  fromLocation?: Coordinates,
  toLocation?: Coordinates
): Promise<Route[] | null> {
  // Validate stations
  const fromStation = stationService.findStationById(fromStationId);
  const toStation = stationService.findStationById(fromStationId);

  if (!fromStation || !toStation) {
    console.error(
      `Invalid station: ${!fromStation ? fromStationId : toStationId}`
    );
    return null;
  }

  // Use station coordinates as fallback if no specific locations provided
  const startLocation = fromLocation || fromStation.coordinates;
  const endLocation = toLocation || toStation.coordinates;

  // Check cache first (quick return if cached)
  const cacheKey = routeCache.createKey(startLocation, endLocation);
  const cachedRoutes = routeCache.get(cacheKey);

  if (cachedRoutes) {
    console.log('Using cached routes');
    console.timeEnd('Route finding');
    return cachedRoutes;
  }

  // Calculate direct distance for classification
  const directDistance = calculateDistance(
    { coordinates: startLocation },
    { coordinates: endLocation }
  );

  // Distance classification for route optimization
  const isVeryShortDistance = directDistance < 500;
  const isMediumDistance = directDistance >= 500 && directDistance <= 2000;
  const isLongDistance = directDistance > 2000;

  try {
    // Find all possible routes (both walking and transit)
    const allRoutes = await findRoutes(startLocation, endLocation);

    // If no routes found
    if (!allRoutes || allRoutes.length === 0) {
      console.log('No routes found');
      console.timeEnd('Route finding');
      return null;
    }

    // Optimize and filter routes
    const optimizedRoutes = filterAndRankRoutes(
      allRoutes,
      isVeryShortDistance,
      isMediumDistance,
      isLongDistance
    ).slice(0, MAX_ROUTES_TO_RETURN);

    // Cache the result
    routeCache.set(cacheKey, optimizedRoutes);

    console.timeEnd('Route finding');
    return optimizedRoutes;
  } catch (error) {
    console.error('Error finding routes:', error);
    console.timeEnd('Route finding');
    return null;
  }
}
