import { Station } from '../types/graph';
import { RouteStation } from '../types/route';
import { WALKING_MAX_DISTANCE } from './constants';
import { calculateDistance } from './geo-utils';
import { TransitGraph } from '../graph/graph';

/**
 * Find stations within walking distance of a given station
 */
export function findNearbyStations(
  stations: Record<string, Station>,
  station: Station
): Station[] {
  const nearbyStations: Station[] = [];

  Object.values(stations).forEach((otherStation) => {
    // Skip the same station
    if (otherStation.id === station.id) return;

    // Calculate distance
    const distance = calculateDistance(
      station.coordinates,
      otherStation.coordinates
    );

    // Check if within walking distance
    if (distance <= WALKING_MAX_DISTANCE) {
      nearbyStations.push(otherStation);
    }
  });

  // Sort by distance (closest first)
  return nearbyStations.sort((a, b) => {
    const distanceA = calculateDistance(station.coordinates, a.coordinates);
    const distanceB = calculateDistance(station.coordinates, b.coordinates);
    return distanceA - distanceB;
  });
}

/**
 * Check if two stations share any transit lines using the graph
 * Returns true if the stations share lines in a way that walking transfers wouldn't be beneficial
 */
export function haveCommonLines(
  station1: Station,
  station2: Station,
  graph: TransitGraph
): boolean {
  const lines1 = graph.getStationLines(station1.id);
  const lines2 = graph.getStationLines(station2.id);

  // Find common lines between the two stations
  const commonLines = lines1.filter((line) => lines2.includes(line));

  // Find unique lines for each station (lines that aren't shared)
  const uniqueLines1 = lines1.filter((line) => !lines2.includes(line));
  const uniqueLines2 = lines2.filter((line) => !lines1.includes(line));

  // If there are no common lines, walking transfer is definitely beneficial
  if (commonLines.length === 0) {
    return false;
  }

  // If both stations have unique lines (not shared with the other station),
  // then walking transfer might be beneficial despite common lines
  if (uniqueLines1.length > 0 && uniqueLines2.length > 0) {
    console.log(
      `[StationUtils] Allowing walking transfer between ${station1.name} and ${station2.name} despite common lines: ${commonLines.join(', ')}. ` +
        `${station1.name} has unique lines: ${uniqueLines1.join(', ')}. ` +
        `${station2.name} has unique lines: ${uniqueLines2.join(', ')}.`
    );
    return false;
  }

  // Calculate walking distance to determine if walking might be faster than transit
  const distance = calculateDistance(
    station1.coordinates,
    station2.coordinates
  );
  const VERY_SHORT_WALKING_DISTANCE = 300; // 300 meters is a very short walking distance

  // For very short distances, walking might be faster than waiting for transit on common lines
  if (distance <= VERY_SHORT_WALKING_DISTANCE) {
    console.log(
      `[StationUtils] Allowing walking transfer between ${station1.name} and ${station2.name} ` +
        `because walking distance (${Math.round(distance)}m) is very short, despite common lines.`
    );
    return false;
  }

  // Default case: stations share lines and walking wouldn't provide an advantage
  return true;
}

/**
 * Find common lines between two stations using the graph
 */
export function findCommonLines(
  station1: Station,
  station2: Station,
  graph: TransitGraph
): string[] {
  const lines1 = graph.getStationLines(station1.id);
  const lines2 = graph.getStationLines(station2.id);
  return lines1.filter((lineId) => lines2.includes(lineId));
}

/**
 * Convert station to RouteStation
 */
export function convertToRouteStation(station: {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
}): RouteStation {
  return {
    id: station.id,
    name: station.name,
    coordinates: station.coordinates,
  };
}
