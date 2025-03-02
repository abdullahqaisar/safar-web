import { Route, Station } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import { calculateSegmentDistance, getStationsBetween } from '@/utils/station';

/**
 * Attempts to find a direct route between two stations on the same line
 */
export function findDirectRoute(
  fromStation: Station,
  toStation: Station
): Route | null {
  const commonLine = metroLines.find(
    (line) =>
      line.stations.some((s) => s.id === fromStation.id) &&
      line.stations.some((s) => s.id === toStation.id)
  );

  if (!commonLine) return null;

  const stations = getStationsBetween(commonLine, fromStation, toStation);
  const totalDistance = calculateSegmentDistance(stations);

  return {
    segments: [
      {
        line: commonLine,
        stations: stations,
      },
    ],
    totalStops: stations.length - 1,
    totalDistance,
  };
}
