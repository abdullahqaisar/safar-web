import { env } from '@/env.mjs';
import { Coordinates, Station } from '../types/graph';
import { DISTANCE_MATRIX_API_URL } from './constants';

// Simple in-memory cache
const distanceCache: Record<
  string,
  {
    distance: number;
    duration: number;
    timestamp: number;
  }
> = {};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create cache key from coordinates
function createCacheKey(
  origin: Coordinates,
  destination: Coordinates,
  mode: string
): string {
  return `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}|${mode}`;
}

// Check if cache entry is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_EXPIRY;
}

type DistanceMatrixResponse = {
  rows: Array<{
    elements: Array<{
      status: string;
      duration: { value: number };
      distance: { value: number };
    }>;
  }>;
};

/**
 * Fetch distance matrix data from Google Maps API
 */
async function fetchDistanceMatrix(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'walking' | 'driving'
): Promise<DistanceMatrixResponse | null> {
  const apiKey = env.GOOGLE_MAPS_API_KEY;

  const url = new URL(DISTANCE_MATRIX_API_URL);
  url.searchParams.append('origins', `${origin.lat},${origin.lng}`);
  url.searchParams.append(
    'destinations',
    `${destination.lat},${destination.lng}`
  );
  url.searchParams.append('mode', mode);
  url.searchParams.append('key', apiKey);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Distance matrix API request failed');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching distance matrix:', error);
    return null;
  }
}

/**
 * Calculate walking time between two points with caching
 */
export async function calculateWalkingTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ duration: number; distance: number } | null> {
  // Generate cache key
  const cacheKey = createCacheKey(origin, destination, 'walking');

  // Check cache
  if (
    distanceCache[cacheKey] &&
    isCacheValid(distanceCache[cacheKey].timestamp)
  ) {
    return {
      distance: distanceCache[cacheKey].distance,
      duration: distanceCache[cacheKey].duration,
    };
  }

  try {
    const response = await fetchDistanceMatrix(origin, destination, 'walking');

    if (response?.rows[0]?.elements[0]?.status === 'OK') {
      const result = response.rows[0].elements[0];
      const distance = result.distance.value; // in meters
      const duration = result.duration.value; // in seconds

      // Return null if walking distance is more than 4km
      if (distance > 4000) return null;

      // Cache the result
      distanceCache[cacheKey] = {
        distance,
        duration,
        timestamp: Date.now(),
      };

      return { duration, distance };
    }
    return null;
  } catch (error) {
    console.error('Error calculating walking time:', error);
    return null;
  }
}

/**
 * Calculate transit time between two stations
 */
export async function calculateTransitTime(
  origin: Station,
  destination: Station
): Promise<number> {
  try {
    const response = await fetchDistanceMatrix(
      origin.coordinates,
      destination.coordinates,
      'driving'
    );

    if (response?.rows[0]?.elements[0]?.status === 'OK') {
      return response.rows[0].elements[0].duration.value; // in seconds
    }
    return 0;
  } catch (error) {
    console.error('Error calculating transit time:', error);
    return 0;
  }
}
