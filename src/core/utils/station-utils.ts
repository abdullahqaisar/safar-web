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
 */
export function haveCommonLines(
  station1: Station,
  station2: Station,
  graph: TransitGraph
): boolean {
  const lines1 = graph.getStationLines(station1.id);
  const lines2 = graph.getStationLines(station2.id);
  return lines1.some((line) => lines2.includes(line));
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
