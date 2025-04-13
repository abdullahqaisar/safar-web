import { TransitGraph } from '../graph/graph';
import { Station, TransitLine } from '../types/graph';
import { RoutingResult } from '../types/route';
import { processRoutes, sortRoutesByTime } from '../utils/route-comparison';
import { discoverAllRoutes } from './route-discovery';

export class TransitRouter {
  private graph: TransitGraph;

  constructor(transitGraph: TransitGraph) {
    this.graph = transitGraph;
  }

  /**
   * Initialize the router with transit data
   */
  initialize(stations: Station[], lines: TransitLine[]): void {
    this.graph.initialize(stations, lines);
  }

  /**
   * Check if a station exists in the network
   */
  isValidStation(stationId: string): boolean {
    return !!this.graph.stations[stationId];
  }

  /**
   * Find optimal transit routes between two stations
   */
  findRoutes(originId: string, destinationId: string): RoutingResult {
    // Edge case: Same origin and destination
    if (originId === destinationId) {
      return {
        error: 'Origin and destination are the same station',
        code: 'SAME_STATION',
      };
    }

    // Edge case: Invalid stations
    if (!this.isValidStation(originId) || !this.isValidStation(destinationId)) {
      return {
        error: 'Invalid station ID provided',
        code: 'INVALID_STATION',
      };
    }

    // Discover all possible routes
    const allRoutes = discoverAllRoutes(this.graph, originId, destinationId);

    // Annotate each route with the requested origin
    allRoutes.forEach((route) => {
      route.requestedOrigin = originId;
    });

    // Process routes (filter, rank, optimize diversity) and ensure sorted by time
    const processedRoutes = processRoutes(allRoutes, this.graph);

    // Final sort by time to guarantee ordering
    return sortRoutesByTime(processedRoutes);
  }
}
