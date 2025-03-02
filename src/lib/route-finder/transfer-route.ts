import { Route, Station } from '@/types/metro';
import { metroLines } from '../../constants/metro-data';
import {
  calculateSegmentDistance,
  findInterchanges,
  getStationsBetween,
} from '@/utils/station';

/**
 * Finds routes that require one or more transfers between lines
 */
export function findTransferRoutes(
  fromStation: Station,
  toStation: Station,
  maxTransfers = 2
): Route[] {
  const routes: Route[] = [];
  const fromLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === fromStation.id)
  );
  const toLines = metroLines.filter((line) =>
    line.stations.some((s) => s.id === toStation.id)
  );

  // Try single transfer routes
  for (const fromLine of fromLines) {
    for (const toLine of toLines) {
      if (fromLine.id === toLine.id) continue;

      const interchangeStations = findInterchanges(fromLine, toLine);

      for (const transfer of interchangeStations) {
        const segment1 = getStationsBetween(fromLine, fromStation, transfer);
        const segment2 = getStationsBetween(toLine, transfer, toStation);

        if (segment1.length > 0 && segment2.length > 0) {
          const totalDistance =
            calculateSegmentDistance(segment1) +
            calculateSegmentDistance(segment2);

          routes.push({
            segments: [
              { line: fromLine, stations: segment1 },
              { line: toLine, stations: segment2 },
            ],
            totalStops: segment1.length + segment2.length - 2,
            totalDistance,
          });
        }
      }
    }
  }

  // Try double transfer routes if needed
  if (routes.length === 0 && maxTransfers > 1) {
    const allLines = new Set(metroLines);

    for (const middleLine of Array.from(allLines)) {
      if (fromLines.includes(middleLine) || toLines.includes(middleLine))
        continue;

      for (const fromLine of fromLines) {
        for (const toLine of toLines) {
          const firstTransfers = findInterchanges(fromLine, middleLine);
          const secondTransfers = findInterchanges(middleLine, toLine);

          for (const firstTransfer of firstTransfers) {
            for (const secondTransfer of secondTransfers) {
              const segment1 = getStationsBetween(
                fromLine,
                fromStation,
                firstTransfer
              );
              const segment2 = getStationsBetween(
                middleLine,
                firstTransfer,
                secondTransfer
              );
              const segment3 = getStationsBetween(
                toLine,
                secondTransfer,
                toStation
              );

              if (
                segment1.length > 0 &&
                segment2.length > 0 &&
                segment3.length > 0
              ) {
                const totalDistance =
                  calculateSegmentDistance(segment1) +
                  calculateSegmentDistance(segment2) +
                  calculateSegmentDistance(segment3);

                routes.push({
                  segments: [
                    { line: fromLine, stations: segment1 },
                    { line: middleLine, stations: segment2 },
                    { line: toLine, stations: segment3 },
                  ],
                  totalStops:
                    segment1.length + segment2.length + segment3.length - 3,
                  totalDistance,
                });
              }
            }
          }
        }
      }
    }
  }

  return routes;
}
