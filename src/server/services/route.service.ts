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

    // Add expanded search params for challenging geographies
    const needsExpandedSearch = directDistance > 8000; // For very long distances

    // Try with standard parameters first
    let allRoutes = await findRoutes(startLocation, endLocation);

    console.log(
      `Found ${allRoutes.length} potential routes, checking for diversity...`
    );

    // Analyze transit line diversity
    if (allRoutes.length > 1) {
      const lineSets = allRoutes.map((route) => {
        const lines = new Set<string>();
        for (const segment of route.segments) {
          if (
            segment.type === 'transit' &&
            'line' in segment &&
            segment.line?.id
          ) {
            lines.add(segment.line.id);
          }
        }
        return lines;
      });

      // Check for routes with different transit lines
      const hasLineDiversity = lineSets.some((lines, i) => {
        for (let j = 0; j < i; j++) {
          // Check if there's at least one different line
          const otherLines = lineSets[j];
          let hasDifferentLine = false;

          for (const line of lines) {
            if (!otherLines.has(line)) {
              hasDifferentLine = true;
              break;
            }
          }

          if (hasDifferentLine) return true;
        }
        return false;
      });

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

    // If routes are still limited, check if we need to specifically search for major line combinations
    if (allRoutes.length < 3) {
      // Look for routes that might be using mainly feeder routes
      const usesMajorLines = allRoutes.filter((route) =>
        route.segments.some(
          (segment) =>
            segment.type === 'transit' &&
            'line' in segment &&
            ['red', 'orange', 'blue', 'green'].includes(segment.line?.id || '')
        )
      );

      if (usesMajorLines.length < 2) {
        console.log(
          'Not enough routes using major lines, will attempt another search'
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
 * Create a fallback direct walking route when no transit routes can be found
 */
async function createDirectWalkingRoute(
  startLocation: Coordinates,
  endLocation: Coordinates
): Promise<Route | null> {
  try {
    const { createWalkingSegment } = await import(
      '../core/journey/segment/builder'
    );

    // Create origin and destination dummy stations
    const originStation = {
      id: 'origin',
      name: 'Origin',
      coordinates: startLocation,
    };

    const destStation = {
      id: 'destination',
      name: 'Destination',
      coordinates: endLocation,
    };

    // Create a walking segment
    const segment = await createWalkingSegment(
      originStation,
      destStation,
      startLocation,
      endLocation
    );

    if (!segment) return null;

    // Build a complete route with just this segment
    return {
      segments: [segment],
      totalDuration: segment.duration,
      totalDistance: segment.walkingDistance,
      totalStops: 0,
      transfers: 0,
      isDirectWalk: true, // Flag to identify this as a direct walk route
    };
  } catch (error) {
    console.error('Failed to create direct walking route:', error);
    return null;
  }
}
