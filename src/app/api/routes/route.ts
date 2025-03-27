import { MAX_STATION_DISTANCE } from '@/lib/constants/config';
import { stationManager } from '@/server/core/journey/station/station';
import { findBestRoutes } from '@/server/services/route.service';
import { NextResponse } from 'next/server';
import { TransitRouter } from '@/core/routing/routing';
import { metroLines } from '@/core/data/metro-data';
import { stationData } from '@/core/data/station-data';
import { TransitGraph } from '@/core/graph/graph';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const fromStationId = params.get('from');
    const toStationId = params.get('to');

    // Validate required parameters
    if (!fromStationId || !toStationId) {
      return NextResponse.json(
        {
          message:
            'Missing required parameters: "from" and "to" station IDs are required',
          code: 'MISSING_PARAMETERS',
        },
        { status: 400 }
      );
    }
    // First, create a TransitGraph instance
    const transitGraph = new TransitGraph();

    // Then create a TransitRouter with that graph
    const router = new TransitRouter(transitGraph);

    // Initialize with your stations and lines
    router.initialize(stationData, metroLines);

    const routingResult = router.findRoutes(fromStationId, toStationId);
    // Check if there was an error
    if ('error' in routingResult) {
      return NextResponse.json(
        {
          message: routingResult.error,
          code: routingResult.code,
        },
        { status: 404 }
      );
    }

    // Return the found routes
    return NextResponse.json(routingResult);
  } catch (error) {
    console.error('Route search error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to search for routes',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromLocation, toLocation } = body;

    // Validate required parameters
    if (
      !fromLocation ||
      !toLocation ||
      typeof fromLocation.lat !== 'number' ||
      typeof fromLocation.lng !== 'number' ||
      typeof toLocation.lat !== 'number' ||
      typeof toLocation.lng !== 'number'
    ) {
      return NextResponse.json(
        { message: 'Invalid location coordinates provided' },
        { status: 400 }
      );
    }

    // Find the nearest stations to the provided coordinates
    const fromStation = await stationManager.findNearestStation(
      fromLocation,
      MAX_STATION_DISTANCE,
      true
    );

    if (!fromStation) {
      return NextResponse.json(
        {
          message:
            'No transit stations found near your starting location. Try selecting a location closer to public transportation.',
          code: 'NO_START_STATION',
        },
        { status: 404 }
      );
    }

    const toStation = await stationManager.findNearestStation(
      toLocation,
      MAX_STATION_DISTANCE,
      true
    );

    if (!toStation) {
      return NextResponse.json(
        {
          message:
            'No transit stations found near your destination location. Try selecting a location closer to public transportation.',
          code: 'NO_END_STATION',
        },
        { status: 404 }
      );
    }

    const fromStationId = fromStation.station.id;
    const toStationId = toStation.station.id;

    // Find the best routes between these stations
    const routes = await findBestRoutes(
      fromStationId,
      toStationId,
      fromLocation,
      toLocation
    );

    if (!routes || routes.length === 0) {
      return NextResponse.json(
        {
          message:
            'No routes found between these stations. The locations may be too far apart or not connected by our transit network.',
          code: 'NO_ROUTES_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Route search error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to search for routes',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
