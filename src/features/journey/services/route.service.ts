import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';

export class RouteError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RouteError';
  }
}

export const RouteErrorCodes = {
  NO_START_STATION: 'NO_START_STATION',
  NO_END_STATION: 'NO_END_STATION',
  NO_ROUTES_FOUND: 'NO_ROUTES_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

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
      body: JSON.stringify({ fromLocation, toLocation }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || 'Failed to fetch routes';

      // Handle specific error cases based on status code
      if (response.status === 404) {
        if (message.includes('starting location')) {
          throw new RouteError(
            'No transit stations found near your starting location. Try selecting a location closer to public transportation.',
            RouteErrorCodes.NO_START_STATION
          );
        } else if (message.includes('destination location')) {
          throw new RouteError(
            'No transit stations found near your destination. Try selecting a location closer to public transportation.',
            RouteErrorCodes.NO_END_STATION
          );
        }
      }

      throw new RouteError(
        message,
        response.status === 500
          ? RouteErrorCodes.SERVER_ERROR
          : RouteErrorCodes.NO_ROUTES_FOUND
      );
    }

    const routes = await response.json();

    if (routes.length === 0) {
      throw new RouteError(
        'No routes found between these locations. Try different locations or travel times.',
        RouteErrorCodes.NO_ROUTES_FOUND
      );
    }

    return routes;
  } catch (error) {
    if (error instanceof RouteError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof Error && 'message' in error) {
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')
      ) {
        throw new RouteError(
          'Network error. Please check your internet connection and try again.',
          RouteErrorCodes.NETWORK_ERROR
        );
      }
    }

    throw new RouteError(
      'An unexpected error occurred while finding routes',
      RouteErrorCodes.SERVER_ERROR
    );
  }
}
