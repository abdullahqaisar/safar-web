import { Route } from '@/types/route';
import { Coordinates } from '@/types/station';

export async function fetchRoutes(
  fromStationId: string,
  toStationId: string,
  fromLocation?: Coordinates,
  toLocation?: Coordinates
): Promise<Route[] | null> {
  try {
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromStationId,
        toStationId,
        fromLocation,
        toLocation,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}
