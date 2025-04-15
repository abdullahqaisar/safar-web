import { Coordinates, Station } from '../types/graph';
import { calculateDistance } from '../utils/geo-utils';
import { TransitGraph } from '../graph/graph';
import { AccessRecommendation, AccessType } from '../types/route';

// Very large search radius (10km) to find stations even for users far from any station
const MAX_SEARCH_RADIUS = 10000; // meters

// Distance threshold for recommending walking vs public transport
const WALKING_DISTANCE_THRESHOLD = 500; // meters

/**
 * Find the nearest station ID from a set of coordinates
 * @param coordinates The user's current coordinates
 * @param graph The transit graph containing all stations
 * @param maxDistance Maximum search distance in meters (defaults to 10km)
 * @returns The ID of the nearest station or null if none found within range
 */
export function findNearestStationID(
  coordinates: Coordinates,
  graph: TransitGraph,
  maxDistance: number = MAX_SEARCH_RADIUS
): string | null {
  // Get all stations
  const stations = Object.values(graph.stations);

  if (stations.length === 0) {
    return null;
  }

  // Calculate distances to all stations
  const stationsWithDistance = stations.map((station) => {
    const distance = calculateDistance(coordinates, station.coordinates);
    return { station, distance };
  });

  // Sort by distance (closest first)
  stationsWithDistance.sort((a, b) => a.distance - b.distance);

  // Find the closest station within the maximum distance
  const closest = stationsWithDistance[0];

  // If closest station is within range, return its ID
  if (closest.distance <= maxDistance) {
    return closest.station.id;
  }

  // No station found within range
  return null;
}

/**
 * Find all stations within a certain distance of a point
 * @param coordinates The center point coordinates
 * @param graph The transit graph containing all stations
 * @param maxDistance Maximum search distance in meters (default 5km)
 * @returns Array of stations ordered by distance
 */
export function findNearbyStations(
  coordinates: Coordinates,
  graph: TransitGraph,
  maxDistance: number = 5000
): Station[] {
  // Get all stations
  const stations = Object.values(graph.stations);

  // Calculate distances and filter by max distance
  const nearbyStations = stations
    .map((station) => {
      const distance = calculateDistance(coordinates, station.coordinates);
      return { station, distance };
    })
    .filter((item) => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.station);

  return nearbyStations;
}

/**
 * Find multiple nearest stations to provide options to the user
 * @param coordinates The user's coordinates
 * @param graph The transit graph
 * @param count Number of stations to return
 * @param maxDistance Maximum search distance in meters
 * @returns Array of nearest stations with their distances
 */
export function findMultipleNearestStations(
  coordinates: Coordinates,
  graph: TransitGraph,
  count: number = 3,
  maxDistance: number = MAX_SEARCH_RADIUS
): Array<{ station: Station; distance: number }> {
  // Get all stations
  const stations = Object.values(graph.stations);

  if (stations.length === 0) {
    return [];
  }

  // Calculate distances to all stations
  const stationsWithDistance = stations
    .map((station) => {
      const distance = calculateDistance(coordinates, station.coordinates);
      return { station, distance };
    })
    .filter((item) => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  // Return the requested number of stations (or fewer if not enough available)
  return stationsWithDistance.slice(0, count);
}

/**
 * Determine if coordinates are within walking distance of any station
 */
export function isWithinWalkingDistanceOfStation(
  coordinates: Coordinates,
  graph: TransitGraph,
  walkingDistance: number = 500
): boolean {
  const nearestStation = findNearestStationID(
    coordinates,
    graph,
    walkingDistance
  );
  return nearestStation !== null;
}

/**
 * Get the distance to the nearest station and recommend whether to walk or take public transport
 * @param coordinates User coordinates
 * @param graph Transit graph
 * @param stationId Optional specific station ID to calculate distance to
 * @returns Access recommendation with distance and recommendation type, or null if distance is very short
 */
export function getAccessRecommendation(
  coordinates: Coordinates,
  graph: TransitGraph,
  stationId?: string
): AccessRecommendation | null {
  let distance: number;

  if (stationId) {
    // Calculate distance to the specified station
    const station = graph.stations[stationId];
    if (!station) return null;

    distance = calculateDistance(coordinates, station.coordinates);
  } else {
    // Find nearest station and its distance
    const nearestStations = findMultipleNearestStations(coordinates, graph, 1);
    if (nearestStations.length === 0) return null;

    distance = nearestStations[0].distance;
  }

  // Skip recommendation if distance is very short (less than 50 meters)
  if (distance <= 50) {
    return null;
  }

  // Determine recommendation type based on distance threshold
  const accessType: AccessType =
    distance <= WALKING_DISTANCE_THRESHOLD ? 'walk' : 'public_transport';

  return {
    type: accessType,
    distance: Math.round(distance),
  };
}
