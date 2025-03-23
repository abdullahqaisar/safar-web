import { Route } from '@/types/route';
import { calculateComfortScore, calculateRouteScore } from './scoring';
import { MAX_ROUTES_TO_RETURN, MAX_TRANSFERS } from '@/lib/constants/config';
import { v4 as uuidv4 } from 'uuid';
import {
  DURATION_MULTIPLIER,
  ROUTE_SIMILARITY_THRESHOLD,
} from '@/lib/constants/route-config';
import {
  findFastestRoute,
  findMinTransfersRoute,
  findTransitRoute,
  countTransfers,
  calculateRouteSimilarity,
  handleWalkingTransitFiltering,
  getFallbackRoutes,
  ensurePriorityRoutes,
} from '@/server/core/shared/route';

export function filterAndRankRoutes(
  routes: Route[],
  isVeryShortDistance = false,
  isMediumDistance = false,
  isLongDistance = false
): Route[] {
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  if (validRoutes.length === 0) {
    return [];
  }

  validRoutes.forEach((route) => {
    if (!route.id) {
      route.id = uuidv4();
    }
  });

  const directWalkRoutes = validRoutes.filter((r) => r.isDirectWalk === true);
  const nonDirectWalkRoutes = validRoutes.filter(
    (r) => r.isDirectWalk !== true
  );

  const filteredRoutes = filterRoutesByQuality(nonDirectWalkRoutes);
  const rankedRoutes = rankRoutes(filteredRoutes);

  let diverseRoutes = ensureRouteDiversity(
    rankedRoutes,
    isMediumDistance || isLongDistance
  );

  if (isLongDistance) {
    diverseRoutes = processLongDistanceRoutes(diverseRoutes, directWalkRoutes);
  } else if (isMediumDistance || isVeryShortDistance) {
    diverseRoutes = processShortMediumDistanceRoutes(
      diverseRoutes,
      directWalkRoutes
    );
  }

  return diverseRoutes.slice(0, MAX_ROUTES_TO_RETURN);
}

function processLongDistanceRoutes(
  diverseRoutes: Route[],
  directWalkRoutes: Route[]
): Route[] {
  if (directWalkRoutes.length === 0 || diverseRoutes.length === 0) {
    return diverseRoutes;
  }

  const bestDirectWalk = directWalkRoutes[0];
  const hasTransitRoute = diverseRoutes.some((route) =>
    route.segments.some((segment) => segment.type === 'transit')
  );

  if (!hasTransitRoute) {
    const transitRoute = findTransitRoute(diverseRoutes);
    if (transitRoute) {
      diverseRoutes.unshift(transitRoute);
    }
  }

  const includeWalking =
    bestDirectWalk.totalDuration < diverseRoutes[0].totalDuration * 0.8 ||
    !hasTransitRoute;

  if (includeWalking) {
    diverseRoutes.push(bestDirectWalk);
  }

  return diverseRoutes;
}

function processShortMediumDistanceRoutes(
  diverseRoutes: Route[],
  directWalkRoutes: Route[]
): Route[] {
  if (directWalkRoutes.length === 0) {
    return diverseRoutes;
  }

  const bestDirectWalk = directWalkRoutes[0];

  if (diverseRoutes.length === 0) {
    return [bestDirectWalk];
  }

  const walkIsFaster =
    bestDirectWalk.totalDuration < diverseRoutes[0].totalDuration * 1.1;

  if (walkIsFaster) {
    diverseRoutes.unshift(bestDirectWalk);
  } else {
    diverseRoutes.push(bestDirectWalk);
  }

  return diverseRoutes;
}

// Add a helper function to identify routes with walking shortcuts
function identifyRoutesWithWalkingShortcuts(routes: Route[]): Route[] {
  return routes.filter((route) => {
    // Check if the route has any walking segments between stations (not origin/destination)
    return route.segments.some(
      (segment) => segment.type === 'walk' && segment.isShortcut === true
    );
  });
}

function filterRoutesByQuality(routes: Route[]): Route[] {
  if (routes.length === 0) {
    return [];
  }

  // Get benchmark routes
  const fastestRoute = findFastestRoute(routes);
  const minTransfersRoute = findMinTransfersRoute(routes);

  // Find routes with walking shortcuts that might save transfers
  const walkingShortcutRoutes = identifyRoutesWithWalkingShortcuts(routes);

  // Sort shortcut routes by duration to find the most efficient ones
  const efficientShortcutRoutes = walkingShortcutRoutes
    .filter((route) => route.totalDuration <= fastestRoute.totalDuration * 1.3)
    .sort((a, b) => a.totalDuration - b.totalDuration);

  // Get comfort scores
  const comfortScores = routes.map((route) => ({
    route,
    comfort: calculateComfortScore(route),
  }));

  const mostComfortableRoute = comfortScores.reduce(
    (most, current) => (current.comfort > most.comfort ? current : most),
    comfortScores[0]
  ).route;

  // Apply duration filters with more generous threshold for routes with walking shortcuts
  const durationThreshold = fastestRoute.totalDuration * DURATION_MULTIPLIER;
  let filtered = routes.filter((route) => {
    const hasWalkingShortcut = walkingShortcutRoutes.includes(route);

    // Allow longer duration for routes with walking shortcuts
    // More generous allowance based on how many transfers are saved
    const transferDiff = Math.max(
      0,
      countTransfers(minTransfersRoute) - countTransfers(route)
    );
    const shortcutBonus = hasWalkingShortcut ? 1.1 + transferDiff * 0.1 : 1.0;

    const routeThreshold = durationThreshold * shortcutBonus;
    return route.totalDuration <= routeThreshold;
  });

  // Apply transfers filter with consideration for walking shortcuts
  const minTransfers = countTransfers(minTransfersRoute);
  const transfersThreshold = Math.min(
    MAX_TRANSFERS,
    minTransfers + (minTransfers < 2 ? 2 : 1)
  );

  filtered = filtered.filter(
    (route) => countTransfers(route) <= transfersThreshold
  );

  // Special handling for walking vs. transit
  filtered = handleWalkingTransitFiltering(filtered);

  // Ensure we haven't filtered out all routes
  if (filtered.length === 0) {
    return getFallbackRoutes(routes, fastestRoute);
  }

  // Ensure we include priority routes
  const priorityRoutes = [
    fastestRoute,
    minTransfersRoute,
    mostComfortableRoute,
    // Add best walking shortcut route to priorities if it exists
    ...(efficientShortcutRoutes.length > 0 ? [efficientShortcutRoutes[0]] : []),
  ];

  return ensurePriorityRoutes(filtered, ...priorityRoutes);
}

function rankRoutes(routes: Route[]): Route[] {
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  if (validRoutes.length === 0) {
    return [];
  }

  return validRoutes
    .map((route) => {
      const score = calculateRouteScore(route);
      return { route, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.route);
}

function ensureRouteDiversity(
  routes: Route[],
  enforceModeDiversity = false
): Route[] {
  if (routes.length <= 1) return routes;

  const result: Route[] = [routes[0]];

  if (enforceModeDiversity) {
    const firstIsTransit = routes[0].segments.some((s) => s.type === 'transit');
    const needsMode = firstIsTransit ? 'walk' : 'transit';

    const oppositeMode = routes
      .slice(1)
      .find((route) =>
        needsMode === 'walk'
          ? !route.segments.some((s) => s.type === 'transit')
          : route.segments.some((s) => s.type === 'transit')
      );

    if (oppositeMode) {
      result.push(oppositeMode);
    }
  }

  for (
    let i = 1;
    i < routes.length && result.length < MAX_ROUTES_TO_RETURN;
    i++
  ) {
    if (result.includes(routes[i])) continue;

    const candidate = routes[i];
    let isSignificantlyDifferent = true;

    for (const selectedRoute of result) {
      const similarity = calculateRouteSimilarity(candidate, selectedRoute);

      if (similarity > ROUTE_SIMILARITY_THRESHOLD) {
        isSignificantlyDifferent = false;
        break;
      }
    }

    if (isSignificantlyDifferent) {
      result.push(candidate);
    }
  }

  return result;
}
