import {
  Route,
  RouteSegment,
  TransitSegment,
  WalkSegment,
} from '@/types/route';

import { calculateTransitTime, calculateWalkingTime } from '@/lib/utils/maps';
import { createWalkingSegment } from './segment-builder';
import { Coordinates } from '@/types/station';
import { STOP_WAIT_TIME_SECONDS } from '@/lib/constants/config';

/**
 * Builds a complete route with initial walk, transit segments, and final walk
 */
export async function buildRoute(
  segments: RouteSegment[],
  totalStops: number,
  totalDistance: number
): Promise<Route> {
  let totalDuration = 0;

  segments.forEach((segment) => {
    totalDuration += segment.duration;
  });

  return {
    segments,
    totalStops,
    totalDistance,
    totalDuration,
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
  let totalDuration = 0;
  const newSegments: RouteSegment[] = [];
  let totalStops = 0;
  let totalDistance = 0;

  for (let i = 0; i < route.segments.length; i++) {
    const segment = { ...route.segments[i] };

    if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;
      const [fromStation, toStation] = walkSegment.stations;

      // Skip invalid or unnecessary walks
      if (
        fromStation.coordinates.lat === toStation.coordinates.lat &&
        fromStation.coordinates.lng === toStation.coordinates.lng
      ) {
        continue;
      }

      const walkResult = await calculateWalkingTime(
        fromStation.coordinates,
        toStation.coordinates
      );

      if (!walkResult || walkResult.duration <= 0) {
        return null;
      }

      walkSegment.duration = walkResult.duration;
      walkSegment.walkingTime = walkResult.duration;
      walkSegment.walkingDistance = walkResult.distance;
      totalDuration += walkResult.duration;
      newSegments.push(walkSegment);
    } else if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      const transitTime = await calculateTransitTime(
        transitSegment.stations[0],
        transitSegment.stations[transitSegment.stations.length - 1]
      );

      if (transitTime <= 0) {
        return null;
      }

      // Count stops in this transit segment (stations - 1)
      const segmentStops = transitSegment.stations.length - 1;
      totalStops += segmentStops;

      // Add distance for this segment
      for (let j = 0; j < transitSegment.stations.length - 1; j++) {
        const currentStation = transitSegment.stations[j];
        const nextStation = transitSegment.stations[j + 1];
        totalDistance += calculateDistance(
          currentStation.coordinates,
          nextStation.coordinates
        );
      }

      const stopWaitTime = segmentStops * STOP_WAIT_TIME_SECONDS;

      transitSegment.duration = transitTime + stopWaitTime;
      transitSegment.stopWaitTime = stopWaitTime;
      totalDuration += transitSegment.duration;
      newSegments.push(transitSegment);

      // Handle transfers - add walking segments between transit segments if needed
      if (
        i < route.segments.length - 1 &&
        route.segments[i + 1].type === 'transit'
      ) {
        const lastStation =
          transitSegment.stations[transitSegment.stations.length - 1];
        const nextFirstStation = route.segments[i + 1].stations[0];

        const needsTransferWalk =
          lastStation.id !== nextFirstStation.id &&
          (lastStation.coordinates.lat !== nextFirstStation.coordinates.lat ||
            lastStation.coordinates.lng !== nextFirstStation.coordinates.lng);

        if (needsTransferWalk) {
          const transferWalk = await createWalkingSegment(
            lastStation,
            nextFirstStation,
            lastStation.coordinates,
            nextFirstStation.coordinates
          );

          if (transferWalk) {
            newSegments.push(transferWalk);
            totalDuration += transferWalk.duration;
          }
        }
      }
    }
  }

  if (newSegments.length === 0 || totalDuration <= 0) {
    return null;
  }

  // Calculate the number of transfers (transit segments - 1)
  const transfers = newSegments.filter((s) => s.type === 'transit').length - 1;

  return {
    segments: newSegments,
    totalStops,
    totalDistance,
    totalDuration,
    transfers,
  };
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  // Simple euclidean distance calculation - can be replaced with haversine formula for more accuracy
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
