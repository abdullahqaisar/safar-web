import { Coordinates, Station } from '@/types/station';

export interface NearestStationOptions {
  maxDistance?: number;
  includeLines?: boolean;
  accessibleOnly?: boolean;
}

export async function fetchNearestStation(
  location: Coordinates | null,
  options: NearestStationOptions = {}
): Promise<Station | null> {
  if (!location) {
    return null;
  }

  try {
    const response = await fetch('/api/stations/nearest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location, options }),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch nearest station: ${
          errorData.message || response.statusText
        }`
      );
    }

    const result = await response.json();

    return result.station;
  } catch (error) {
    console.error('Error fetching nearest station:', error);
    throw error;
  }
}

export async function fetchNearbyStations(
  location: Coordinates | null,
  count: number = 3,
  options: NearestStationOptions = {}
): Promise<Station[]> {
  if (!location) {
    return [];
  }

  try {
    const response = await fetch('/api/stations/nearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location, count, options }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch nearby stations: ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    return [];
  }
}
