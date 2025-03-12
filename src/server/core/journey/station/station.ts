import { Coordinates, Station, NearestStationResult } from '@/types/station';
import { MAX_STATION_DISTANCE } from '@/lib/constants/config';
import { stationService } from '@/server/services/station.service';

export function initializeStationService(): void {
  stationService.initialize();
}

export const getAllStations =
  stationService.getAllStations.bind(stationService);

export function findStation(id: string | Station): Station | undefined {
  if (typeof id !== 'string') {
    return id;
  }
  return stationService.findStationById(id);
}

export const findStationById =
  stationService.findStationById.bind(stationService);

export const getStationLines =
  stationService.getLinesForStation.bind(stationService);

export function findNearestStation(
  location: Coordinates,
  maxDistance = MAX_STATION_DISTANCE,
  includeLines = true,
  filter?: (station: Station) => boolean
): NearestStationResult | null {
  if (!location) return null;

  const results = stationService.findAccessibleStations(
    location,
    1,
    maxDistance,
    includeLines,
    filter
  );

  return results.length > 0 ? results[0] : null;
}

export function findNearestStations(
  location: Coordinates,
  n: number = 3,
  maxDistance: number = MAX_STATION_DISTANCE,
  includeLines: boolean = true,
  filter?: (station: Station) => boolean
): NearestStationResult[] {
  if (!location) return [];

  return stationService.findAccessibleStations(
    location,
    n,
    maxDistance,
    includeLines,
    filter
  );
}

export const findAccessibleStations =
  stationService.findAccessibleStations.bind(stationService);
