import { Coordinates, Station } from '@/types/station';

export async function getNearestStation(
  location: Coordinates
): Promise<Station | null> {
  try {
    const response = await fetch('/api/stations/nearest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch nearest station');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearest station:', error);
    return null;
  }
}
