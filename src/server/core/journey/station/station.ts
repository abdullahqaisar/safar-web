import { Coordinates, Station, Interchange } from '@/types/station';
import { MAX_STATION_DISTANCE } from '@/lib/constants/config';
import { calculateDistanceSync } from '@/server/core/shared/distance';
import { metroLines, MAJOR_INTERCHANGES } from '@/lib/constants/metro-data';
import Graph from 'graphology';
import { EdgeData, NodeData } from '../route/graph';
import { SpatialIndex } from './spatial-index';

/**
 * Comprehensive manager for all station-related operations
 */
class StationManager {
  private stations: Map<string, Station> = new Map();
  private stationsById: Map<string, Station> = new Map();
  private stationsByName: Map<string, Station[]> = new Map();
  private linesByStation: Map<string, string[]> = new Map();
  private spatialIndex: SpatialIndex<Station>;
  private initialized: boolean = false;

  constructor() {
    this.spatialIndex = new SpatialIndex<Station>();
    this.initialize();
  }

  /**
   * Initialize all station data structures
   */
  initialize(): void {
    if (this.initialized) return;

    // Build lookup tables for stations
    for (const line of metroLines) {
      for (const station of line.stations) {
        // Add to stations map
        this.stations.set(station.id, station);

        // Add to stationsById map
        this.stationsById.set(station.id, station);

        // Add to stationsByName map
        if (!this.stationsByName.has(station.name)) {
          this.stationsByName.set(station.name, []);
        }
        this.stationsByName.get(station.name)?.push(station);

        // Track lines by station
        if (!this.linesByStation.has(station.id)) {
          this.linesByStation.set(station.id, []);
        }
        this.linesByStation.get(station.id)?.push(line.id);
      }
    }

    // Initialize spatial index
    this.spatialIndex.addAll(Array.from(this.stations.values()));

    this.initialized = true;
  }

  /**
   * Find a station by ID or return the station object if already provided
   */
  findStation(id: string | Station): Station | undefined {
    if (typeof id !== 'string') {
      return id;
    }
    return this.stationsById.get(id);
  }

  /**
   * Find a station by ID
   */
  findStationById(id: string): Station | null {
    return this.stationsById.get(id) || null;
  }

  /**
   * Find stations by name
   */
  findStationsByName(name: string): Station[] {
    return this.stationsByName.get(name) || [];
  }

  /**
   * Get all stations in the system
   */
  findAllStations(): Station[] {
    return Array.from(this.stationsById.values());
  }

  /**
   * Get lines that serve a specific station
   */
  getStationLines(stationId: string): string[] {
    return this.linesByStation.get(stationId) || [];
  }

  /**
   * Get all metro lines
   */
  getMetroLines(): typeof metroLines {
    return metroLines;
  }

  /**
   * Find the nearest station to a location
   */
  async findNearestStation(
    location: Coordinates,
    maxDistance = MAX_STATION_DISTANCE,
    includeLines = true,
    filter?: (station: Station) => boolean
  ): Promise<{ station: Station; distance: number; lines?: string[] } | null> {
    if (!location) return null;

    // Find nearest stations
    const nearbyStations = this.findNearestStations(
      location,
      1,
      maxDistance,
      includeLines,
      filter
    );

    // If no stations found or filtered out
    if (nearbyStations.length === 0) return null;

    return nearbyStations[0];
  }

  /**
   * Find the nearest stations to a location
   */
  findNearestStations(
    location: Coordinates,
    n: number = 3,
    maxDistance: number = MAX_STATION_DISTANCE,
    includeLines: boolean = true,
    filter?: (station: Station) => boolean
  ): Array<{ station: Station; distance: number; lines?: string[] }> {
    if (!location) return [];

    // Use spatial index for efficient proximity search
    const nearestResults = this.spatialIndex.findNearest(
      location,
      n * 2,
      maxDistance
    );

    // Apply filter if provided
    const filtered = filter
      ? nearestResults.filter((item) => filter(item.item))
      : nearestResults;

    // Convert to expected format and include lines if requested
    const results = filtered.slice(0, n).map((result) => {
      const station = result.item;
      const lines = includeLines ? this.getStationLines(station.id) : undefined;

      return {
        station,
        distance: result.distance,
        ...(includeLines ? { lines } : {}),
      };
    });

    return results;
  }

  /**
   * Find nearest stations to a given location in the provided graph
   */
  findNearestStationsToGraph(
    location: Coordinates,
    graph: Graph<NodeData, EdgeData>,
    limit: number = 10
  ): { id: string; distance: number }[] {
    return Array.from(graph.nodes())
      .filter(
        (id) => !id.includes('_') && id !== 'origin' && id !== 'destination'
      )
      .map((id) => {
        const station = graph.getNodeAttributes(id).station;
        const distance = calculateDistanceSync(location, station.coordinates);
        return { id, distance, station };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ id, distance }) => ({ id, distance }));
  }

  /**
   * Find all stations distances from origin and destination
   */
  findStationDistances(
    origin: Coordinates,
    destination: Coordinates
  ): {
    originDistances: { station: Station; distance: number }[];
    destinationDistances: { station: Station; distance: number }[];
    closestOriginStation: Station;
    closestDestStation: Station;
  } {
    const allStations = this.findAllStations();
    let minOriginDistance = Infinity;
    let minDestDistance = Infinity;
    let closestOriginStation = allStations[0];
    let closestDestStation = allStations[0];

    const originDistances = allStations.map((station) => {
      const distance = calculateDistanceSync(origin, station.coordinates);
      if (distance < minOriginDistance) {
        minOriginDistance = distance;
        closestOriginStation = station;
      }
      return { station, distance };
    });

    const destinationDistances = allStations.map((station) => {
      const distance = calculateDistanceSync(destination, station.coordinates);
      if (distance < minDestDistance) {
        minDestDistance = distance;
        closestDestStation = station;
      }
      return { station, distance };
    });

    originDistances.sort((a, b) => a.distance - b.distance);
    destinationDistances.sort((a, b) => a.distance - b.distance);

    return {
      originDistances,
      destinationDistances,
      closestOriginStation,
      closestDestStation,
    };
  }

  /**
   * Find stations accessible from a location within a given distance
   */
  findAccessibleStations(
    location: Coordinates,
    n: number = 3,
    maxDistance: number = MAX_STATION_DISTANCE,
    includeLines: boolean = true,
    filter?: (station: Station) => boolean
  ) {
    return this.findNearestStations(
      location,
      n,
      maxDistance,
      includeLines,
      filter
    );
  }

  /**
   * Check if a station is a major interchange between specified lines
   */
  isMajorInterchange(stationId: string, lines?: string[]): boolean {
    const interchange = MAJOR_INTERCHANGES.find(
      (i) => i.stationId === stationId
    );
    if (!interchange) return false;

    // If lines are specified, check if this interchange connects those lines
    if (lines && lines.length > 0) {
      return lines.every((line) => interchange.lines.includes(line));
    }

    return true;
  }

  /**
   * Get interchange details for a station if it's a major interchange
   */
  getInterchangeDetails(stationId: string): Interchange | null {
    return MAJOR_INTERCHANGES.find((i) => i.stationId === stationId) || null;
  }
}

// Create and export singleton instance
export const stationManager = new StationManager();

// For backwards compatibility
export function findStation(id: string | Station): Station | undefined {
  return stationManager.findStation(id);
}

export function findStationById(id: string): Station | null {
  return stationManager.findStationById(id);
}

export function getStationLines(stationId: string): string[] {
  return stationManager.getStationLines(stationId);
}

export async function findNearestStation(
  location: Coordinates,
  maxDistance = MAX_STATION_DISTANCE,
  includeLines = true,
  filter?: (station: Station) => boolean
) {
  return stationManager.findNearestStation(
    location,
    maxDistance,
    includeLines,
    filter
  );
}

export function findNearestStations(
  location: Coordinates,
  n: number = 3,
  maxDistance: number = MAX_STATION_DISTANCE,
  includeLines: boolean = true,
  filter?: (station: Station) => boolean
) {
  return stationManager.findNearestStations(
    location,
    n,
    maxDistance,
    includeLines,
    filter
  );
}

export function getAllStations(): Station[] {
  return stationManager.findAllStations();
}

// Export interchanges functions for backward compatibility
export function isMajorInterchange(
  stationId: string,
  lines?: string[]
): boolean {
  return stationManager.isMajorInterchange(stationId, lines);
}

export function getInterchangeDetails(stationId: string): Interchange | null {
  return stationManager.getInterchangeDetails(stationId);
}
