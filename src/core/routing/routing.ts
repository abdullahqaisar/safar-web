import { TransitGraph } from '../graph/graph';
import { Station, TransitLine } from '../types/graph';
import { RoutingResult } from '../types/route';
import { processRoutes, sortRoutesByTime } from '../utils/route-comparison';
import { discoverAllRoutes } from './route-discovery';

export class TransitRouter {
  private graph: TransitGraph;

  constructor(transitGraph: TransitGraph) {
    this.graph = transitGraph;
    console.log('[Router] Transit router initialized');
  }

  /**
   * Initialize the router with transit data
   */
  initialize(stations: Station[], lines: TransitLine[]): void {
    console.log(
      `[Router] Initializing router with ${stations.length} stations and ${lines.length} lines`
    );
    this.graph.initialize(stations, lines);
    console.log('[Router] Router initialization complete');
  }

  /**
   * Check if a station exists in the network
   */
  isValidStation(stationId: string): boolean {
    const isValid = !!this.graph.stations[stationId];
    console.log(
      `[Router] Station validation: ${stationId} - ${isValid ? 'Valid' : 'Invalid'}`
    );
    return isValid;
  }

  /**
   * Find optimal transit routes between two stations
   */
  findRoutes(originId: string, destinationId: string): RoutingResult {
    console.log(
      `[Router] Route request: ${originId} (${this.graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${this.graph.stations[destinationId]?.name || 'unknown'})`
    );

    // Edge case: Same origin and destination
    if (originId === destinationId) {
      console.log(
        `[Router] Error: Origin and destination are the same station (${originId})`
      );
      return {
        error: 'Origin and destination are the same station',
        code: 'SAME_STATION',
      };
    }

    // Edge case: Invalid stations
    if (!this.isValidStation(originId) || !this.isValidStation(destinationId)) {
      console.log(
        `[Router] Error: Invalid station ID provided (origin=${!!this.graph.stations[originId]}, destination=${!!this.graph.stations[destinationId]})`
      );
      return {
        error: 'Invalid station ID provided',
        code: 'INVALID_STATION',
      };
    }

    console.log(
      `[Router] Starting route discovery process for ${originId} to ${destinationId}`
    );

    // Discover all possible routes
    const allRoutes = discoverAllRoutes(this.graph, originId, destinationId);
    console.log(`[Router] Raw routes discovered: ${allRoutes.length}`);

    // Annotate each route with the requested origin
    allRoutes.forEach((route) => {
      route.requestedOrigin = originId;
    });

    // Process routes (filter, rank, optimize diversity) and ensure sorted by time
    const processedRoutes = processRoutes(allRoutes, this.graph);
    console.log(`[Router] Final processed routes: ${processedRoutes.length}`);

    // Log high-level details of final routes
    processedRoutes.forEach((route, idx) => {
      // Count walking transfers in the route
      const walkSegments = route.segments.filter(
        (segment) => segment.type === 'walk'
      );

      const hasWalkingTransfers = walkSegments.some((_, i) => {
        // Check if this walking segment is a transfer (not at start or end)
        const segmentIndex = route.segments.findIndex(
          (s) => s === walkSegments[i]
        );
        return segmentIndex > 0 && segmentIndex < route.segments.length - 1;
      });

      console.log(
        `[Router] Final route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}${hasWalkingTransfers ? ', USES WALKING TRANSFERS' : ''}`
      );

      if (walkSegments.length > 0) {
        walkSegments.forEach((segment, walkIdx) => {
          const segmentIndex = route.segments.findIndex((s) => s === segment);
          const isWalkingTransfer =
            segmentIndex > 0 && segmentIndex < route.segments.length - 1;

          console.log(
            `[Router] Final route #${idx + 1}, walking segment #${walkIdx + 1}: from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name} ${isWalkingTransfer ? '(TRANSFER)' : ''}`
          );
        });
      }

      // Count unique lines used
      const transitSegments = route.segments.filter(
        (segment) => segment.type === 'transit'
      );
      const uniqueLines = new Set(
        transitSegments.map((segment) => segment.line.id)
      );
      console.log(
        `[Router] Final route #${idx + 1} uses ${uniqueLines.size} unique transit lines: ${Array.from(uniqueLines).join(', ')}`
      );
    });

    // Final sort by time to guarantee ordering
    const finalRoutes = sortRoutesByTime(processedRoutes);
    console.log(
      `[Router] Route discovery complete, returning ${finalRoutes.length} routes`
    );
    return finalRoutes;
  }
}
