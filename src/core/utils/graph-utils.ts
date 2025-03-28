import { Station, Coordinates } from '../types/graph';
import { TransitGraph } from '../graph/graph';
import { WALKING_MAX_DISTANCE } from './constants';

// Constants for spatial indexing
const GRID_CELL_SIZE = 1000; // Grid cell size in meters
export type GridKey = string; // Format: "x:y"

export function getCellKey(coordinates: Coordinates): GridKey {
  const x = Math.floor((coordinates.lng * 111320) / GRID_CELL_SIZE);
  const y = Math.floor((coordinates.lat * 110574) / GRID_CELL_SIZE);

  return `${x}:${y}`;
}

export function getNearbyCells(coordinates: Coordinates): GridKey[] {
  const centerCellKey = getCellKey(coordinates);
  const [centerX, centerY] = centerCellKey.split(':').map(Number);

  const nearbyCells: GridKey[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cellKey = `${centerX + dx}:${centerY + dy}`;
      nearbyCells.push(cellKey);
    }
  }

  return nearbyCells;
}

/**
 * Calculate priority score for a walking shortcut
 */
export function calculateWalkingPriority(
  from: Station,
  to: Station,
  distance: number,
  graph: TransitGraph
): number {
  // Maximum walking distance in meters
  let priority = 0;

  // 1. Base distance score - higher priority for shorter distances
  // Using an inversely proportional relationship with quadratic decay
  priority +=
    Math.pow((WALKING_MAX_DISTANCE - distance) / WALKING_MAX_DISTANCE, 2) * 10;

  // 2. Interchange importance
  // Higher value for interchanges with multiple lines
  if (from.isInterchange) {
    // Get count of lines at this station
    const fromLines = graph.getStationLines(from.id);
    priority += 3 + fromLines.length;
  }

  if (to.isInterchange) {
    // Get count of lines at this station
    const toLines = graph.getStationLines(to.id);
    priority += 3 + toLines.length;
  }

  // 3. Line connectivity value
  // Higher value when stations connect different lines (more transfer options)
  const fromLines = graph.getStationLines(from.id);
  const toLines = graph.getStationLines(to.id);

  if (fromLines.length > 0 && toLines.length > 0) {
    // Count unique lines that are different between stations
    const fromLineSet = new Set(fromLines);
    const toLineSet = new Set(toLines);

    let uniqueLineCount = 0;

    toLines.forEach((line) => {
      if (!fromLineSet.has(line)) uniqueLineCount++;
    });

    fromLines.forEach((line) => {
      if (!toLineSet.has(line)) uniqueLineCount++;
    });

    priority += uniqueLineCount * 2;
  }

  // 4. Penalize very short distances between stations on the same line
  // (these shortcuts may not be useful as transit is likely faster)
  const hasCommonLine = fromLines.some((line) => toLines.includes(line));
  if (hasCommonLine && distance < 200) {
    priority -= 5;
  }

  return Math.round(Math.max(0, priority)); // Ensure non-negative priority
}
