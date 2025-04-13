import { stationData } from '@/core/data/station-data';
import { metroLines, MAJOR_INTERCHANGES } from '@/core/data/metro-data';

/**
 * Get station name by ID
 */
export function getStationNameById(stationId: string): string {
  const station = stationData.find((station) => station.id === stationId);
  return station ? station.name : stationId;
}

/**
 * Get station coordinates by ID
 */
export function getStationCoordinates(stationId: string): [number, number] {
  const station = stationData.find((station) => station.id === stationId);
  if (station && station.coordinates) {
    return [station.coordinates.lat, station.coordinates.lng];
  }

  const baseCoord: [number, number] = [33.684, 73.048];
  return [
    baseCoord[0] + (Math.random() * 0.05 - 0.025),
    baseCoord[1] + (Math.random() * 0.05 - 0.025),
  ];
}

/**
 * Get formatted station names for a line
 */
export function getFormattedLineStations(lineId: string): {
  startStation: string;
  endStation: string;
  totalStations: number;
} {
  const line = metroLines.find((line) => line.id === lineId);

  if (!line || !line.stations || line.stations.length === 0) {
    return {
      startStation: 'Unknown',
      endStation: 'Unknown',
      totalStations: 0,
    };
  }

  return {
    startStation: getStationNameById(line.stations[0]),
    endStation: getStationNameById(line.stations[line.stations.length - 1]),
    totalStations: line.stations.length,
  };
}

/**
 * Check if a station is a transfer point
 */
export function isTransferStation(stationId: string): boolean {
  return MAJOR_INTERCHANGES.some(
    (interchange) => interchange.stationId === stationId
  );
}

/**
 * Get all lines that serve a station
 */
export function getLinesForStation(stationId: string): string[] {
  return metroLines
    .filter((line) => line.stations.includes(stationId))
    .map((line) => line.id);
}

export function getTransferStationsForLine(lineId: string): string[] {
  const line = metroLines.find((l) => l.id === lineId);
  if (!line) return [];

  return line.stations.filter((stationId) =>
    MAJOR_INTERCHANGES.some(
      (interchange) => interchange.stationId === stationId
    )
  );
}

export function getCommonStationCount(
  lineId1: string,
  lineId2: string
): number {
  const line1 = metroLines.find((line) => line.id === lineId1);
  const line2 = metroLines.find((line) => line.id === lineId2);

  if (!line1 || !line2) return 0;

  return line1.stations.filter((stationId) =>
    line2.stations.includes(stationId)
  ).length;
}

/**
 * Format schedule times
 */
export function formatScheduleTimes(
  schedule: { first?: string; last?: string } | undefined
): {
  firstTrain: string;
  lastTrain: string;
} {
  return {
    firstTrain: schedule?.first || '',
    lastTrain: schedule?.last || '',
  };
}

/**
 * Generate ticket costs object from a base cost
 */
export function generateTicketCosts(baseCost: number): {
  singleJourney: string;
} {
  return {
    singleJourney: `Rs. ${baseCost}`,
  };
}

/**
 * Get line name by ID
 */
export function getLineNameById(lineId: string): string {
  const line = metroLines.find((line) => line.id === lineId);
  return line ? line.name : lineId.toUpperCase();
}
