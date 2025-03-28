import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import { ErrorCodes } from '@/types/error';
import { NearbyStationInfo } from '@/core/types/station';

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
        case ErrorCodes.NO_START_STATION:
          throw new RouteError(
            message || 'No transit stations found near your starting location',
            ErrorCodes.NO_START_STATION,
            { nearbyStations: details?.nearbyStations }
          );

        case ErrorCodes.NO_END_STATION:
          throw new RouteError(
            message || 'No transit stations found near your destination',
            ErrorCodes.NO_END_STATION,
            { nearbyStations: details?.nearbyStations }
          );

        case ErrorCodes.NO_ROUTES_FOUND:
          throw new RouteError(
            message || 'No routes found between these locations',
            ErrorCodes.NO_ROUTES_FOUND
          );

        case ErrorCodes.MISSING_PARAMETERS:
          throw new RouteError(
            message || 'Missing required parameters',
            ErrorCodes.MISSING_PARAMETERS
          );

        case ErrorCodes.SERVER_ERROR:
        default:
          throw new RouteError(
            message || 'An error occurred while finding routes',
            code || ErrorCodes.SERVER_ERROR
          );
      }
    }

    // Handle success case but no routes in response
    if (!data.routes || data.routes.length === 0) {
      throw new RouteError(
        'No routes found between these locations',
        ErrorCodes.NO_ROUTES_FOUND
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
          ErrorCodes.NETWORK_ERROR
        );
      }

      // Handle other errors
      throw new RouteError(
        error.message || 'An unexpected error occurred',
        ErrorCodes.SERVER_ERROR
      );
    }

    // Fallback for unknown errors
    throw new RouteError(
      'An unexpected error occurred while finding routes',
      ErrorCodes.SERVER_ERROR
    );
  }
}
