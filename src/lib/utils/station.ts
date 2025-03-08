import { MetroLine } from '@/types/metro';
import { calculateDistance } from './geo';
import { MAX_STATION_DISTANCE } from '@/lib/constants/config';
import { Coordinates, Station } from '@/types/station';
import { stationService } from '@/services/server/station.service';

export function initializeStationService(): void {
  stationService.initialize();
}

export const getAllStations =
  stationService.getAllStations.bind(stationService);
export const findStationById =
  stationService.findStationById.bind(stationService);
export const getStationLines =
  stationService.getLinesForStation.bind(stationService);
export const getStationsBetween =
  stationService.getStationsBetween.bind(stationService);

export function findStation(id: string | Station): Station | undefined {
  if (typeof id !== 'string') return id;
  return stationService.findStationById(id);
}

export function calculateSegmentDistance(stations: Station[]): number {
  if (stations.length < 2) return 0;

  return stations.reduce((acc, station, i) => {
    if (i === 0) return 0;
    return acc + calculateDistance(stations[i - 1], station);
  }, 0);
}

export interface NearestStationResult {
  station: Station;
  distance: number;
  lines: MetroLine[];
}

export function findNearestStation(
  location: Coordinates,
  maxDistance: number = MAX_STATION_DISTANCE,
  includeLines: boolean = true,
  filter?: (station: Station) => boolean
): NearestStationResult | null {
  // Request just 1 station
  const result = stationService.findAccessibleStations(
    location,
    1,
    maxDistance,
    filter
  );
  return result.length > 0 ? result[0] : null;
}

export function findNearestStations(
  location: Coordinates,
  n: number = 3,
  maxDistance: number = MAX_STATION_DISTANCE,
  includeLines: boolean = true,
  filter?: (station: Station) => boolean
): NearestStationResult[] {
  // Let the service handle the filtering logic
  return stationService.findAccessibleStations(
    location,
    n,
    maxDistance,
    filter
  );
}

// Keep this function as a direct alias
export const findAccessibleStations =
  stationService.findAccessibleStations.bind(stationService);
