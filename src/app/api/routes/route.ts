import { findBestRoutes } from '@/server/services/route.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { fromStationId, toStationId, fromLocation, toLocation } =
      await req.json();

    if (!fromStationId || !toStationId) {
      return NextResponse.json(
        { error: 'From and to station IDs are required' },
        { status: 400 }
      );
    }

    const route = await findBestRoutes(
      fromStationId,
      toStationId,
      fromLocation,
      toLocation
    );

    if (!route) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error('Route finding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
