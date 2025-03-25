import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { EdgeData, NodeData } from './graph';
import {
  areSimilarPaths,
  extractEdgesFromPath,
  getEdgeCounts,
} from '@/server/core/shared/graph-utils';
import { findAlternativePathWithTimeout } from '@/server/core/shared/route-utils';

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
    const [source, target] = key.split('->');
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

  for (const { edges } of existingPaths) {
    for (const edge of edges) {
      if (edge.type === 'transit' && edge.lineId) {
        usedTransitLines.add(edge.lineId);
      } else if (edge.source.includes('_') || edge.target.includes('_')) {
        const sourceLineId = edge.source.split('_')[1];
        const targetLineId = edge.target.split('_')[1];

        if (sourceLineId) usedTransitLines.add(sourceLineId);
        if (targetLineId) usedTransitLines.add(targetLineId);
      }
    }
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
        const sourceLineId = source.split('_')[1];
        const targetLineId = target.split('_')[1];

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
          const newPathLines = new Set<string>();

          for (const edge of edges) {
            if (edge.type === 'transit' && edge.lineId) {
              newPathLines.add(edge.lineId);
            } else if (edge.source.includes('_') || edge.target.includes('_')) {
              const sourceLineId = edge.source.split('_')[1];
              const targetLineId = edge.target.split('_')[1];

              if (sourceLineId) newPathLines.add(sourceLineId);
              if (targetLineId) newPathLines.add(targetLineId);
            }
          }

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
  const keyLineCombinations = [
    { lines: ['red', 'orange'], interchangeStation: 'faizAhmadFaiz' },
    { lines: ['green', 'blue'], interchangeStation: 'pims_gate' },
  ];

  for (const combination of keyLineCombinations) {
    const hasThisCombination = existingPaths.some(({ edges }) => {
      const usedLines = new Set<string>();

      for (const edge of edges) {
        if (edge.lineId) {
          usedLines.add(edge.lineId);
        } else if (edge.source.includes('_') || edge.target.includes('_')) {
          const sourceLineId = edge.source.split('_')[1];
          const targetLineId = edge.target.split('_')[1];

          if (sourceLineId) usedLines.add(sourceLineId);
          if (targetLineId) usedLines.add(targetLineId);
        }
      }

      return combination.lines.every((line) => usedLines.has(line));
    });

    if (!hasThisCombination) {
      const modifiedGraph = graph.copy();

      for (const edgeKey of modifiedGraph.edges()) {
        const edgeData = modifiedGraph.getEdgeAttributes(edgeKey);
        const [source, target] = modifiedGraph.extremities(edgeKey);

        let edgeLineId = edgeData.lineId;
        if (!edgeLineId) {
          if (source.includes('_')) {
            edgeLineId = source.split('_')[1];
          } else if (target.includes('_')) {
            edgeLineId = target.split('_')[1];
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
            const usedLines = new Set<string>();

            for (const edge of edges) {
              if (edge.lineId) {
                usedLines.add(edge.lineId);
              } else if (
                edge.source.includes('_') ||
                edge.target.includes('_')
              ) {
                const sourceLineId = edge.source.split('_')[1];
                const targetLineId = edge.target.split('_')[1];

                if (sourceLineId) usedLines.add(sourceLineId);
                if (targetLineId) usedLines.add(targetLineId);
              }
            }

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
