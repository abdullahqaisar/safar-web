import { useState, useEffect, useMemo } from 'react';
import { TransitLine } from '@/core/types/graph';

export function useLineSelection(metroLines: TransitLine[]) {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState<string[]>(() => {
    // Initialize with all lines visible
    return metroLines.map((line) => line.id);
  });

  // Reset visible lines if metro lines change
  useEffect(() => {
    setVisibleLines(metroLines.map((line) => line.id));
  }, [metroLines]);

  // Find the selected line data
  const selectedLineData = useMemo(() => {
    if (!selectedLineId) return null;
    return metroLines.find((line) => line.id === selectedLineId) || null;
  }, [selectedLineId, metroLines]);

  // Get filtered lines based on visibility
  const filteredLines = useMemo(() => {
    return metroLines.filter((line) => visibleLines.includes(line.id));
  }, [metroLines, visibleLines]);

  // Toggle visibility for a specific line
  const handleLineVisibilityToggle = (lineId: string) => {
    setVisibleLines((prev) => {
      if (prev.includes(lineId)) {
        return prev.filter((id) => id !== lineId);
      } else {
        return [...prev, lineId];
      }
    });
  };

  // Show all lines
  const showAllLines = () => {
    setVisibleLines(metroLines.map((line) => line.id));
  };

  // Hide all lines
  const hideAllLines = () => {
    setVisibleLines([]);
  };

  return {
    selectedLineId,
    setSelectedLineId,
    visibleLines,
    setVisibleLines,
    selectedLineData,
    filteredLines,
    handleLineVisibilityToggle,
    showAllLines,
    hideAllLines,
  };
}
