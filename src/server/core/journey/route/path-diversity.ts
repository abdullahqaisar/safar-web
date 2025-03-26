import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { EdgeData, NodeData } from './graph';
import {
  areSimilarPaths,
  extractEdgesFromPath,
  getEdgeCounts,
} from '@/server/core/shared/graph-utils';
import { findAlternativePathWithTimeout } from '@/server/core/shared/route-utils';
import {
  extractLineIdsFromEdges,
  extractLineIdsFromPath,
  extractLineIdFromNodeId,
  PRIMARY_LINES,
} from '@/server/core/shared/line-utils';
import { MetroLineColor } from '@/types/metro';

export function generateAggressiveAlternativePaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  if (existingPaths.length === 0) return;

  const graphCopy = graph.copy();
  const edgeCounts = getEdgeCounts(existingPaths);

  const commonEdges = Array.from(edgeCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  if (commonEdges.length === 0) return;

  for (const { key, count } of commonEdges) {
    const [combinedSourceTarget] = key.split('-', 2);
    const lastDashIndex = combinedSourceTarget.lastIndexOf('-');

    if (lastDashIndex === -1) continue; // Invalid key format

    const source = combinedSourceTarget.substring(0, lastDashIndex);
    const target = combinedSourceTarget.substring(lastDashIndex + 1);

    if (graphCopy.hasEdge(source, target)) {
      const edgeData = graphCopy.getEdgeAttributes(
        graphCopy.edge(source, target)
      );

      const penaltyFactor = Math.pow(5, count - 1);
      graphCopy.setEdgeAttribute(
        graphCopy.edge(source, target),
        'duration',
        edgeData.duration * penaltyFactor
      );
    }
  }

  findAlternativePathWithTimeout(
    graphCopy,
    originId,
    destinationId,
    existingPaths
  );
}

export function forceLineDiversityPaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  if (existingPaths.length === 0) return;

  const usedTransitLines = new Set<string>();

  for (const { edges, path } of existingPaths) {
    const edgeLines = extractLineIdsFromEdges(edges);
    const pathLines = extractLineIdsFromPath(path, graph);

    for (const line of edgeLines) usedTransitLines.add(line);
    for (const line of pathLines) usedTransitLines.add(line);
  }

  if (usedTransitLines.size === 0) return;

  const graphCopy = graph.copy();
  let penalizedAnyEdge = false;

  for (const edgeKey of graphCopy.edges()) {
    const edgeData = graphCopy.getEdgeAttributes(edgeKey);
    let shouldPenalize = false;

    if (
      edgeData.type === 'transit' &&
      edgeData.lineId &&
      usedTransitLines.has(edgeData.lineId)
    ) {
      shouldPenalize = true;
    } else {
      const [source, target] = graphCopy.extremities(edgeKey);

      if (source.includes('_') || target.includes('_')) {
        const sourceLineId = extractLineIdFromNodeId(source);
        const targetLineId = extractLineIdFromNodeId(target);

        if (
          (sourceLineId && usedTransitLines.has(sourceLineId)) ||
          (targetLineId && usedTransitLines.has(targetLineId))
        ) {
          shouldPenalize = true;
        }
      }
    }

    if (shouldPenalize) {
      graphCopy.setEdgeAttribute(edgeKey, 'duration', edgeData.duration * 10);
      penalizedAnyEdge = true;
    }
  }

  if (penalizedAnyEdge) {
    try {
      const result = dijkstra.bidirectional(
        graphCopy,
        originId,
        destinationId,
        (_edge: string, attributes: EdgeData) => attributes.duration
      );

      if (result && result.length > 0) {
        const edges = extractEdgesFromPath(graphCopy, result);

        if (edges.length > 0) {
          const newPathLines = extractLineIdsFromEdges(edges);

          let hasDifferentLine = false;
          for (const line of newPathLines) {
            if (!usedTransitLines.has(line)) {
              hasDifferentLine = true;
              break;
            }
          }

          if (hasDifferentLine || newPathLines.size === 0) {
            existingPaths.push({ path: result, edges });
          }
        }
      }
    } catch (error) {
      console.error('Error finding line-diverse path:', error);
    }
  }
}

export function findMajorLineCombinationPaths(
  graph: Graph<NodeData, EdgeData>,
  originId: string,
  destinationId: string,
  existingPaths: {
    path: string[];
    edges: Array<EdgeData & { source: string; target: string }>;
  }[]
): void {
  // Use primary lines from constants to build combinations
  const keyLineCombinations = [
    { lines: ['red', 'orange'], interchangeStation: 'faizAhmadFaiz' },
    { lines: ['green', 'blue'], interchangeStation: 'pims_gate' },
  ];

  for (const combination of keyLineCombinations) {
    // Verify these lines exist in PRIMARY_LINES
    const validLines = combination.lines.filter((line) =>
      PRIMARY_LINES.includes(line as MetroLineColor)
    );

    if (validLines.length !== combination.lines.length) {
      continue; // Skip invalid line combinations
    }

    const hasThisCombination = existingPaths.some(({ edges }) => {
      const usedLines = extractLineIdsFromEdges(edges);
      return combination.lines.every((line) => usedLines.has(line));
    });

    if (!hasThisCombination) {
      const modifiedGraph = graph.copy();

      for (const edgeKey of modifiedGraph.edges()) {
        const edgeData = modifiedGraph.getEdgeAttributes(edgeKey);
        const [source, target] = modifiedGraph.extremities(edgeKey);

        // Fix type mismatch issue
        let edgeLineId: string | undefined = edgeData.lineId;
        if (!edgeLineId) {
          if (source.includes('_')) {
            const lineId = extractLineIdFromNodeId(source);
            if (lineId) edgeLineId = lineId; // Only assign if not null
          } else if (target.includes('_')) {
            const lineId = extractLineIdFromNodeId(target);
            if (lineId) edgeLineId = lineId; // Only assign if not null
          }
        }

        if (edgeLineId && combination.lines.includes(edgeLineId)) {
          modifiedGraph.setEdgeAttribute(
            edgeKey,
            'duration',
            Math.floor(edgeData.duration * 0.3)
          );
        } else if (edgeData.type === 'transit') {
          modifiedGraph.setEdgeAttribute(
            edgeKey,
            'duration',
            edgeData.duration * 3
          );
        }

        if (edgeData.type === 'transfer') {
          const sourceAttrs = modifiedGraph.getNodeAttributes(source);
          const targetAttrs = modifiedGraph.getNodeAttributes(target);

          if (
            sourceAttrs.station?.id === combination.interchangeStation ||
            targetAttrs.station?.id === combination.interchangeStation
          ) {
            modifiedGraph.setEdgeAttribute(
              edgeKey,
              'duration',
              Math.floor(edgeData.duration * 0.2)
            );
          }
        }
      }

      try {
        const result = dijkstra.bidirectional(
          modifiedGraph,
          originId,
          destinationId,
          (_edge: string, attributes: EdgeData) => attributes.duration
        );

        if (result && result.length > 0) {
          const edges = extractEdgesFromPath(graph, result);

          if (edges.length > 0) {
            const usedLines = extractLineIdsFromEdges(edges);

            const includesTargetedLines = combination.lines.some((line) =>
              usedLines.has(line)
            );

            if (includesTargetedLines) {
              const isSignificantlyDifferent = !existingPaths.some(
                (existingPath) =>
                  areSimilarPaths(result, existingPath.path, 0.7)
              );

              if (isSignificantlyDifferent) {
                existingPaths.push({ path: result, edges });
              }
            }
          }
        }
      } catch (error) {
        console.error(
          `Error finding path with line combination ${combination.lines.join(
            ' + '
          )}:`,
          error
        );
      }
    }
  }
}
