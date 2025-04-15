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
  const originStation = graph.stations[originId];
  const destinationStation = graph.stations[destinationId];

  console.log(
    `[Discovery] Starting route discovery from ${originId} (${originStation?.name || 'unknown'}) to ${destinationId} (${destinationStation?.name || 'unknown'})`
  );

  // Phase A: Direct transit routes
  let directRoutes = findDirectRoutes(graph, originId, destinationId);
  console.log(`[Discovery] Found ${directRoutes.length} direct routes`);

  // Log details of each direct route
  directRoutes.forEach((route, idx) => {
    console.log(
      `[Discovery] Direct route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
    );
    if (route.segments.length > 0 && route.segments[0].type === 'transit') {
      console.log(
        `[Discovery] Direct route #${idx + 1} uses line: ${route.segments[0].line.id} (${route.segments[0].line.name})`
      );
    }
  });

  directRoutes = validateAndOptimizeRoutes(directRoutes);
  console.log(
    `[Discovery] After validation: ${directRoutes.length} direct routes remain`
  );

  // If we have good direct routes, we'll use them as a baseline for deciding
  // whether to explore transfer routes
  if (directRoutes.length > 0) {
    // Get the fastest direct route duration as benchmark
    const fastestDirectDuration = Math.min(
      ...directRoutes.map((route) => route.totalDuration)
    );
    console.log(
      `[Discovery] Fastest direct route duration: ${fastestDirectDuration}s`
    );

    // Calculate minimum improvement threshold for transfer routes
    const durationThreshold =
      fastestDirectDuration * (1 - DIRECT_ROUTE_QUALITY_THRESHOLD);
    console.log(
      `[Discovery] Transfer route threshold: ${durationThreshold}s (must be at least ${DIRECT_ROUTE_QUALITY_THRESHOLD * 100}% faster)`
    );

    // Phase B: Transfer routes - only if they might provide significantly better options
    let transferRoutes = findTransferRoutes(
      graph,
      originId,
      destinationId,
      // Pass duration threshold as an optional parameter
      undefined,
      durationThreshold
    );
    console.log(`[Discovery] Found ${transferRoutes.length} transfer routes`);

    // Log details of each transfer route
    transferRoutes.forEach((route, idx) => {
      console.log(
        `[Discovery] Transfer route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
      );
      route.segments.forEach((segment, segIdx) => {
        if (segment.type === 'transit') {
          console.log(
            `[Discovery] Transfer route #${idx + 1}, segment #${segIdx + 1}: Line ${segment.line.id} (${segment.line.name})`
          );
        } else if (segment.type === 'walk') {
          console.log(
            `[Discovery] Transfer route #${idx + 1}, segment #${segIdx + 1}: Walk from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name}, distance=${segment.walkingDistance}m`
          );
        }
      });
    });

    // If we found any transfer routes, validate and filter them
    if (transferRoutes.length > 0) {
      transferRoutes = validateAndOptimizeRoutes(transferRoutes);
      console.log(
        `[Discovery] After validation: ${transferRoutes.length} transfer routes remain`
      );

      transferRoutes = filterIrrationalRoutes(
        transferRoutes,
        graph,
        destinationId
      );
      console.log(
        `[Discovery] After rationality filter: ${transferRoutes.length} transfer routes remain`
      );

      transferRoutes = consolidateRoutesByPath(transferRoutes);
      console.log(
        `[Discovery] After consolidation: ${transferRoutes.length} transfer routes remain`
      );

      // After filtering, check if any transfer routes are actually better than direct routes
      const initialCount = transferRoutes.length;
      transferRoutes = transferRoutes.filter((transfer) => {
        // Only keep transfer routes that offer significant improvement over direct routes
        const isBetter = transfer.totalDuration < durationThreshold;
        if (!isBetter) {
          console.log(
            `[Discovery] Filtering out transfer route ${transfer.id} (duration: ${transfer.totalDuration}s) because it's not significantly better than direct routes (threshold: ${durationThreshold}s)`
          );
        }
        return isBetter;
      });
      console.log(
        `[Discovery] After duration threshold filter: ${transferRoutes.length}/${initialCount} transfer routes remain`
      );
    }

    // Combine direct and any remaining superior transfer routes
    const transitRoutes = [...directRoutes, ...transferRoutes];
    console.log(`[Discovery] Combined ${transitRoutes.length} transit routes`);

    // Phase C: Walking routes
    console.log(`[Discovery] Starting walking routes discovery`);
    let walkingRoutes = discoverWalkingRoutes(
      graph,
      originId,
      destinationId,
      transitRoutes
    );
    console.log(`[Discovery] Found ${walkingRoutes.length} walking routes`);

    // Log details of each walking route
    walkingRoutes.forEach((route, idx) => {
      console.log(
        `[Discovery] Walking route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
      );
      route.segments.forEach((segment, segIdx) => {
        if (segment.type === 'transit') {
          console.log(
            `[Discovery] Walking route #${idx + 1}, segment #${segIdx + 1}: Line ${segment.line.id} (${segment.line.name})`
          );
        } else if (segment.type === 'walk') {
          console.log(
            `[Discovery] Walking route #${idx + 1}, segment #${segIdx + 1}: Walk from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name}, distance=${segment.walkingDistance}m`
          );
        }
      });
    });

    walkingRoutes = validateAndOptimizeRoutes(walkingRoutes);
    console.log(
      `[Discovery] After validation: ${walkingRoutes.length} walking routes remain`
    );

    walkingRoutes = filterIrrationalRoutes(walkingRoutes, graph, destinationId);
    console.log(
      `[Discovery] After rationality filter: ${walkingRoutes.length} walking routes remain`
    );

    // Final processing
    let allRoutes = [...transitRoutes, ...walkingRoutes];
    console.log(`[Discovery] Combined total: ${allRoutes.length} routes`);

    allRoutes = validateAndOptimizeRoutes(allRoutes);
    console.log(
      `[Discovery] After final validation: ${allRoutes.length} routes remain`
    );

    allRoutes = filterIrrationalRoutes(allRoutes, graph, destinationId);
    console.log(
      `[Discovery] After final rationality filter: ${allRoutes.length} routes remain`
    );

    allRoutes = consolidateRoutesByPath(allRoutes);
    console.log(
      `[Discovery] After final consolidation: ${allRoutes.length} routes remain`
    );

    return allRoutes;
  } else {
    // No direct routes available - continue with normal multi-modal discovery
    console.log(
      `[Discovery] No direct routes available, proceeding with transfer routes`
    );

    // Phase B: Transfer routes
    let transferRoutes = findTransferRoutes(graph, originId, destinationId);
    console.log(`[Discovery] Found ${transferRoutes.length} transfer routes`);

    transferRoutes = validateAndOptimizeRoutes(transferRoutes);
    console.log(
      `[Discovery] After validation: ${transferRoutes.length} transfer routes remain`
    );

    transferRoutes = filterIrrationalRoutes(
      transferRoutes,
      graph,
      destinationId
    );
    console.log(
      `[Discovery] After rationality filter: ${transferRoutes.length} transfer routes remain`
    );

    transferRoutes = consolidateRoutesByPath(transferRoutes);
    console.log(
      `[Discovery] After consolidation: ${transferRoutes.length} transfer routes remain`
    );

    // Combine transit routes
    const transitRoutes = [...directRoutes, ...transferRoutes];
    console.log(`[Discovery] Combined ${transitRoutes.length} transit routes`);

    // Phase C: Walking routes
    console.log(
      `[Discovery] Starting walking routes discovery (no direct routes)`
    );
    let walkingRoutes = discoverWalkingRoutes(
      graph,
      originId,
      destinationId,
      transitRoutes
    );
    console.log(`[Discovery] Found ${walkingRoutes.length} walking routes`);

    walkingRoutes = validateAndOptimizeRoutes(walkingRoutes);
    console.log(
      `[Discovery] After validation: ${walkingRoutes.length} walking routes remain`
    );

    walkingRoutes = filterIrrationalRoutes(walkingRoutes, graph, destinationId);
    console.log(
      `[Discovery] After rationality filter: ${walkingRoutes.length} walking routes remain`
    );

    let allRoutes = [...transitRoutes, ...walkingRoutes];
    console.log(`[Discovery] Combined total: ${allRoutes.length} routes`);

    allRoutes = validateAndOptimizeRoutes(allRoutes);
    console.log(
      `[Discovery] After final validation: ${allRoutes.length} routes remain`
    );

    allRoutes = filterIrrationalRoutes(allRoutes, graph, destinationId);
    console.log(
      `[Discovery] After final rationality filter: ${allRoutes.length} routes remain`
    );

    allRoutes = consolidateRoutesByPath(allRoutes);
    console.log(
      `[Discovery] After final consolidation: ${allRoutes.length} routes remain`
    );

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
  const originStation = graph.stations[originId];
  const destinationStation = graph.stations[destinationId];

  console.log(
    `[Walking Discovery] Starting walking routes discovery from ${originId} (${originStation?.name || 'unknown'}) to ${destinationId} (${destinationStation?.name || 'unknown'})`
  );

  // Try direct walking route first (simplest case)
  const directWalkingRoute = findDirectWalk(graph, originId, destinationId);
  console.log(
    `[Walking Discovery] Direct walking route: ${directWalkingRoute ? 'Found' : 'Not possible'}`
  );

  // If stations are very close, prioritize walking
  if (directWalkingRoute) {
    const origin = graph.stations[originId];
    const destination = graph.stations[destinationId];
    const distance = calculateDistance(
      origin.coordinates,
      destination.coordinates
    );
    console.log(
      `[Walking Discovery] Direct walking distance: ${Math.round(distance)}m`
    );

    // If walking distance is very short, just return the walking route
    if (distance <= WALKING_MAX_DISTANCE * 0.5) {
      console.log(
        `[Walking Discovery] Distance is short, prioritizing direct walking route`
      );
      return [directWalkingRoute];
    }
  }

  // Start with direct walking if available
  let walkingRoutes: Route[] = directWalkingRoute ? [directWalkingRoute] : [];

  // Find routes with initial walking segment
  console.log(
    `[Walking Discovery] Finding routes with initial walking segment`
  );
  const initialWalkingRoutes = createInitialWalkingRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  console.log(
    `[Walking Discovery] Found ${initialWalkingRoutes.length} routes with initial walking segment`
  );

  // Log details of each initial walking route
  initialWalkingRoutes.forEach((route, idx) => {
    console.log(
      `[Walking Discovery] Initial walking route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
    );
    route.segments.forEach((segment, segIdx) => {
      if (segment.type === 'transit') {
        console.log(
          `[Walking Discovery] Initial walking route #${idx + 1}, segment #${segIdx + 1}: Line ${segment.line.id} (${segment.line.name})`
        );
      } else if (segment.type === 'walk') {
        console.log(
          `[Walking Discovery] Initial walking route #${idx + 1}, segment #${segIdx + 1}: Walk from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name}, distance=${segment.walkingDistance}m`
        );
      }
    });
  });

  walkingRoutes = [...walkingRoutes, ...initialWalkingRoutes];

  // Find routes with final walking segment
  console.log(`[Walking Discovery] Finding routes with final walking segment`);
  const finalWalkingRoutes = createFinalWalkingRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  console.log(
    `[Walking Discovery] Found ${finalWalkingRoutes.length} routes with final walking segment`
  );

  // Log details of each final walking route
  finalWalkingRoutes.forEach((route, idx) => {
    console.log(
      `[Walking Discovery] Final walking route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
    );
    route.segments.forEach((segment, segIdx) => {
      if (segment.type === 'transit') {
        console.log(
          `[Walking Discovery] Final walking route #${idx + 1}, segment #${segIdx + 1}: Line ${segment.line.id} (${segment.line.name})`
        );
      } else if (segment.type === 'walk') {
        console.log(
          `[Walking Discovery] Final walking route #${idx + 1}, segment #${segIdx + 1}: Walk from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name}, distance=${segment.walkingDistance}m`
        );
      }
    });
  });

  walkingRoutes = [...walkingRoutes, ...finalWalkingRoutes];

  // Find routes with walking transfers
  console.log(`[Walking Discovery] Finding routes with walking transfers`);
  const walkingTransferRoutes = createWalkingTransferRoutes(
    graph,
    originId,
    destinationId,
    [...existingRoutes, ...walkingRoutes]
  );
  console.log(
    `[Walking Discovery] Found ${walkingTransferRoutes.length} routes with walking transfers`
  );

  // Log details of each walking transfer route
  walkingTransferRoutes.forEach((route, idx) => {
    console.log(
      `[Walking Discovery] Walking transfer route #${idx + 1}: ID=${route.id}, duration=${route.totalDuration}s, transfers=${route.transfers}, segments=${route.segments.length}`
    );
    route.segments.forEach((segment, segIdx) => {
      if (segment.type === 'transit') {
        console.log(
          `[Walking Discovery] Walking transfer route #${idx + 1}, segment #${segIdx + 1}: Line ${segment.line.id} (${segment.line.name})`
        );
      } else if (segment.type === 'walk') {
        console.log(
          `[Walking Discovery] Walking transfer route #${idx + 1}, segment #${segIdx + 1}: Walk from ${segment.stations[0].name} to ${segment.stations[segment.stations.length - 1].name}, distance=${segment.walkingDistance}m`
        );
      }
    });
  });

  walkingRoutes = [...walkingRoutes, ...walkingTransferRoutes];

  console.log(
    `[Walking Discovery] Total walking routes found: ${walkingRoutes.length}`
  );

  return walkingRoutes;
}
