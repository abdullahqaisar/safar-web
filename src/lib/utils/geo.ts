import * as turf from '@turf/turf';
import { Coordinates } from '@/types/station';

export function coordinatesEqual(
  coord1: Coordinates,
  coord2: Coordinates
): boolean {
  return coord1.lat === coord2.lat && coord1.lng === coord2.lng;
}

export function calculateDistance(
  from: { coordinates: Coordinates } | Coordinates,
  to: { coordinates: Coordinates } | Coordinates
): number {
  const fromCoords = 'coordinates' in from ? from.coordinates : from;
  const toCoords = 'coordinates' in to ? to.coordinates : to;

  return calculateHaversineDistance(fromCoords, toCoords);
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
