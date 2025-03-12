import * as turf from '@turf/turf';

import { Coordinates } from '@/types/station';
import { calculateWalkingTime } from './maps';

/**
 * Distance calculation types for different accuracy needs
 */
export enum DistanceMethod {
  HAVERSINE = 'haversine',
  WALKING_PATH = 'walking-path',
  DRIVING_PATH = 'driving-path',
}

export async function calculateDistance(
  from: Coordinates,
  to: Coordinates,
  method: DistanceMethod = DistanceMethod.HAVERSINE
): Promise<number> {
  switch (method) {
    case DistanceMethod.WALKING_PATH:
      // Use Google API for walking path distance
      const walkResult = await calculateWalkingTime(from, to);
      return walkResult?.distance ?? calculateHaversineDistance(from, to);

    case DistanceMethod.DRIVING_PATH:
      // Use scaling factor for driving distance estimation
      return calculateHaversineDistance(from, to) * 1.3;

    case DistanceMethod.HAVERSINE:
    default:
      // Fast straight-line calculation
      return calculateHaversineDistance(from, to);
  }
}

export function calculateDistanceSync(
  from: Coordinates,
  to: Coordinates
): number {
  return calculateHaversineDistance(from, to);
}

export function coordinatesEqual(
  coord1: Coordinates,
  coord2: Coordinates
): boolean {
  return coord1.lat === coord2.lat && coord1.lng === coord2.lng;
}

export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const point1 = turf.point([coord1.lng, coord1.lat]);
  const point2 = turf.point([coord2.lng, coord2.lat]);

  return turf.distance(point1, point2, { units: 'kilometers' }) * 1000;
}

/**
 * Converts degrees to radians
 */
export function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
