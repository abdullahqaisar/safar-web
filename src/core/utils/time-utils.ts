import {
  AVG_METRO_SPEED_MS,
  AVG_WALKING_SPEED_M_MIN,
  ACCELERATION_FACTOR,
} from './constants';

/**
 * Calculate transit time between stations based on distance and average metro speed
 */
export function calculateTransitTime(distanceMeters: number): number {
  // Calculate base travel time using distance and speed
  const baseTimeSeconds = distanceMeters / AVG_METRO_SPEED_MS;

  // Add time for acceleration and deceleration (more significant for shorter distances)
  const accelerationTime = Math.min(distanceMeters * ACCELERATION_FACTOR, 30);

  // Total calculated time
  const calculatedTime = baseTimeSeconds + accelerationTime;

  // Return the maximum of calculated time or minimum station time
  return calculatedTime;
}

/**
 * Calculate walking time based on distance
 */
export function calculateWalkingTime(distanceMeters: number): number {
  // Walking time in seconds = distance / speed
  return Math.round(distanceMeters / (AVG_WALKING_SPEED_M_MIN / 60));
}
