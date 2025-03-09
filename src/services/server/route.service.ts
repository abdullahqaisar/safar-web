import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { stationService } from '@/services/server/station.service';
import { calculateDistance } from '@/lib/utils/geo';
import { createWalkingSegment } from '../../lib/transit/segments/segment-builder';
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
  const fromStation = stationService.findStationById(fromStationId);
  const toStation = stationService.findStationById(toStationId);

  if (!fromStation) {
    console.error(`Origin station not found: ${fromStationId}`);
    console.timeEnd('Route finding');
    return null;
  }

  if (!toStation) {
    console.error(`Destination station not found: ${toStationId}`);
    console.timeEnd('Route finding');
    return null;
  }

  // Use station coordinates as fallback if no specific locations provided
  const startLocation = fromLocation || fromStation.coordinates;
  const endLocation = toLocation || toStation.coordinates;

  // Calculate direct walking distance to determine if walking is viable
  const directDistance = calculateDistance(
    { coordinates: startLocation },
    { coordinates: endLocation }
  );

  // If it's a short trip, consider just walking
  const MAX_DIRECT_WALK_DISTANCE = 1500; // 1.5km threshold
  if (directDistance <= MAX_DIRECT_WALK_DISTANCE) {
    const walkSegment = await createWalkingSegment(
      { id: 'origin', name: 'Origin', coordinates: startLocation },
      { id: 'destination', name: 'Destination', coordinates: endLocation },
      startLocation,
      endLocation
    );

    if (walkSegment) {
      const walkRoute = {
        id: `walk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        segments: [walkSegment],
        totalStops: 0,
        totalDistance: directDistance,
        totalDuration: walkSegment.duration,
        transfers: 0,
      };
      console.timeEnd('Route finding');
      return [walkRoute];
    }
  }

  // Create cache key
  const cacheKey = routeCache.createKey(startLocation, endLocation);

  // Check cache first
  const cachedRoutes = routeCache.get(cacheKey);
  if (cachedRoutes) {
    console.log('Using cached routes');
    console.timeEnd('Route finding');
    return cachedRoutes;
  }

  try {
    // Generate routes
    const routes = await findRoutes(startLocation, endLocation);

    if (!routes || routes.length === 0) {
      console.log('No routes found');
      console.timeEnd('Route finding');
      return null;
    }

    // Add unique IDs to routes
    const routesWithIds = routes.map((route) => ({
      ...route,
      id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    }));

    const optimizedRoutes = filterAndRankRoutes(routesWithIds).slice(
      0,
      MAX_ROUTES_TO_RETURN
    );

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
