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

/**
 * Coordinates the discovery of all possible routes between origin and destination
 */
export function discoverAllRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route[] {
  // Direct transit routes (Phase A)
  const directRoutes = findDirectRoutes(graph, originId, destinationId);

  // Transfer routes (Phase B)
  const transferRoutes = findTransferRoutes(graph, originId, destinationId);

  // Combine transit routes
  const transitRoutes = [...directRoutes, ...transferRoutes];

  // Walking routes (Phase C)
  const walkingRoutes = discoverWalkingRoutes(
    graph,
    originId,
    destinationId,
    transitRoutes
  );

  // Combine all routes
  return [...transitRoutes, ...walkingRoutes];
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
