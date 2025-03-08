import { MetroLine } from '@/types/metro';
import { Station } from '@/types/station';
import { metroLines } from '@/lib/constants/metro-data';
import { calculateHaversineDistance } from '@/lib/utils/geo';

export interface NetworkStation {
  station: Station;
  connections: NetworkConnection[];
  lines: MetroLine[];
}

export interface NetworkConnection {
  to: Station;
  line: MetroLine;
  distance: number;
  duration: number;
  stops: number;
}

export class StationNetwork {
  private stations: Map<string, NetworkStation> = new Map();
  private initialized = false;

  constructor(private metroLines: MetroLine[] = []) {}

  initialize(lines: MetroLine[] = this.metroLines): void {
    if (this.initialized) return;

    // Build stations map
    lines.forEach((line) => {
      line.stations.forEach((station, i) => {
        const networkStation = this.getOrCreateNetworkStation(station);

        // Add line to the station's lines if not already there
        if (!networkStation.lines.some((l) => l.id === line.id)) {
          networkStation.lines.push(line);
        }

        // Connect to next station if it exists
        if (i < line.stations.length - 1) {
          const nextStation = line.stations[i + 1];
          const distance = calculateHaversineDistance(
            station.coordinates,
            nextStation.coordinates
          );
          const duration = this.estimateTravelTime(distance);

          // Add connection
          networkStation.connections.push({
            to: nextStation,
            line,
            distance,
            duration,
            stops: 1,
          });
        }

        // Connect to previous station if it exists
        if (i > 0) {
          const prevStation = line.stations[i - 1];
          const distance = calculateHaversineDistance(
            station.coordinates,
            prevStation.coordinates
          );
          const duration = this.estimateTravelTime(distance);

          // Add connection
          networkStation.connections.push({
            to: prevStation,
            line,
            distance,
            duration,
            stops: 1,
          });
        }
      });
    });

    this.initialized = true;
  }

  /**
   * Get a network station by ID
   */
  getStation(stationId: string): NetworkStation | undefined {
    return this.stations.get(stationId);
  }

  /**
   * Get all stations in the network
   */
  getAllStations(): NetworkStation[] {
    return Array.from(this.stations.values());
  }

  /**
   * Get station connections by station ID
   */
  getStationConnections(stationId: string): NetworkConnection[] {
    const station = this.stations.get(stationId);
    return station ? station.connections : [];
  }

  /**
   * Estimate travel time based on distance
   */
  private estimateTravelTime(distanceMeters: number): number {
    // Assume average speed of 10 m/s (36 km/h) with station stops
    return Math.ceil(distanceMeters / 10);
  }

  /**
   * Get or create a network station
   */
  private getOrCreateNetworkStation(station: Station): NetworkStation {
    const existing = this.stations.get(station.id);
    if (existing) return existing;

    const networkStation: NetworkStation = {
      station,
      connections: [],
      lines: [],
    };

    this.stations.set(station.id, networkStation);
    return networkStation;
  }
}

// Create and export the network singleton
export const stationNetwork = new StationNetwork(metroLines);
