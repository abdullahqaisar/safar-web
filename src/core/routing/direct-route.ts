import { TransitGraph } from '../graph/graph';
import { Route } from '../types/route';
import { createRoute, createTransitSegment } from '../utils/route-builder';

export function findDirectRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route[] {
  const routes: Route[] = [];

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    return routes;
  }

  // Get lines for both stations from the graph
  const originLines = graph.getStationLines(originId);
  const destLines = graph.getStationLines(destinationId);

  // Find common lines
  const commonLines = originLines.filter((lineId) =>
    destLines.includes(lineId)
  );

  // For each common line, try to find a direct route
  commonLines.forEach((lineId) => {
    const line = graph.lines[lineId];
    if (!line) return;

    const stations = line.stations;
    const originIndex = stations.indexOf(originId);
    const destIndex = stations.indexOf(destinationId);

    // Skip if any station is not found in the line
    if (originIndex === -1 || destIndex === -1) {
      return;
    }

    // Create forward route if destination comes after origin
    if (destIndex > originIndex) {
      const routeSegment = createTransitSegment(
        graph,
        line,
        stations.slice(originIndex, destIndex + 1)
      );

      if (routeSegment) {
        routes.push(
          createRoute([routeSegment], { requestedOrigin: originId } as Route)
        );
      }
    }
    // Create reverse route if origin comes after destination
    else if (originIndex > destIndex) {
      const stationIds = stations.slice(destIndex, originIndex + 1).reverse();
      const routeSegment = createTransitSegment(graph, line, stationIds);

      if (routeSegment) {
        routes.push(
          createRoute([routeSegment], { requestedOrigin: originId } as Route)
        );
      }
    }
  });

  return routes;
}
