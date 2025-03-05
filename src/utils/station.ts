import { MetroLine } from '@/types/metro';
import { calculateDistance } from './geo';
import { MAX_STATION_DISTANCE } from '@/constants/config';
import { metroLines } from '@/constants/metro-data';
import { Station } from '@/types/station';

export const getAllStations = (): Station[] =>
  Array.from(new Set(metroLines.flatMap((line) => line.stations)));

export const findStation = (id: string | Station): Station | undefined =>
  getAllStations().find((s) => s.id === id);

/**
 * Gets an array of stations between two stations on the same line
 */
export function getStationsBetween(
  line: MetroLine,
  fromStation: Station,
  toStation: Station
): Station[] {
  const fromIndex = line.stations.findIndex((s) => s.id === fromStation.id);
  const toIndex = line.stations.findIndex((s) => s.id === toStation.id);

  if (fromIndex === -1 || toIndex === -1) return [];

  return fromIndex < toIndex
    ? line.stations.slice(fromIndex, toIndex + 1)
    : line.stations.slice(toIndex, fromIndex + 1).reverse();
}

/**
 * Finds all stations where two lines intersect
 */
export function findInterchanges(
  line1: MetroLine,
  line2: MetroLine
): Station[] {
  return line1.stations.filter((station) =>
    line2.stations.some((s) => s.id === station.id)
  );
}

/**
 * Calculates the total distance of a segment
 */
export function calculateSegmentDistance(stations: Station[]): number {
  return stations.reduce((acc, station, i) => {
    if (i === 0) return 0;
    return acc + calculateDistance(stations[i - 1], station);
  }, 0);
}

/**
 * Finds the nearest station to a given location
 */
export function findNearestStation(location: {
  lat: number;
  lng: number;
}): Station | null {
  const stations = getAllStations();
  if (stations.length === 0) return null;

  let nearest = stations[0];
  let shortestDistance = calculateDistance({ coordinates: location }, nearest);

  for (const station of stations) {
    const distance = calculateDistance({ coordinates: location }, station);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = station;
    }
  }

  return shortestDistance <= MAX_STATION_DISTANCE ? nearest : null;
}
