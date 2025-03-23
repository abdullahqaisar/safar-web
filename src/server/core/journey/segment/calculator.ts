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
  let totalStops = 0;
  let totalDistance = 0;

  // Process each segment
  for (let i = 0; i < route.segments.length; i++) {
    const segment = { ...route.segments[i] };

    // Complete segment with real-world data
    const updatedSegment = await completeSegmentInfo(segment);

    if (!updatedSegment) continue; // Skip invalid segments

    // Add to new segments collection
    newSegments.push(updatedSegment);

    // Update route metrics
    if (segment.type === 'transit') {
      const transitSegment = updatedSegment as TransitSegment;
      const { distance, stops } = calculateTransitMetrics(transitSegment);
      totalStops += stops;
      totalDistance += distance;
    } else if (segment.type === 'walk') {
      totalDistance += (updatedSegment as WalkSegment).walkingDistance;
    }

    // Handle transfers between transit segments if needed
    await handleTransferIfNeeded(i, route, newSegments);
  }

  // Validate and finalize the route
  if (newSegments.length === 0) {
    return null;
  }

  // Consolidate any adjacent walking segments
  const consolidatedSegments = consolidateWalkingSegments(newSegments);

  return {
    segments: consolidatedSegments,
    totalStops,
    totalDistance,
    totalDuration: consolidatedSegments.reduce((sum, s) => sum + s.duration, 0),
    transfers: Math.max(
      0,
      consolidatedSegments.filter((s) => s.type === 'transit').length - 1
    ),
  };
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
