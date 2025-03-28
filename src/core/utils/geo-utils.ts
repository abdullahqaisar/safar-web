import { Coordinates } from '../types/graph';
import { EARTH_RADIUS_KM } from './constants';
import * as turf from '@turf/turf';

/**
 * Calculate distance between two coordinates using Turf.js
 * More accurate for geospatial calculations
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  try {
    // Create Turf points from coordinates
    const point1 = turf.point([coord1.lng, coord1.lat]);
    const point2 = turf.point([coord2.lng, coord2.lat]);

    // Calculate distance in meters with Turf (defaults to kilometers)
    const distance = turf.distance(point1, point2) * 1000;

    return distance;
  } catch (error) {
    // Fallback to haversine formula if Turf fails
    console.warn(
      'Turf distance calculation failed, using haversine fallback:',
      error
    );
    return calculateHaversineDistance(coord1, coord2);
  }
}

/**
 * Fallback implementation using Haversine formula
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const lat1 = toRadians(coord1.lat);
  const lng1 = toRadians(coord1.lng);
  const lat2 = toRadians(coord2.lat);
  const lng2 = toRadians(coord2.lng);

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  // Return distance in meters
  return distanceKm * 1000;
}

/**
 * Calculate bearing between two coordinates using Turf.js
 * Returns angle in degrees (0-360) from north
 */
export function calculateBearing(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  try {
    const point1 = turf.point([coord1.lng, coord1.lat]);
    const point2 = turf.point([coord2.lng, coord2.lat]);

    return turf.bearing(point1, point2);
  } catch (error) {
    console.warn('Turf bearing calculation failed', error);
    return 0;
  }
}

/**
 * Check if a coordinate is approximately north/south/east/west of another
 */
export function getDirectionName(
  bearing: number
): 'north' | 'east' | 'south' | 'west' {
  // Normalize bearing to 0-360
  const normBearing = ((bearing % 360) + 360) % 360;

  if (normBearing >= 315 || normBearing < 45) return 'north';
  if (normBearing >= 45 && normBearing < 135) return 'east';
  if (normBearing >= 135 && normBearing < 225) return 'south';
  return 'west';
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
