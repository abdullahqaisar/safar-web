import { NextResponse } from 'next/server';
import { TransitRouter } from '@/core/routing/routing';
import { getGraph } from '@/core/cache/graph-cache';
import {
  findNearestStationID,
  findMultipleNearestStations,
  getAccessRecommendation,
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
    const fromStationCoordinates = params.get('fromCoords');
    const toStationCoordinates = params.get('toCoords');

    // Get cached graph instead of creating a new one
    const transitGraph = getGraph();

    let originId;
    let destinationId;

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

    // Access recommendations for journey beginning and end
    let accessRecommendations;

    // Only include recommendations if the distances are meaningful (> 50m)
    const originRecommendation = fromStationCoordinates
      ? getAccessRecommendation(
          {
            lat: parseFloat(fromStationCoordinates.split(',')[0]),
            lng: parseFloat(fromStationCoordinates.split(',')[1]),
          },
          transitGraph,
          originId
        )
      : null;

    const destinationRecommendation = toStationCoordinates
      ? getAccessRecommendation(
          {
            lat: parseFloat(toStationCoordinates.split(',')[0]),
            lng: parseFloat(toStationCoordinates.split(',')[1]),
          },
          transitGraph,
          destinationId
        )
      : null;

    // Only include accessRecommendations in the response if at least one recommendation exists
    if (originRecommendation || destinationRecommendation) {
      accessRecommendations = {
        origin: originRecommendation,
        destination: destinationRecommendation,
      };

      // Add Google Maps navigation URLs
      if (
        fromStationCoordinates &&
        originRecommendation &&
        accessRecommendations.origin
      ) {
        const [fromLat, fromLng] = fromStationCoordinates.split(',');
        const originStation = transitGraph.stations[originId];
        if (originStation) {
          const stationLat = originStation.coordinates.lat;
          const stationLng = originStation.coordinates.lng;
          accessRecommendations.origin.googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${stationLat},${stationLng}`;
        }
      }

      if (
        toStationCoordinates &&
        destinationRecommendation &&
        accessRecommendations.destination
      ) {
        const [toLat, toLng] = toStationCoordinates.split(',');
        const destStation = transitGraph.stations[destinationId];
        if (destStation) {
          const stationLat = destStation.coordinates.lat;
          const stationLng = destStation.coordinates.lng;
          accessRecommendations.destination.googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${stationLat},${stationLng}&destination=${toLat},${toLng}`;
        }
      }
    }

    // Return response with recommendations only if they exist
    return NextResponse.json({
      routes: routingResult,
      origin: transitGraph.stations[originId],
      destination: transitGraph.stations[destinationId],
      ...(accessRecommendations && { accessRecommendations }),
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
