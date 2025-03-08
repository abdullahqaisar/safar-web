import { MetroLine } from '@/types/metro';
import { Coordinates, Station } from '@/types/station';
import { SpatialIndex } from '@/lib/utils/spatial-index';
import { metroLines } from '@/lib/constants/metro-data';
import { stationNetwork } from './station-network';

class StationService {
  private stations: Map<string, Station> = new Map();
  private stationLines: Map<string, MetroLine[]> = new Map();
  private spatialIndex: SpatialIndex<Station>;
  private initialized = false;

  constructor() {
    this.spatialIndex = new SpatialIndex<Station>();
  }

  initialize(): void {
    if (this.initialized) return;

    // Extract all stations first
    const allStations: Station[] = [];
    metroLines.forEach((line) => {
      line.stations.forEach((station) => {
        if (!this.stations.has(station.id)) {
          this.stations.set(station.id, station);
          allStations.push(station);
        }

        // Associate station with this line
        const lines = this.stationLines.get(station.id) || [];
        if (!lines.some((l) => l.id === line.id)) {
          lines.push(line);
          this.stationLines.set(station.id, lines);
        }
      });
    });

    // Add all stations to the spatial index at once
    this.spatialIndex.addAll(allStations);

    // Initialize the station network
    stationNetwork.initialize(metroLines);

    this.initialized = true;
  }

  getAllStations(): Station[] {
    this.ensureInitialized();
    return Array.from(this.stations.values());
  }

  findStationById(id: string): Station | undefined {
    this.ensureInitialized();
    return this.stations.get(id);
  }

  getLinesForStation(station: Station): MetroLine[] {
    this.ensureInitialized();
    return this.stationLines.get(station.id) || [];
  }

  getStationsBetween(
    line: MetroLine,
    fromStation: Station,
    toStation: Station
  ): Station[] {
    this.ensureInitialized();

    const lineStations = line.stations;
    const fromIndex = lineStations.findIndex((s) => s.id === fromStation.id);
    const toIndex = lineStations.findIndex((s) => s.id === toStation.id);

    if (fromIndex === -1 || toIndex === -1) return [];

    return fromIndex <= toIndex
      ? lineStations.slice(fromIndex, toIndex + 1)
      : lineStations.slice(toIndex, fromIndex + 1).reverse();
  }

  findAccessibleStations(
    location: Coordinates,
    count: number = 3,
    maxDistance: number,
    filter?: (station: Station) => boolean
  ): { station: Station; distance: number; lines: MetroLine[] }[] {
    this.ensureInitialized();

    // Apply filter first if provided to improve efficiency
    let effectiveCount = count;
    if (filter) {
      // Request more stations initially if we have a filter
      effectiveCount = Math.min(count * 3, 30);
    }

    // Find nearest stations using spatial index
    const results = this.spatialIndex.findNearest(
      location,
      effectiveCount,
      maxDistance
    );

    // If no results or all filtered out, try with a larger radius
    if (
      filter &&
      results.filter((result) => filter(result.item)).length === 0 &&
      results.length > 0
    ) {
      // Try with double the distance if there are stations but none pass the filter
      const expandedResults = this.spatialIndex.findNearest(
        location,
        effectiveCount,
        Math.min(maxDistance * 2, 10000) // Limit to 10km to avoid excessive search
      );

      const filteredExpanded = expandedResults.filter(
        (result) => !filter || filter(result.item)
      );

      if (filteredExpanded.length > 0) {
        // Return expanded results if we found matches
        return filteredExpanded.slice(0, count).map((result) => ({
          station: result.item,
          distance: result.distance,
          lines: this.getLinesForStation(result.item),
        }));
      }
    }

    // Filter and map to return format with lines info
    return results
      .filter((result) => !filter || filter(result.item))
      .slice(0, count)
      .map((result) => ({
        station: result.item,
        distance: result.distance,
        lines: this.getLinesForStation(result.item),
      }));
  }

  getConnectedStations(stationId: string): Station[] {
    this.ensureInitialized();
    const networkStation = stationNetwork.getStation(stationId);
    if (!networkStation) return [];

    return networkStation.connections.map((conn) => conn.to);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

// Export singleton instance
export const stationService = new StationService();
