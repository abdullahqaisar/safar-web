import {
  findNearestStation,
  findNearestStations,
  initializeStationService,
} from '@/server/core/journey/station/station';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Ensure station service is initialized
initializeStationService();

const locationSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  options: z
    .object({
      maxDistance: z.number().positive().optional(),
      count: z.number().int().positive().optional(),
      includeLines: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('Processing nearest station request');

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const result = locationSchema.safeParse(body);

    if (!result.success) {
      console.log('Invalid request format:', result.error.format());
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { location, options = {} } = result.data;
    const {
      maxDistance = 2000, // 2km default
      count = 1,
      includeLines = true,
    } = options;

    console.log(
      `Searching for ${count} stations near ${location.lat},${location.lng}`
    );

    // Find stations based on count parameter
    if (count > 1) {
      const stations = findNearestStations(
        location,
        count,
        maxDistance,
        includeLines
      );

      if (!stations.length) {
        console.log('No stations found within radius');
        return NextResponse.json(
          { error: 'No stations found within the specified distance' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        count: stations.length,
        stations,
      });
    } else {
      // Find single nearest station
      const result = findNearestStation(location, maxDistance, includeLines);

      if (!result) {
        console.log('No nearby station found');
        return NextResponse.json(
          { error: 'No nearby station found' },
          { status: 404 }
        );
      }

      console.log(
        `Found station: ${result.station.name} at distance ${result.distance}m`
      );
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error finding nearest stations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lng') || '');

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const maxDistance = parseFloat(url.searchParams.get('maxDistance') || '');
    const count = parseInt(url.searchParams.get('count') || '1');
    const includeLines = url.searchParams.get('includeLines') !== 'false';

    if (count > 1) {
      const stations = findNearestStations(
        { lat, lng },
        count,
        isNaN(maxDistance) ? undefined : maxDistance,
        includeLines
      );

      if (!stations.length) {
        return NextResponse.json(
          { error: 'No stations found within the specified distance' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        count: stations.length,
        stations,
      });
    } else {
      const result = findNearestStation(
        { lat, lng },
        isNaN(maxDistance) ? undefined : maxDistance,
        includeLines
      );

      if (!result) {
        return NextResponse.json(
          { error: 'No nearby station found' },
          { status: 404 }
        );
      }

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error finding nearest stations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
