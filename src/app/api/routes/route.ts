import { NextResponse } from 'next/server';
import { TransitRouter } from '@/core/routing/routing';
import { metroLines } from '@/core/data/metro-data';
import { stationData } from '@/core/data/station-data';
import { TransitGraph } from '@/core/graph/graph';
import {
  findNearestStationID,
  findMultipleNearestStations,
} from '@/core/station/station';
import { ErrorCodes } from '@/types/error';
import { NearbyStationInfo } from '@/core/types/station';

interface ErrorResponseDetails {
  nearbyStations?: NearbyStationInfo[];
}

// Standard error response interface with specific detail types
interface ErrorResponse {
  code: string;
  message: string;
  details?: ErrorResponseDetails;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const fromStationId = params.get('from');
    const toStationId = params.get('to');
    const fromStationCoordinates = params.get('fromCoords');
    const toStationCoordinates = params.get('toCoords');

    const transitGraph = new TransitGraph();
    transitGraph.initialize(stationData, metroLines);

    let originId = fromStationId;
    let destinationId = toStationId;

    // Process from coordinates if provided
    if (fromStationCoordinates && !originId) {
      const [lat, lng] = fromStationCoordinates.split(',').map(Number);

      if (!isNaN(lat) && !isNaN(lng)) {
        originId = findNearestStationID({ lat, lng }, transitGraph, 10000);
      }
    }

    // Process to coordinates if provided
    if (toStationCoordinates && !destinationId) {
      const [lat, lng] = toStationCoordinates.split(',').map(Number);

      if (!isNaN(lat) && !isNaN(lng)) {
        destinationId = findNearestStationID({ lat, lng }, transitGraph, 10000);
      }
    }

    // Handle missing origin station with nearby suggestions
    if (!originId && fromStationCoordinates) {
      const [lat, lng] = fromStationCoordinates.split(',').map(Number);

      if (!isNaN(lat) && !isNaN(lng)) {
        const nearbyStations = findMultipleNearestStations(
          { lat, lng },
          transitGraph,
          5,
          10000
        );

        const error: ErrorResponse = {
          code: ErrorCodes.NO_START_STATION,
          message: 'No transit stations found near your starting location',
          details: {
            nearbyStations: nearbyStations.map((item) => ({
              id: item.station.id,
              name: item.station.name,
              distance: Math.round(item.distance),
              coordinates: item.station.coordinates,
            })),
          },
        };

        return NextResponse.json(error, { status: 404 });
      }
    }

    // Handle missing destination station with nearby suggestions
    if (!destinationId && toStationCoordinates) {
      const [lat, lng] = toStationCoordinates.split(',').map(Number);

      if (!isNaN(lat) && !isNaN(lng)) {
        const nearbyStations = findMultipleNearestStations(
          { lat, lng },
          transitGraph,
          5,
          10000
        );

        const error: ErrorResponse = {
          code: ErrorCodes.NO_END_STATION,
          message: 'No transit stations found near your destination',
          details: {
            nearbyStations: nearbyStations.map((item) => ({
              id: item.station.id,
              name: item.station.name,
              distance: Math.round(item.distance),
              coordinates: item.station.coordinates,
            })),
          },
        };

        return NextResponse.json(error, { status: 404 });
      }
    }

    // Handle missing parameters (no coordinates or station IDs)
    if (!originId || !destinationId) {
      const error: ErrorResponse = {
        code: ErrorCodes.MISSING_PARAMETERS,
        message: 'Missing origin or destination parameters',
      };

      return NextResponse.json(error, { status: 400 });
    }

    // Find routes
    const router = new TransitRouter(transitGraph);
    const routingResult = router.findRoutes(originId, destinationId);

    // Handle routing errors
    if ('error' in routingResult) {
      return NextResponse.json(
        {
          code: routingResult.code,
          message: routingResult.error,
        },
        { status: 404 }
      );
    }

    // No routes found
    if (routingResult.length === 0) {
      const error: ErrorResponse = {
        code: ErrorCodes.NO_ROUTES_FOUND,
        message: 'No routes found between these locations',
      };

      return NextResponse.json(error, { status: 404 });
    }

    // Success response
    return NextResponse.json({
      routes: routingResult,
      origin: transitGraph.stations[originId],
      destination: transitGraph.stations[destinationId],
    });
  } catch (error) {
    console.error('Route search error:', error);

    const serverError: ErrorResponse = {
      code: ErrorCodes.SERVER_ERROR,
      message:
        error instanceof Error ? error.message : 'Failed to search for routes',
    };

    return NextResponse.json(serverError, { status: 500 });
  }
}
