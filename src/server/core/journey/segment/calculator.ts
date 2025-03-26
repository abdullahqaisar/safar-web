import {
  Route,
  RouteSegment,
  TransitSegment,
  WalkSegment,
} from '@/types/route';

import { completeSegmentInfo, consolidateWalkingSegments } from './builder';
import { calculateHaversineDistance } from '../../shared/distance';

/**
 * Builds a complete route from segments with calculated metrics
 */
export async function buildRoute(
  segments: RouteSegment[],
  totalStops: number,
  totalDistance: number
): Promise<Route> {
  // Calculate total duration from all segments
  const totalDuration = segments.reduce(
    (sum, segment) => sum + segment.duration,
    0
  );

  // Calculate the number of transfers (transit segments - 1)
  const transfers = Math.max(
    0,
    segments.filter((s) => s.type === 'transit').length - 1
  );

  return {
    segments,
    totalStops,
    totalDistance,
    totalDuration,
    transfers,
  };
}

/**
 * Calculate accurate timing information for all routes
 */
export async function calculateRouteTimes(routes: Route[]): Promise<Route[]> {
  const validRoutes: Route[] = [];

  for (const route of routes) {
    try {
      const result = await processRoute(route);
      if (result) validRoutes.push(result);
    } catch (error) {
      console.error('Error processing route:', error);
    }
  }

  return validRoutes;
}

/**
 * Process a single route to validate and calculate accurate timing
 */
async function processRoute(route: Route): Promise<Route | null> {
  const newSegments: RouteSegment[] = [];

  // Process each segment
  for (let i = 0; i < route.segments.length; i++) {
    const segment = { ...route.segments[i] };

    // Tag first and last walking segments as access walks
    if (
      segment.type === 'walk' &&
      (i === 0 || i === route.segments.length - 1)
    ) {
      segment.isAccessWalk = true;
    }

    // Complete segment with real-world data
    const updatedSegment = await completeSegmentInfo(segment);

    if (!updatedSegment) {
      console.warn(
        `Invalid segment in route, skipping: ${JSON.stringify(segment)}`
      );
      continue;
    }

    // Add to new segments collection
    newSegments.push(updatedSegment);

    // Handle transfers between transit segments if needed
    await handleTransferIfNeeded(i, route, newSegments);
  }

  // Validate and finalize the route
  if (newSegments.length === 0) {
    console.warn('Route has no valid segments after processing');
    return null;
  }

  // Ensure origin and destination are properly connected
  await ensureOriginDestinationSegments(route, newSegments);

  // Consolidate any adjacent walking segments
  const consolidatedSegments = consolidateWalkingSegments(newSegments);

  // Use the shared metrics calculation function
  const metrics = calculateRouteMetrics(consolidatedSegments);

  return {
    segments: consolidatedSegments,
    totalStops: metrics.totalStops,
    totalDistance: metrics.totalDistance,
    totalDuration: metrics.totalDuration,
    transfers: Math.max(
      0,
      consolidatedSegments.filter((s) => s.type === 'transit').length - 1
    ),
  };
}

/**
 * Ensure route has proper walking segments at start and end if needed
 */
async function ensureOriginDestinationSegments(
  route: Route,
  segments: RouteSegment[]
): Promise<void> {
  if (segments.length === 0) return;

  // Get the first and last segments
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  // Check if route starts with transit but original route started with walking
  if (firstSegment.type === 'transit' && route.segments[0]?.type === 'walk') {
    const { createWalkingSegment } = await import('./builder');

    const originStation = route.segments[0].stations[0];
    const firstTransitStation = firstSegment.stations[0];

    if (originStation.id !== firstTransitStation.id) {
      const walkSegment = await createWalkingSegment(
        originStation,
        firstTransitStation,
        originStation.coordinates,
        firstTransitStation.coordinates
      );

      if (walkSegment) {
        segments.unshift(walkSegment);
      }
    }
  }

  // Check if route ends with transit but original route ended with walking
  if (
    lastSegment.type === 'transit' &&
    route.segments[route.segments.length - 1]?.type === 'walk'
  ) {
    const { createWalkingSegment } = await import('./builder');

    const lastTransitStation =
      lastSegment.stations[lastSegment.stations.length - 1];
    const destinationStation =
      route.segments[route.segments.length - 1].stations[1];

    if (lastTransitStation.id !== destinationStation.id) {
      const walkSegment = await createWalkingSegment(
        lastTransitStation,
        destinationStation,
        lastTransitStation.coordinates,
        destinationStation.coordinates
      );

      if (walkSegment) {
        segments.push(walkSegment);
      }
    }
  }
}

/**
 * Handle transfer walking segments between transit segments if needed
 */
async function handleTransferIfNeeded(
  currentIndex: number,
  route: Route,
  newSegments: RouteSegment[]
): Promise<void> {
  // Only check for transfers if there's another segment after this one
  if (currentIndex >= route.segments.length - 1) return;

  const currentSegment = route.segments[currentIndex];
  const nextSegment = route.segments[currentIndex + 1];

  // Only handle transfers between transit segments
  if (currentSegment.type !== 'transit' || nextSegment.type !== 'transit')
    return;

  const lastStation =
    currentSegment.stations[currentSegment.stations.length - 1];
  const nextFirstStation = nextSegment.stations[0];

  // Check if a transfer walk is needed
  const needsTransferWalk =
    lastStation.id !== nextFirstStation.id &&
    (lastStation.coordinates.lat !== nextFirstStation.coordinates.lat ||
      lastStation.coordinates.lng !== nextFirstStation.coordinates.lng);

  if (!needsTransferWalk) return;

  // Import only when needed to avoid circular dependencies
  const { createWalkingSegment } = await import('./builder');

  const transferWalk = await createWalkingSegment(
    lastStation,
    nextFirstStation,
    lastStation.coordinates,
    nextFirstStation.coordinates
  );

  if (transferWalk) {
    newSegments.push(transferWalk);
  }
}

/**
 * Calculate route metrics for a collection of segments
 */
export function calculateRouteMetrics(segments: RouteSegment[]): {
  totalDistance: number;
  totalStops: number;
  totalDuration: number;
} {
  let totalDistance = 0;
  let totalStops = 0;
  let totalDuration = 0;

  for (const segment of segments) {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      totalStops += transitSegment.stations.length - 1;

      const { distance } = calculateTransitMetrics(transitSegment);
      totalDistance += distance;
    } else if (segment.type === 'walk') {
      totalDistance += (segment as WalkSegment).walkingDistance;
    }

    totalDuration += segment.duration;
  }

  return { totalDistance, totalStops, totalDuration };
}

export function calculateTransitMetrics(segment: TransitSegment): {
  distance: number;
  stops: number;
} {
  let distance = 0;
  const stops = segment.stations.length - 1;

  // Calculate the distance by summing distances between consecutive stations
  for (let i = 0; i < segment.stations.length - 1; i++) {
    const from = segment.stations[i].coordinates;
    const to = segment.stations[i + 1].coordinates;
    distance += calculateHaversineDistance(from, to);
  }

  return { distance, stops };
}
