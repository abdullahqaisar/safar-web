import { TransitGraph } from '../graph/graph';
import { Route } from '../types/route';
import { WALKING_MAX_DISTANCE } from '../utils/constants';
import { calculateDistance } from '../utils/geo-utils';
import { findDirectRoutes } from './direct-route';
import { findTransferRoutes } from './transfer-route';
import {
  findDirectWalkingRoute as findDirectWalk,
  createInitialWalkingRoutes,
  createFinalWalkingRoutes,
  createWalkingTransferRoutes,
} from './walking-route';
import { validateAndOptimizeRoutes } from './route-validator';
import { consolidateRoutesByPath } from '../utils/route-signature';
import { filterIrrationalRoutes } from './route-rationalization';

// Direct route quality threshold - how much better a transfer route must be to be included
const DIRECT_ROUTE_QUALITY_THRESHOLD = 0.15; // 15% improvement needed

/**
 * Coordinates the discovery of all possible routes between origin and destination
 */
export function discoverAllRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route[] {
  // Phase A: Direct transit routes
  let directRoutes = findDirectRoutes(graph, originId, destinationId);
  directRoutes = validateAndOptimizeRoutes(directRoutes);

  // If we have good direct routes, we'll use them as a baseline for deciding
  // whether to explore transfer routes
  if (directRoutes.length > 0) {
    // Get the fastest direct route duration as benchmark
    const fastestDirectDuration = Math.min(
      ...directRoutes.map((route) => route.totalDuration)
    );

    // Calculate minimum improvement threshold for transfer routes
    const durationThreshold =
      fastestDirectDuration * (1 - DIRECT_ROUTE_QUALITY_THRESHOLD);

    // Phase B: Transfer routes - only if they might provide significantly better options
    let transferRoutes = findTransferRoutes(
      graph,
      originId,
      destinationId,
      // Pass duration threshold as an optional parameter
      undefined,
      durationThreshold
    );

    // If we found any transfer routes, validate and filter them
    if (transferRoutes.length > 0) {
      transferRoutes = validateAndOptimizeRoutes(transferRoutes);
      transferRoutes = filterIrrationalRoutes(
        transferRoutes,
        graph,
        destinationId
      );
      transferRoutes = consolidateRoutesByPath(transferRoutes);

      // After filtering, check if any transfer routes are actually better than direct routes
      transferRoutes = transferRoutes.filter((transfer) => {
        // Only keep transfer routes that offer significant improvement over direct routes
        return transfer.totalDuration < durationThreshold;
      });
    }

    // Combine direct and any remaining superior transfer routes
    const transitRoutes = [...directRoutes, ...transferRoutes];

    // Rest of function remains the same
    // Phase C: Walking routes
    let walkingRoutes = discoverWalkingRoutes(
      graph,
      originId,
      destinationId,
      transitRoutes
    );
    walkingRoutes = validateAndOptimizeRoutes(walkingRoutes);
    walkingRoutes = filterIrrationalRoutes(walkingRoutes, graph, destinationId);

    // Final processing
    let allRoutes = [...transitRoutes, ...walkingRoutes];
    allRoutes = validateAndOptimizeRoutes(allRoutes);
    allRoutes = filterIrrationalRoutes(allRoutes, graph, destinationId);
    allRoutes = consolidateRoutesByPath(allRoutes);

    return allRoutes;
  } else {
    // No direct routes available - continue with normal multi-modal discovery

    // Phase B: Transfer routes
    let transferRoutes = findTransferRoutes(graph, originId, destinationId);
    transferRoutes = validateAndOptimizeRoutes(transferRoutes);
    transferRoutes = filterIrrationalRoutes(
      transferRoutes,
      graph,
      destinationId
    );
    transferRoutes = consolidateRoutesByPath(transferRoutes);

    // Combine transit routes
    const transitRoutes = [...directRoutes, ...transferRoutes];

    // Rest of function remains unchanged
    let walkingRoutes = discoverWalkingRoutes(
      graph,
      originId,
      destinationId,
      transitRoutes
    );
    walkingRoutes = validateAndOptimizeRoutes(walkingRoutes);
    walkingRoutes = filterIrrationalRoutes(walkingRoutes, graph, destinationId);

    let allRoutes = [...transitRoutes, ...walkingRoutes];
    allRoutes = validateAndOptimizeRoutes(allRoutes);
    allRoutes = filterIrrationalRoutes(allRoutes, graph, destinationId);
    allRoutes = consolidateRoutesByPath(allRoutes);

    return allRoutes;
  }
}

/**
 * Coordinates the discovery of walking-integrated routes
 */
function discoverWalkingRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string,
  existingRoutes: Route[] = []
): Route[] {
  // Try direct walking route first (simplest case)
  const directWalkingRoute = findDirectWalk(graph, originId, destinationId);

  // If stations are very close, prioritize walking
  if (directWalkingRoute) {
    const origin = graph.stations[originId];
    const destination = graph.stations[destinationId];
    const distance = calculateDistance(
      origin.coordinates,
      destination.coordinates
    );

    // If walking distance is very short, just return the walking route
    if (distance <= WALKING_MAX_DISTANCE * 0.5) {
      return [directWalkingRoute];
    }
  }

  // Start with direct walking if available
  let walkingRoutes: Route[] = directWalkingRoute ? [directWalkingRoute] : [];

  // Find routes with initial walking segment
  const initialWalkingRoutes = createInitialWalkingRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  walkingRoutes = [...walkingRoutes, ...initialWalkingRoutes];

  // Find routes with final walking segment
  const finalWalkingRoutes = createFinalWalkingRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  walkingRoutes = [...walkingRoutes, ...finalWalkingRoutes];

  // Find routes with walking transfers
  const walkingTransferRoutes = createWalkingTransferRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  walkingRoutes = [...walkingRoutes, ...walkingTransferRoutes];

  return walkingRoutes;
}
