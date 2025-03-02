import { Station } from '@/types/metro';

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param from Starting point with coordinates
 * @param to Ending point with coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  from: Station | { coordinates: { lat: number; lng: number } },
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
