import { Route } from '@/types/route';
import { Coordinates } from '@/types/station';

export async function fetchRoutes(
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[] | null> {
  try {
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromLocation,
        toLocation,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch routes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}
