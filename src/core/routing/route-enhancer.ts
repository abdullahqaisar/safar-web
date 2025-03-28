import { Route, WalkingRouteSegment } from '../types/route';
import { calculateWalkingTime } from '../utils/maps';

/**
 * Enhance routes with more accurate walking data from Google Maps API
 * Only processes the top few routes to minimize API usage
 */
export async function enhanceRoutes(
  routes: Route[],
  maxToEnhance = 3
): Promise<Route[]> {
  // Only enhance the top few routes
  const routesToEnhance = routes.slice(0, maxToEnhance);
  const otherRoutes = routes.slice(maxToEnhance);

  const enhancedRoutes = await Promise.all(
    routesToEnhance.map(async (route) => {
      try {
        // Clone the route to avoid modifying the original
        const enhancedRoute = { ...route, segments: [...route.segments] };

        // Track adjustments to overall route duration and distance
        let durationAdjustment = 0;
        let distanceAdjustment = 0;

        // Enhance each walking segment
        for (let i = 0; i < enhancedRoute.segments.length; i++) {
          const segment = enhancedRoute.segments[i];

          if (segment.type === 'walk') {
            const walkSegment = segment as WalkingRouteSegment;
            const from = walkSegment.stations[0];
            const to = walkSegment.stations[1];

            // Get enhanced walking data
            const enhancedData = await calculateWalkingTime(
              from.coordinates,
              to.coordinates
            );

            if (enhancedData) {
              // Calculate adjustments
              const oldDuration = walkSegment.duration;
              const oldDistance = walkSegment.walkingDistance;

              // Update segment with enhanced data
              enhancedRoute.segments[i] = {
                ...walkSegment,
                duration: enhancedData.duration,
                walkingTime: enhancedData.duration,
                walkingDistance: enhancedData.distance,
              };

              // Track adjustments
              durationAdjustment += enhancedData.duration - oldDuration;
              distanceAdjustment += enhancedData.distance - oldDistance;
            }
          }
        }

        // Update total route stats
        enhancedRoute.totalDuration += durationAdjustment;
        enhancedRoute.totalDistance += distanceAdjustment;

        return enhancedRoute;
      } catch (error) {
        // If enhancement fails, return the original route
        console.error('Failed to enhance route:', error);
        return route;
      }
    })
  );

  // Return enhanced routes + other routes
  return [...enhancedRoutes, ...otherRoutes];
}
