import { Coordinates, Station } from '@/types/station';

export async function fetchNearestStation(
  location: Coordinates | null
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
      body: JSON.stringify({ location }),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch nearest station');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearest station:', error);
    throw error;
  }
}
