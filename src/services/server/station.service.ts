import { point, distance } from '@turf/turf';
import KDBush from 'kdbush';
import { metroLines } from '@/lib/constants/metro-data';
import { Coordinates, Station, NearestStationResult } from '@/types/station';
import { MetroLine } from '@/types/metro';
import { SpatialIndex } from '@/lib/transit/station/spatial-index';
import { MAX_STATION_DISTANCE } from '@/lib/constants/config';

type StationPoint = {
  idx: number;
  lng: number;
  lat: number;
};

export class StationService {
  private stations: Map<string, Station> = new Map();
  private stationLines: Map<string, MetroLine[]> = new Map();
  private spatialIndex: SpatialIndex<Station> = new SpatialIndex();
  private stationsIndex: KDBush | null = null;
  private stationsArray: Station[] = [];
  private stationPoints: StationPoint[] = []; // Add to track points
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;

    // Clear any existing data
    this.stations.clear();
    this.stationLines.clear();
    this.spatialIndex.clear();
    this.stationsArray = [];
    this.stationPoints = [];

    // Process all metro lines and their stations
    for (const line of metroLines) {
      for (let i = 0; i < line.stations.length; i++) {
        const station = line.stations[i];

        if (!this.stations.has(station.id)) {
          this.stations.set(station.id, station);
          this.stationsArray.push(station);
          this.spatialIndex.add(station);
          this.stationLines.set(station.id, []);
        }

        // Associate line with station
        const lines = this.stationLines.get(station.id)!;
        if (!lines.some((l) => l.id === line.id)) {
          lines.push(line);
        }
      }
    }

    this.stationPoints = this.stationsArray.map((station, idx) => ({
      idx,
      lng: station.coordinates.lng,
      lat: station.coordinates.lat,
    }));

    this.stationsIndex = new KDBush(
      this.stationPoints.length, // Number of points (capacity)
      64 // Node size
    );

    // Add all points to the index
    for (let i = 0; i < this.stationPoints.length; i++) {
      this.stationsIndex.add(
        this.stationPoints[i].lng,
        this.stationPoints[i].lat
      );
    }

    // Build the index
    this.stationsIndex.finish();

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

  findNearestStationsUsingKDBush(
    location: Coordinates,
    count: number = 3,
    maxDistance: number = MAX_STATION_DISTANCE
  ): NearestStationResult[] {
    this.ensureInitialized();

    if (!location || !this.stationsIndex) return [];

    // Calculate bounding box
    const radiusInDegrees = maxDistance / 111320;
    const latRad = (location.lat * Math.PI) / 180;
    const lngRadius = radiusInDegrees / Math.cos(latRad);

    // Get indices within the bounding box
    const indices = this.stationsIndex.range(
      location.lng - lngRadius,
      location.lat - radiusInDegrees,
      location.lng + lngRadius,
      location.lat + radiusInDegrees
    );

    // Map indices to stations and calculate distances
    const results = indices
      .map((idx: number) => {
        // Use the idx to get the original station point's index
        const stationPoint = this.stationPoints[idx];
        // Then use that index to get the original station
        const station = this.stationsArray[stationPoint.idx];

        const distanceInMeters =
          distance(
            point([location.lng, location.lat]),
            point([station.coordinates.lng, station.coordinates.lat]),
            { units: 'kilometers' }
          ) * 1000; // Convert km to meters

        return {
          station,
          distance: distanceInMeters,
          lines: this.getLinesForStation(station),
        };
      })
      .filter((result) => result.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);

    return results;
  }

  findNearestStations(
    location: Coordinates,
    count: number = 3,
    maxDistance: number = MAX_STATION_DISTANCE,
    includeLines: boolean = true
  ): NearestStationResult[] {
    this.ensureInitialized();

    if (!location) return [];

    // Use KDBush for very fast nearest neighbors
    if (this.stationsIndex) {
      return this.findNearestStationsUsingKDBush(location, count, maxDistance);
    }

    // Fallback to spatial index if KDBush isn't initialized
    const nearestResults = this.spatialIndex.findNearest(
      location,
      count,
      maxDistance
    );

    return nearestResults.map(({ item: station, distance }) => ({
      station,
      distance,
      lines: includeLines ? this.getLinesForStation(station) : [],
    }));
  }

  findNearestStation(
    location: Coordinates,
    maxDistance: number = MAX_STATION_DISTANCE,
    includeLines: boolean = true
  ): NearestStationResult | null {
    this.ensureInitialized();

    if (!location) return null;

    const results = this.findNearestStations(
      location,
      1,
      maxDistance,
      includeLines
    );
    return results.length > 0 ? results[0] : null;
  }

  findAccessibleStations(
    location: Coordinates,
    count: number = 3,
    maxDistance: number = MAX_STATION_DISTANCE,
    includeLines: boolean = true,
    filter?: (station: Station) => boolean
  ): NearestStationResult[] {
    this.ensureInitialized();

    if (!location) return [];

    // Get twice as many stations as needed initially
    const candidates = this.findNearestStations(
      location,
      count * 2,
      maxDistance,
      includeLines
    );

    // Apply filter if needed
    const filtered = filter
      ? candidates.filter((result) => filter(result.station))
      : candidates;

    // If not enough results, try with larger distance
    if (filtered.length < count) {
      const expanded = this.findNearestStations(
        location,
        count * 3,
        maxDistance * 1.5,
        includeLines
      );

      const additionalFiltered = filter
        ? expanded.filter(
            (result) =>
              filter(result.station) &&
              !filtered.some((f) => f.station.id === result.station.id)
          )
        : expanded.filter(
            (result) =>
              !filtered.some((f) => f.station.id === result.station.id)
          );

      filtered.push(...additionalFiltered);
    }

    // Score stations using multiple factors
    const scored = filtered.map((result) => ({
      ...result,
      score: this.calculateStationScore(result),
    }));

    // Return highest scoring stations
    return scored.sort((a, b) => b.score - a.score).slice(0, count);
  }

  calculateStationScore(result: NearestStationResult): number {
    // Base distance factor - exponentially decreases as distance increases
    const distanceFactor = Math.exp(-result.distance / 500); // Rapidly decreases after 500m

    // Lines factor - diminishes in importance as distance increases
    // At close distances, more lines is very beneficial
    // At far distances, more lines is less important
    const lineCountValue = Math.min(result.lines.length, 5) / 5; // Cap at 5 lines
    const distanceWeight = Math.max(0, 1 - result.distance / 1500); // More weight when closer
    const lineFactor = lineCountValue * distanceWeight;

    // Combine factors - distance is primary, lines are secondary
    // Distance contributes 70% of the score, lines 30%
    return distanceFactor * 0.7 + lineFactor * 0.3;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

// Export singleton instance
export const stationService = new StationService();
