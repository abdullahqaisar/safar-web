import { Coordinates, Station } from '@/types/station';

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param from Starting point with coordinates
 * @param to Ending point with coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  from: Station | { coordinates: Coordinates },
  to: Station
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.coordinates.lat - from.coordinates.lat);
  const dLng = toRad(to.coordinates.lng - from.coordinates.lng);
  const lat1 = toRad(from.coordinates.lat);
  const lat2 = toRad(to.coordinates.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
