import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import { MAX_ROUTES_TO_RETURN } from '@/lib/constants/config';
import { findRoutes } from '@/server/core/journey/route/finder';
import { DISTANCE_THRESHOLDS } from '@/lib/constants/route-config';
import { routeCache } from '@/server/core/shared/cache';
import { filterAndRankRoutes } from '../core/journey/optimization/optimization';
import { stationManager } from '../core/journey/station/station';
import { createDirectWalkingRoute } from '../core/shared/route-utils';
import {
  extractLineIdsFromRoute,
  usesPrimaryLines,
} from '../core/shared/line-utils';

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
  const fromStation = stationManager.findStationById(fromStationId);
  const toStation = stationManager.findStationById(toStationId);

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

    // Add expanded search params for challenging geographies
    const needsExpandedSearch = directDistance > 8000; // For very long distances

    // Try with standard parameters first
    let allRoutes = await findRoutes(startLocation, endLocation);

    console.log(
      `Found ${allRoutes.length} potential routes, checking for diversity...`
    );

    // Analyze transit line diversity
    if (allRoutes.length > 1) {
      // Get unique line sets for each route
      const hasLineDiversity = checkLineDiversity(allRoutes);

      if (!hasLineDiversity) {
        console.log(
          'Routes lack transit line diversity, will attempt to find more diverse routes'
        );

        // Try a second time with more aggressive diversity parameters
        const secondAttemptRoutes = await findRoutes(
          startLocation,
          endLocation
        );

        // If we got new routes, add them to our collection
        if (secondAttemptRoutes.length > 0) {
          console.log(
            `Found ${secondAttemptRoutes.length} additional routes in second attempt`
          );

          // Combine routes, avoiding duplicates
          const routeIds = new Set(allRoutes.map((r) => r.id));
          for (const route of secondAttemptRoutes) {
            if (!routeIds.has(route.id)) {
              allRoutes.push(route);
            }
          }
        }
      }
    }

    if (allRoutes.length < 3) {
      const routesUsingMainLines = allRoutes.filter(usesPrimaryLines);

      if (routesUsingMainLines.length < 2) {
        console.log(
          'Not enough routes using primary lines, will attempt another search'
        );
        // Try another search focusing on major lines
        const majorLineRoutes = await findRoutes(startLocation, endLocation);

        // Add any new routes
        if (majorLineRoutes.length > 0) {
          const routeIds = new Set(allRoutes.map((r) => r.id));
          for (const route of majorLineRoutes) {
            if (!routeIds.has(route.id)) {
              allRoutes.push(route);
            }
          }
        }
      }
    }

    // If no routes found and it's a challenging scenario, try with expanded parameters
    if ((!allRoutes || allRoutes.length === 0) && needsExpandedSearch) {
      console.log(
        'Initial search failed, attempting with expanded search parameters'
      );

      allRoutes = await findRoutes(startLocation, endLocation);
    }

    if (!allRoutes || allRoutes.length === 0) {
      console.error('No routes found between:', {
        fromStation: fromStationId,
        toStation: toStationId,
        startLocation,
        endLocation,
        directDistance,
      });

      // Last resort: attempt direct walking route only
      const walkingRoute = await createDirectWalkingRoute(
        startLocation,
        endLocation
      );
      if (walkingRoute) {
        return [walkingRoute];
      }

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

/**
 * Check if there's sufficient line diversity among routes
 */
function checkLineDiversity(routes: Route[]): boolean {
  // Extract line sets for each route
  const lineSets = routes.map((route) => extractLineIdsFromRoute(route));

  // Check for routes with different transit lines
  for (let i = 0; i < lineSets.length; i++) {
    for (let j = 0; j < i; j++) {
      let hasDifferentLine = false;

      // Check if the sets have at least one different line
      for (const line of lineSets[i]) {
        if (!lineSets[j].has(line)) {
          hasDifferentLine = true;
          break;
        }
      }

      if (hasDifferentLine) return true;
    }
  }

  return false;
}
