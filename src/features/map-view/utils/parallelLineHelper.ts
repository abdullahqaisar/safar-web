export interface LineSegment {
  from: string; // Station ID
  to: string; // Station ID
  lineId: string;
}

// Detect parallel segments where multiple lines run between the same stations
export function detectParallelSegments(
  metroLines: Array<{
    id: string;
    stations: string[];
    color?: string;
    name?: string;
  }>
): Record<string, string[]> {
  // Store segments by their from-to station pair
  const segmentMap: Record<string, string[]> = {};

  // Process each line to identify shared segments
  metroLines.forEach((line) => {
    const stations = line.stations;

    // For each adjacent pair of stations in the line
    for (let i = 0; i < stations.length - 1; i++) {
      const fromStation = stations[i];
      const toStation = stations[i + 1];

      // Create a unique key for this segment (order stations to ensure consistency)
      const segmentKey = [fromStation, toStation].sort().join('-');

      if (!segmentMap[segmentKey]) {
        segmentMap[segmentKey] = [];
      }

      // Add this line to the segment
      segmentMap[segmentKey].push(line.id);
    }
  });

  // Filter to only keep segments with multiple lines
  const parallelSegments: Record<string, string[]> = {};

  Object.entries(segmentMap).forEach(([segmentKey, lineIds]) => {
    if (lineIds.length > 1) {
      parallelSegments[segmentKey] = lineIds;
    }
  });

  return parallelSegments;
}

// Group parallel lines to calculate offsets for coherent visualization
export function buildParallelLineGroups(
  metroLines: Array<{
    id: string;
    stations: string[];
    color?: string;
    name?: string;
  }>
): Record<string, string[]> {
  const parallelSegments = detectParallelSegments(metroLines);
  const lineGroups: Record<string, Set<string>> = {};

  // Build initial groups from parallel segments
  Object.values(parallelSegments).forEach((lineIds, index) => {
    const groupKey = `group-${index}`;
    lineGroups[groupKey] = new Set(lineIds);
  });

  // Merge overlapping groups
  let merged = true;
  while (merged) {
    merged = false;
    const groupKeys = Object.keys(lineGroups);

    for (let i = 0; i < groupKeys.length; i++) {
      for (let j = i + 1; j < groupKeys.length; j++) {
        const group1 = lineGroups[groupKeys[i]];
        const group2 = lineGroups[groupKeys[j]];

        // Check if groups share any lines
        let hasOverlap = false;
        group1.forEach((lineId) => {
          if (group2.has(lineId)) {
            hasOverlap = true;
          }
        });

        if (hasOverlap) {
          // Merge group2 into group1
          group2.forEach((lineId) => group1.add(lineId));
          delete lineGroups[groupKeys[j]];
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Convert sets to arrays
  const result: Record<string, string[]> = {};
  Object.entries(lineGroups).forEach(([key, lineSet]) => {
    result[key] = Array.from(lineSet);
  });

  return result;
}

// Calculate offset for a line within a parallel group based on zoom level
export function calculateLineOffset(
  lineId: string,
  parallelGroups: Record<string, string[]>,
  zoomLevel: number
): number {
  // Find which group this line belongs to
  for (const groupKey in parallelGroups) {
    const lines = parallelGroups[groupKey];
    const lineIndex = lines.indexOf(lineId);

    if (lineIndex !== -1) {
      const totalLines = lines.length;

      // Enhanced offset calculation based on zoom level and line count
      // Improved spacing for better visibility
      let baseOffset;

      if (zoomLevel >= 15) {
        // Very detailed view - provide maximum separation
        baseOffset = 4;
      } else if (zoomLevel >= 13) {
        // Detailed view
        baseOffset = 3;
      } else if (zoomLevel >= 11) {
        // Medium zoom
        baseOffset = 2;
      } else {
        // Low zoom - minimal separation to avoid clutter
        baseOffset = 1;
      }

      // Scale offset for more than 2 lines to ensure proper separation
      if (totalLines > 2) {
        // Progressive scaling - more lines need proportionally more space
        baseOffset *= 1 + (totalLines - 2) * 0.15;
      }

      // Calculate position within group using improved algorithm that spaces lines evenly
      // For 3 lines: -1, 0, 1 multiplied by baseOffset
      return (lineIndex - (totalLines - 1) / 2) * baseOffset;
    }
  }

  return 0; // No offset for non-parallel lines
}
