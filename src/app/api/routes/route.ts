import { MAX_STATION_DISTANCE } from '@/lib/constants/config';
import { findNearestStation } from '@/server/core/journey/station/station';
import { findBestRoutes } from '@/server/services/route.service';
import { NextResponse } from 'next/server';

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
    const fromStation = await findNearestStation(
      fromLocation,
      MAX_STATION_DISTANCE,
      true
    );

    console.log(fromLocation, fromStation);

    if (!fromStation) {
      return NextResponse.json(
        { message: 'No transit stations found near your starting location' },
        { status: 404 }
      );
    }

    const toStation = await findNearestStation(
      toLocation,
      MAX_STATION_DISTANCE,
      true
    );

    if (!toStation) {
      return NextResponse.json(
        { message: 'No transit stations found near your destination location' },
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
      return NextResponse.json([], { status: 200 });
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
      },
      { status: 500 }
    );
  }
}
