import { TransitGraph } from '../../graph/graph';
import { Station, TransitLine } from '../../types/graph';
import { Route } from '../../types/route';
import { calculateDistance } from '../../utils/geo-utils';
import { INTERCHANGE_WALKING_TIME } from '../../utils/constants';
import { createRoute } from '../../utils/route-builder';
import { createSegmentBetweenStations, findCommonStations } from './utils';
import { TransferOption } from './types';

/**
 * Find routes requiring exactly one transfer between lines
 * 
 * This is an optimized algorithm for the common case of single-transfer routes
 */
export function findSingleTransferRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  durationThreshold?: number
): Route[] {
  const routes: Route[] = [];

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return routes;
  }

  // Get all lines for origin and destination
  const originLines = graph.getStationLines(originId);
  const destinationLines = graph.getStationLines(destinationId);
  
  if (originLines.length === 0 || destinationLines.length === 0) {
    return routes;
  }

  // Track line pairs to avoid duplicate strategies
  const processedLinePairs = new Map<string, Route>();

  // For each origin line
  originLines.forEach((originLineId) => {
    // For each destination line
    destinationLines.forEach((destLineId) => {
      // Skip if lines are the same (would be a direct route)
      if (originLineId === destLineId) {
        return;
      }

      const originLine = graph.lines[originLineId];
      const destLine = graph.lines[destLineId];

      if (!originLine || !destLine) return;

      // Create unique key for this line pair
      const linePairKey = `${originLineId}|${destLineId}`;

      // Skip if we already processed this line pair
      if (processedLinePairs.has(linePairKey)) return;

      // Find common interchange stations between these lines
      const transferStations = findCommonStations(
        [originLineId, destLineId],
        graph
      );

      // If no transfer stations, skip
      if (transferStations.length === 0) {
        return;
      }

      // Find the best transfer option for this line pair
      const bestRoute = findBestTransferOption(
        graph,
        originLine,
        destLine,
        originId,
        destinationId,
        transferStations
      );

      // If we found a valid route, add it to our processed pairs
      if (bestRoute) {
        // Only add if it passes the duration threshold check (if specified)
        if (durationThreshold && bestRoute.totalDuration >= durationThreshold) {
          return;
        }

        processedLinePairs.set(linePairKey, bestRoute);
        routes.push(bestRoute);
      }
    });
  });

  return routes;
}

/**
 * Find the best transfer option among multiple possible transfer stations
 * for the same pair of lines
 *
 * This function evaluates all potential transfer stations between two lines
 * and selects the optimal one based on multiple factors including:
 * - Total journey time
 * - Transfer station quality
 * - Platform distance at transfer stations
 * - Position of transfer station relative to origin and destination
 */
export function findBestTransferOption(
  graph: TransitGraph,
  originLine: TransitLine,
  destLine: TransitLine,
  originId: string,
  destinationId: string,
  transferStations: Station[]
): Route | null {
  const transferOptions: TransferOption[] = [];

  // Get origin and destination stations for distance calculations
  const originStation = graph.stations[originId];
  const destinationStation = graph.stations[destinationId];

  if (!originStation || !destinationStation) {
    return null;
  }

  // Calculate direct distance from origin to destination for reference
  const directDistance = calculateDistance(
    originStation.coordinates,
    destinationStation.coordinates
  );

  // For each potential transfer station
  transferStations.forEach((transferStation) => {
    // Skip if transfer station is the origin or destination
    if (transferStation.id === originId || transferStation.id === destinationId)
      return;

    // Create route segments
    const firstSegment = createSegmentBetweenStations(
      graph,
      originLine,
      originId,
      transferStation.id
    );

    const secondSegment = createSegmentBetweenStations(
      graph,
      destLine,
      transferStation.id,
      destinationId
    );

    // Skip if either segment couldn't be created
    if (!firstSegment || !secondSegment) return;

    // Calculate transfer time - use standard interchange time
    const transferTime = INTERCHANGE_WALKING_TIME;

    // Adjust second segment duration to include transfer time
    secondSegment.duration += transferTime;

    // Create complete route
    try {
      const route = createRoute([firstSegment, secondSegment]);

      // Calculate a score for this transfer option based on multiple factors
      let score = route.totalDuration; // Base score is the total duration

      // Factor 1: Position of transfer station relative to journey
      // Calculate how much of a detour this transfer represents
      const transferDistance = calculateDistance(
        originStation.coordinates,
        transferStation.coordinates
      ) + calculateDistance(
        transferStation.coordinates,
        destinationStation.coordinates
      );

      const detourFactor = transferDistance / directDistance;
      // Penalize transfers that represent significant detours
      if (detourFactor > 1.5) {
        score += (detourFactor - 1.5) * 300; // Add 300 seconds per 1.0 detour factor above 1.5
      }

      // Factor 2: Transfer station quality
      // Check if this is a major interchange (preferred for transfers)
      const isMajorInterchange = graph.interchangePoints.includes(transferStation.id);
      if (isMajorInterchange) {
        score -= 60; // Reduce score by 60 seconds (prefer major interchanges)
      }

      // Factor 3: Number of lines at transfer station (more lines = better transfer options)
      const transferStationLines = graph.getStationLines(transferStation.id);
      if (transferStationLines.length > 2) {
        score -= (transferStationLines.length - 2) * 20; // 20 seconds bonus per additional line
      }

      // Add this option to our list
      transferOptions.push({
        route,
        score,
        transferStationId: transferStation.id
      });

    } catch {
      // Skip this option if route creation fails
    }
  });

  // If no valid options, return null
  if (transferOptions.length === 0) return null;

  // Sort options by score (lower is better)
  transferOptions.sort((a, b) => a.score - b.score);

  // Return the route with the best score
  return transferOptions[0].route;
} 