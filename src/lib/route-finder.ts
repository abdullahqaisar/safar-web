import {
  MetroLine,
  Station,
  metroLines,
  findStation,
  getAllStations,
} from './metro-data';

export interface RouteSegment {
  line: MetroLine;
  stations: Station[];
}

export interface Route {
  segments: RouteSegment[];
  totalStops: number;
  totalDistance: number;
}

// Helper function to calculate distance between two points
function calculateDistance(
  from: Station | { coordinates: { lat: number; lng: number } },
  to: Station
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.coordinates.lat - from.coordinates.lat);
  const dLng = toRad(to.coordinates.lng - from.coordinates.lng);
  const lat1 = toRad(from.coordinates.lat);
  const lat2 = toRad(to.coordinates.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function getStationsBetween(
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

function findDirectRoute(
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
  const totalDistance = stations.reduce((acc, station, i) => {
    if (i === 0) return 0;
    return acc + calculateDistance(stations[i - 1], station);
  }, 0);

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

function findInterchanges(line1: MetroLine, line2: MetroLine): Station[] {
  return line1.stations.filter((station) =>
    line2.stations.some((s) => s.id === station.id)
  );
}

function findTransferRoutes(
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

function calculateSegmentDistance(stations: Station[]): number {
  return stations.reduce((acc, station, i) => {
    if (i === 0) return 0;
    return acc + calculateDistance(stations[i - 1], station);
  }, 0);
}

export function findBestRoute(
  fromStationId: string,
  toStationId: string
): Route | null {
  const fromStation = findStation(fromStationId);
  const toStation = findStation(toStationId);

  if (!fromStation || !toStation) return null;

  const directRoute = findDirectRoute(fromStation, toStation);
  if (directRoute) return directRoute;

  const transferRoutes = findTransferRoutes(fromStation, toStation);
  if (transferRoutes.length === 0) return null;

  return transferRoutes.sort((a, b) => {
    if (a.segments.length !== b.segments.length) {
      return a.segments.length - b.segments.length;
    }
    if (a.totalStops !== b.totalStops) {
      return a.totalStops - b.totalStops;
    }
    return a.totalDistance - b.totalDistance;
  })[0];
}

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

  return shortestDistance <= 2 ? nearest : null;
}
