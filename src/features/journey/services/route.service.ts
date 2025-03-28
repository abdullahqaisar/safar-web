import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';

// These error codes must match the server-side codes
export const RouteErrorCodes = {
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  NO_START_STATION: 'NO_START_STATION',
  NO_END_STATION: 'NO_END_STATION',
  NO_ROUTES_FOUND: 'NO_ROUTES_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR', // Client-side only
};

// Consistent with server-side structure
interface NearbyStationInfo {
  id: string;
  name: string;
  distance: number;
  coordinates: Coordinates;
}

export class RouteError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: {
      nearbyStations?: NearbyStationInfo[];
    }
  ) {
    super(message);
    this.name = 'RouteError';
  }
}

export async function fetchRoutes(
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<Route[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Build query parameters for GET request
    const params = new URLSearchParams({
      fromCoords: `${fromLocation.lat},${fromLocation.lng}`,
      toCoords: `${toLocation.lat},${toLocation.lng}`,
    });

    const response = await fetch(`${baseUrl}/api/routes?${params.toString()}`);
    const data = await response.json();

    // Handle errors based on HTTP status and response structure
    if (!response.ok) {
      const { code, message, details } = data;

      switch (code) {
        case RouteErrorCodes.NO_START_STATION:
          throw new RouteError(
            message || 'No transit stations found near your starting location',
            RouteErrorCodes.NO_START_STATION,
            { nearbyStations: details?.nearbyStations }
          );

        case RouteErrorCodes.NO_END_STATION:
          throw new RouteError(
            message || 'No transit stations found near your destination',
            RouteErrorCodes.NO_END_STATION,
            { nearbyStations: details?.nearbyStations }
          );

        case RouteErrorCodes.NO_ROUTES_FOUND:
          throw new RouteError(
            message || 'No routes found between these locations',
            RouteErrorCodes.NO_ROUTES_FOUND
          );

        case RouteErrorCodes.MISSING_PARAMETERS:
          throw new RouteError(
            message || 'Missing required parameters',
            RouteErrorCodes.MISSING_PARAMETERS
          );

        case RouteErrorCodes.SERVER_ERROR:
        default:
          throw new RouteError(
            message || 'An error occurred while finding routes',
            code || RouteErrorCodes.SERVER_ERROR
          );
      }
    }

    // Handle success case but no routes in response
    if (!data.routes || data.routes.length === 0) {
      throw new RouteError(
        'No routes found between these locations',
        RouteErrorCodes.NO_ROUTES_FOUND
      );
    }

    return data.routes;
  } catch (error) {
    // If error is already a RouteError, just rethrow it
    if (error instanceof RouteError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof Error) {
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')
      ) {
        throw new RouteError(
          'Network error. Please check your internet connection and try again.',
          RouteErrorCodes.NETWORK_ERROR
        );
      }

      // Handle other errors
      throw new RouteError(
        error.message || 'An unexpected error occurred',
        RouteErrorCodes.SERVER_ERROR
      );
    }

    // Fallback for unknown errors
    throw new RouteError(
      'An unexpected error occurred while finding routes',
      RouteErrorCodes.SERVER_ERROR
    );
  }
}
