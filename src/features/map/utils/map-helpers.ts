import { metroLines } from '@/core/data/metro-data';
import { TransitLine } from '@/core/types/graph';
import { getLineColor } from '@/lib/utils/route';

export interface StationData {
  stationId: string;
  lines: Array<{ id: string; color: string; name?: string }>;
}

// Group stations by their IDs to handle multi-line stations
export const groupStationsByIds = (
  TransitLines: TransitLine[]
): StationData[] => {
  const stationsMap = new Map<string, StationData>();

  TransitLines.forEach((line) => {
    line.stations.forEach((stationId) => {
      if (!stationsMap.has(stationId)) {
        stationsMap.set(stationId, {
          stationId,
          lines: [
            { id: line.id, color: line.color || '#4A5568', name: line.name },
          ],
        });
      } else {
        const station = stationsMap.get(stationId);
        if (station) {
          // Only add the line if it's not already present
          if (!station.lines.some((l) => l.id === line.id)) {
            station.lines.push({
              id: line.id,
              color: line.color || '#4A5568',
              name: line.name,
            });
          }
        }
      }
    });
  });

  return Array.from(stationsMap.values());
};

// Helper function to identify feeder lines based on their ID
export const isFeederLine = (lineId: string): boolean => {
  // Check if the line ID indicates a feeder route
  return (
    lineId.toLowerCase().includes('feeder') ||
    lineId.startsWith('F') ||
    lineId.endsWith('F') ||
    lineId.includes('branch') ||
    lineId.includes('shuttle')
  );
};

// Organize lines in a better way to handle drawing order and overlapping
export const organizeLinesToDraw = (
  TransitLines: TransitLine[],
  selectedLine?: string
): TransitLine[] => {
  const lines = selectedLine
    ? TransitLines.filter((line) => line.id === selectedLine)
    : [...TransitLines];

  // Sort lines so feeder routes are rendered first, main lines on top
  lines.sort((a, b) => {
    const aIsFeeder = isFeederLine(a.id);
    const bIsFeeder = isFeederLine(b.id);
    if (aIsFeeder && !bIsFeeder) return -1;
    if (!aIsFeeder && bIsFeeder) return 1;
    return 0;
  });

  return lines;
};

export const enhancedMetroLines: TransitLine[] = metroLines.map((line) => ({
  ...line,
  color: getLineColor(line.id),
}));
