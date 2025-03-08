import { Coordinates } from '@/types/station';

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
  const R = 6371000; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Converts degrees to radians
 */
export function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Helper to check if coordinates are equal
 */
export function coordinatesEqual(a: Coordinates, b: Coordinates): boolean {
  return a.lat === b.lat && a.lng === b.lng;
}
