'use server';

import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';

export async function fetchRoutes(
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromLocation,
        toLocation,
      }),
      // Cache control for server-side data fetching
      cache: 'no-store', // or 'force-cache' for static data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}
