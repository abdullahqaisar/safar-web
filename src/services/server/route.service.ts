import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { stationService } from '@/services/server/station.service';
import { calculateDistanceSync } from '@/lib/utils/distance';
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
  // Validate stations - FIX: Use correct IDs for each station lookup
  const fromStation = stationService.findStationById(fromStationId);
  const toStation = stationService.findStationById(toStationId); // FIX: was using fromStationId here

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
  const directDistance = calculateDistanceSync(startLocation, endLocation);

  // Distance classification for route optimization
  const isVeryShortDistance = directDistance < 500;
  const isMediumDistance = directDistance >= 500 && directDistance <= 2000;
  const isLongDistance = directDistance > 2000;

  try {
    console.time('Route finding');
    // Find all possible routes (both walking and transit)
    const allRoutes = await findRoutes(startLocation, endLocation);

    // If no routes found
    if (!allRoutes || allRoutes.length === 0) {
      console.log('No routes found');
      console.timeEnd('Route finding');

      // ADDED: Better error logging for debugging
      console.error('No routes found between:', {
        fromStation: fromStationId,
        toStation: toStationId,
        startLocation,
        endLocation,
        directDistance,
      });

      return null;
    }

    // ADDED: Log successful route generation
    console.log(`Found ${allRoutes.length} potential routes`);

    // Optimize and filter routes with retry mechanism
    let optimizedRoutes = filterAndRankRoutes(
      allRoutes,
      isVeryShortDistance,
      isMediumDistance,
      isLongDistance
    );

    // ADDED: Fallback if optimization filters out all routes
    if (optimizedRoutes.length === 0 && allRoutes.length > 0) {
      console.warn('All routes filtered out, using fallback logic');
      // Less strict filtering - just return the fastest route
      optimizedRoutes = [
        allRoutes.reduce(
          (fastest, route) =>
            route.totalDuration < fastest.totalDuration ? route : fastest,
          allRoutes[0]
        ),
      ];
    }

    optimizedRoutes = optimizedRoutes.slice(0, MAX_ROUTES_TO_RETURN);

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
