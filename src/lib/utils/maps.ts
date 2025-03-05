import { Coordinates, Station } from '@/types/station';
import { env } from '@/env.mjs';

type DistanceMatrixResponse = {
  rows: Array<{
    elements: Array<{
      status: string;
      duration: { value: number };
      distance: { value: number };
    }>;
  }>;
};

// Add cache for API responses
const distanceCache = new Map<string, DistanceMatrixResponse>();

async function fetchDistanceMatrix(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'walking' | 'driving' = 'walking'
): Promise<DistanceMatrixResponse | null> {
  const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}-${mode}`;

  // Check cache first
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;

  const url = new URL(
    'https://maps.googleapis.com/maps/api/distancematrix/json'
  );
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

    // Cache the successful response
    if (data?.rows?.[0]?.elements?.[0]?.status === 'OK') {
      distanceCache.set(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.error('Error fetching distance matrix:', error);
    return null;
  }
}

export async function calculateWalkingTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ duration: number; distance: number } | null> {
  try {
    const response = await fetchDistanceMatrix(origin, destination, 'walking');

    if (response?.rows[0]?.elements[0]?.status === 'OK') {
      const result = response.rows[0].elements[0];
      const distance = result.distance.value; // in meters

      // Return null if walking distance is more than 4km
      if (distance > 4000) return null;

      return {
        duration: result.duration.value, // in seconds
        distance: distance,
      };
    }
    return null;
  } catch (error) {
    console.error('Error calculating walking time:', error);
    return null;
  }
}

export async function calculateTransitTime(
  origin: Station,
  destination: Station
): Promise<number> {
  try {
    const response = await fetchDistanceMatrix(
      { lat: origin.coordinates.lat, lng: origin.coordinates.lng },
      { lat: destination.coordinates.lat, lng: destination.coordinates.lng },
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
