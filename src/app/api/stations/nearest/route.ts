import { findNearestStation } from '@/lib/utils/station';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();

    if (!location?.lat || !location?.lng) {
      return NextResponse.json(
        { error: 'Valid location coordinates are required' },
        { status: 400 }
      );
    }

    const station = await findNearestStation(location);
    if (!station) {
      return NextResponse.json(
        { error: 'No nearby station found' },
        { status: 404 }
      );
    }

    return NextResponse.json(station);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
