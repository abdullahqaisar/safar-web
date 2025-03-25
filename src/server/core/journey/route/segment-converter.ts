import Graph from 'graphology';
import { RouteSegment } from '@/types/route';
import { Station } from '@/types/station';
import { EdgeData, NodeData } from './graph';

export async function convertPathToSegments(
  path: string[],
  edges: Array<EdgeData & { source: string; target: string }>,
  graph: Graph<NodeData, EdgeData>
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];

  const {
    createTransitSegment,
    createWalkingSegment,
    getLineById,
    consolidateWalkingSegments,
    findOptimalStationSequence,
  } = await import('../segment/builder');

  let currentTransitLine: string | null = null;
  let currentTransitStations: Station[] = [];

  function extractLineId(nodeId: string): string | null {
    if (graph.hasNode(nodeId)) {
      const attrs = graph.getNodeAttributes(nodeId);
      if (attrs.lineId) return attrs.lineId;
      if (attrs.virtual && nodeId.includes('_')) {
        return nodeId.split('_')[1];
      }
    }
    return null;
  }

  function isTransferBetweenLines(
    sourceId: string,
    targetId: string
  ): boolean | undefined {
    if (!graph.hasNode(sourceId) || !graph.hasNode(targetId)) return false;

    const sourceAttrs = graph.getNodeAttributes(sourceId);
    const targetAttrs = graph.getNodeAttributes(targetId);

    const isVirtualTransfer = sourceAttrs.virtual && targetAttrs.virtual;
    const isSameStation = sourceAttrs.station.id === targetAttrs.station.id;
    const sourceLine = sourceAttrs.lineId || extractLineId(sourceId);
    const targetLine = targetAttrs.lineId || extractLineId(targetId);
    const isDifferentLine = sourceLine !== targetLine;

    return isVirtualTransfer && isSameStation && isDifferentLine;
  }

  async function finalizeCurrentTransit(): Promise<void> {
    if (currentTransitLine !== null && currentTransitStations.length > 1) {
      const line = getLineById(currentTransitLine);
      if (line) {
        const stationSequence = await findOptimalStationSequence(
          line,
          currentTransitStations[0],
          currentTransitStations[currentTransitStations.length - 1],
          currentTransitStations
        );

        const transitSegment = await createTransitSegment(
          line,
          stationSequence
        );
        if (transitSegment) segments.push(transitSegment);
      }
      currentTransitLine = null;
      currentTransitStations = [];
    }
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;

    const sourceNodeData = graph.getNodeAttributes(edge.source);
    const targetNodeData = graph.getNodeAttributes(edge.target);

    if (!sourceNodeData || !targetNodeData) continue;

    const sourceStation = sourceNodeData.station;
    const targetStation = targetNodeData.station;
    if (!sourceStation || !targetStation) continue;

    const isIntraStationTransfer = isTransferBetweenLines(
      edge.source,
      edge.target
    );

    const sourceLineId = extractLineId(edge.source);
    const targetLineId = extractLineId(edge.target);
    const lineId = edge.lineId || sourceLineId || targetLineId;

    const isOrigin = edge.source === 'origin';
    const isDestination = edge.target === 'destination';

    if (
      (isOrigin || isDestination) &&
      (edge.type === 'walking' || edge.type === 'transfer')
    ) {
      if (isDestination) {
        await finalizeCurrentTransit();
      }

      const walkSegment = await createWalkingSegment(
        sourceStation,
        targetStation,
        sourceStation.coordinates,
        targetStation.coordinates
      );

      if (walkSegment) segments.push(walkSegment);
      continue;
    }

    if (isIntraStationTransfer) {
      await finalizeCurrentTransit();
      continue;
    }

    if (edge.type === 'transit') {
      if (currentTransitLine !== lineId) {
        await finalizeCurrentTransit();
        currentTransitLine = lineId;
        currentTransitStations = [sourceStation];
      }

      if (!currentTransitStations.some((s) => s.id === targetStation.id)) {
        currentTransitStations.push(targetStation);
      }
    } else if (
      edge.type === 'walking' ||
      (edge.type === 'transfer' && sourceStation.id !== targetStation.id)
    ) {
      await finalizeCurrentTransit();

      const isWalkingShortcut =
        edge.isShortcut === true &&
        sourceStation.id !== 'origin' &&
        targetStation.id !== 'destination';

      const isExplicitShortcut = edge.isExplicitShortcut === true;
      const shortcutPriority = edge.priority || 0;

      const walkSegment = await createWalkingSegment(
        sourceStation,
        targetStation,
        sourceStation.coordinates,
        targetStation.coordinates,
        isWalkingShortcut,
        isExplicitShortcut,
        shortcutPriority
      );

      if (walkSegment) segments.push(walkSegment);
    }
  }

  await finalizeCurrentTransit();

  return consolidateWalkingSegments(
    segments.filter((segment) => segment.duration > 0)
  );
}
