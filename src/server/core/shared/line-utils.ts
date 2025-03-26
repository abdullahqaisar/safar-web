import { Route, TransitSegment } from '@/types/route';
import { MetroLineColor } from '@/types/metro';
import Graph from 'graphology';
import { EdgeData, NodeData } from '../journey/route/graph';
import { metroLines } from '@/lib/constants/metro-data';

/**
 * Line classification by importance in the network
 */
export enum LineClass {
  PRIMARY = 'primary', // Main metro backbone routes
  SECONDARY = 'secondary', // Major feeder/connector routes
  TERTIARY = 'tertiary', // Local/auxiliary routes
}

/**
 * Classification of all metro lines
 */
export const LINE_CLASSIFICATION: Record<string, LineClass> = {
  // Primary lines (main metro network)
  red: LineClass.PRIMARY,
  orange: LineClass.PRIMARY,
  green: LineClass.PRIMARY,
  blue: LineClass.PRIMARY,

  // Secondary lines (major feeder routes)
  fr_1: LineClass.SECONDARY,
  fr_9: LineClass.SECONDARY,
  fr_14: LineClass.SECONDARY,
  fr_8a: LineClass.SECONDARY,
  fr_8c: LineClass.SECONDARY,

  // Tertiary lines (local connectors)
  fr_3a: LineClass.TERTIARY,
  fr_4: LineClass.TERTIARY,
  fr_4a: LineClass.TERTIARY,
  fr_7: LineClass.TERTIARY,
  fr_14a: LineClass.TERTIARY,
  fr_15: LineClass.TERTIARY,
};

/**
 * Primary transit lines (main metro lines)
 */
export const PRIMARY_LINES: MetroLineColor[] = [
  'red',
  'orange',
  'green',
  'blue',
];

/**
 * Secondary transit lines (major feeder routes)
 */
export const SECONDARY_LINES: string[] = [
  'fr_1',
  'fr_9',
  'fr_14',
  'fr_8a',
  'fr_8c',
];

/**
 * Get the line classification
 */
export function getLineClass(
  lineId: string | undefined
): LineClass | undefined {
  if (!lineId) return undefined;
  return LINE_CLASSIFICATION[lineId] || LineClass.TERTIARY;
}

/**
 * Check if a line ID represents a primary transit line
 */
export function isPrimaryLine(lineId: string | undefined): boolean {
  if (!lineId) return false;
  return LINE_CLASSIFICATION[lineId] === LineClass.PRIMARY;
}

/**
 * Check if a line ID represents a secondary transit line
 */
export function isSecondaryLine(lineId: string | undefined): boolean {
  if (!lineId) return false;
  return LINE_CLASSIFICATION[lineId] === LineClass.SECONDARY;
}

/**
 * Get all lines with stations count for reference
 */
export function getLineStationCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const line of metroLines) {
    counts[line.id] = line.stations.length;
  }

  return counts;
}

/**
 * Extract all transit line IDs from a route
 */
export function extractLineIdsFromRoute(route: Route): Set<string> {
  const lineIds = new Set<string>();

  for (const segment of route.segments) {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      if (transitSegment.line?.id) {
        lineIds.add(transitSegment.line.id);
      }
    }
  }

  return lineIds;
}

/**
 * Extract line IDs from a graph path
 */
export function extractLineIdsFromPath(
  path: string[],
  graph: Graph<NodeData, EdgeData>
): Set<string> {
  const lineIds = new Set<string>();

  for (const nodeId of path) {
    // Skip origin/destination
    if (nodeId === 'origin' || nodeId === 'destination') continue;

    // Extract line ID from virtual node ID (format: stationId_lineId)
    if (nodeId.includes('_')) {
      const parts = nodeId.split('_');
      if (parts.length > 1) {
        lineIds.add(parts[1]);
        continue;
      }
    }

    // Try to get line ID from node attributes
    if (graph.hasNode(nodeId)) {
      const nodeData = graph.getNodeAttributes(nodeId);
      if (nodeData.lineId) {
        lineIds.add(nodeData.lineId);
      }
    }
  }

  return lineIds;
}

/**
 * Extract line IDs from edge data
 */
export function extractLineIdsFromEdges(
  edges: Array<EdgeData & { source: string; target: string }>
): Set<string> {
  const lineIds = new Set<string>();

  for (const edge of edges) {
    if (edge.type === 'transit' && edge.lineId) {
      lineIds.add(edge.lineId);
    } else {
      // Try to extract from node IDs if this is a transfer between lines
      const sourceLineId = extractLineIdFromNodeId(edge.source);
      const targetLineId = extractLineIdFromNodeId(edge.target);

      if (sourceLineId) lineIds.add(sourceLineId);
      if (targetLineId) lineIds.add(targetLineId);
    }
  }

  return lineIds;
}

/**
 * Helper function to extract line ID from a node ID
 */
export function extractLineIdFromNodeId(nodeId: string): string | null {
  if (nodeId.includes('_')) {
    const parts = nodeId.split('_');
    if (parts.length > 1) return parts[1];
  }
  return null;
}

/**
 * Calculate similarity between two sets of line IDs, with line classification weighting
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateLineSimilarity(
  linesA: Set<string>,
  linesB: Set<string>
): number {
  if (linesA.size === 0 && linesB.size === 0) return 1;
  if (linesA.size === 0 || linesB.size === 0) return 0;

  // Calculate weighted similarities by line class
  const primaryOnlyA = new Set([...linesA].filter(isPrimaryLine));
  const primaryOnlyB = new Set([...linesB].filter(isPrimaryLine));
  const secondaryOnlyA = new Set([...linesA].filter(isSecondaryLine));
  const secondaryOnlyB = new Set([...linesB].filter(isSecondaryLine));
  const tertiaryOnlyA = new Set(
    [...linesA].filter((id) => !isPrimaryLine(id) && !isSecondaryLine(id))
  );
  const tertiaryOnlyB = new Set(
    [...linesB].filter((id) => !isPrimaryLine(id) && !isSecondaryLine(id))
  );

  // Calculate similarity for each line category
  const primarySimilarity = calculateSetSimilarity(primaryOnlyA, primaryOnlyB);
  const secondarySimilarity = calculateSetSimilarity(
    secondaryOnlyA,
    secondaryOnlyB
  );
  const tertiarySimilarity = calculateSetSimilarity(
    tertiaryOnlyA,
    tertiaryOnlyB
  );

  // Weight the similarities by importance (primary lines matter most)
  const weights = {
    primary: 0.6,
    secondary: 0.3,
    tertiary: 0.1,
  };

  // Calculate weighted similarity - if a category has no lines on either side, use 0
  let totalWeight = 0;
  let weightedSimilarity = 0;

  if (primaryOnlyA.size > 0 || primaryOnlyB.size > 0) {
    weightedSimilarity += primarySimilarity * weights.primary;
    totalWeight += weights.primary;
  }

  if (secondaryOnlyA.size > 0 || secondaryOnlyB.size > 0) {
    weightedSimilarity += secondarySimilarity * weights.secondary;
    totalWeight += weights.secondary;
  }

  if (tertiaryOnlyA.size > 0 || tertiaryOnlyB.size > 0) {
    weightedSimilarity += tertiarySimilarity * weights.tertiary;
    totalWeight += weights.tertiary;
  }

  // Normalize by actual weights used
  return totalWeight > 0 ? weightedSimilarity / totalWeight : 0;
}

/**
 * Helper function to calculate similarity between two sets
 */
function calculateSetSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set<T>();
  for (const item of setA) {
    if (setB.has(item)) intersection.add(item);
  }

  const union = new Set<T>([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Check if a route uses any primary transit lines
 */
export function usesPrimaryLines(route: Route): boolean {
  const lineIds = extractLineIdsFromRoute(route);
  return [...lineIds].some(isPrimaryLine);
}

/**
 * Check if a route uses any secondary transit lines
 */
export function usesSecondaryLines(route: Route): boolean {
  const lineIds = extractLineIdsFromRoute(route);
  return [...lineIds].some(isSecondaryLine);
}

/**
 * Get route diversity score based on line uniqueness compared to other routes
 * Higher score means this route adds more line diversity
 */
export function getRouteDiversityScore(
  route: Route,
  otherRoutes: Route[]
): number {
  if (otherRoutes.length === 0) return 1;

  const routeLines = extractLineIdsFromRoute(route);
  if (routeLines.size === 0) return 0;

  let totalSimilarity = 0;
  for (const otherRoute of otherRoutes) {
    const otherRouteLines = extractLineIdsFromRoute(otherRoute);
    totalSimilarity += calculateLineSimilarity(routeLines, otherRouteLines);
  }

  const avgSimilarity = totalSimilarity / otherRoutes.length;
  return 1 - avgSimilarity; // Convert similarity to diversity score
}

/**
 * Calculate a line coverage score - how well the route covers different line types
 * Returns 0-100, higher is better
 */
export function calculateLineCoverageScore(route: Route): number {
  const lineIds = extractLineIdsFromRoute(route);
  if (lineIds.size === 0) return 0;

  const primaryCount = [...lineIds].filter(isPrimaryLine).length;
  const secondaryCount = [...lineIds].filter(isSecondaryLine).length;
  const tertiaryCount = lineIds.size - primaryCount - secondaryCount;

  // Routes with primary lines are generally better
  if (primaryCount > 0) {
    // Base score for having primary lines
    let score = 70;

    // Bonus for primary + secondary combination (good integration)
    if (secondaryCount > 0) {
      score += Math.min(20, secondaryCount * 10);
    }

    // Small bonus for tertiary lines
    if (tertiaryCount > 0) {
      score += Math.min(10, tertiaryCount * 3);
    }

    return Math.min(100, score);
  }

  // Routes with only secondary lines
  if (secondaryCount > 0) {
    let score = 50 + Math.min(20, secondaryCount * 8);

    // Bonus for secondary + tertiary combination
    if (tertiaryCount > 0) {
      score += Math.min(15, tertiaryCount * 5);
    }

    return Math.min(90, score);
  }

  // Routes with only tertiary lines
  return Math.min(60, 30 + tertiaryCount * 10);
}

/**
 * Check if two routes have complementary line coverage
 * Returns true if they cover different parts of the network
 */
export function areRoutesComplementary(routeA: Route, routeB: Route): boolean {
  const linesA = extractLineIdsFromRoute(routeA);
  const linesB = extractLineIdsFromRoute(routeB);

  // No complementarity if either has no lines
  if (linesA.size === 0 || linesB.size === 0) return false;

  // Check complementarity by line class
  const primaryA = new Set([...linesA].filter(isPrimaryLine));
  const primaryB = new Set([...linesB].filter(isPrimaryLine));
  const secondaryA = new Set([...linesA].filter(isSecondaryLine));
  const secondaryB = new Set([...linesB].filter(isSecondaryLine));

  // Routes are complementary if they cover different primary or secondary lines
  const primaryDiff =
    [...primaryA].some((line) => !primaryB.has(line)) ||
    [...primaryB].some((line) => !primaryA.has(line));

  const secondaryDiff =
    [...secondaryA].some((line) => !secondaryB.has(line)) ||
    [...secondaryB].some((line) => !secondaryA.has(line));

  return primaryDiff || secondaryDiff;
}
