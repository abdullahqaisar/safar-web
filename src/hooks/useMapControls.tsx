import { useState, useRef } from 'react';

export function useMapControls() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);
  const toggleStations = () => setShowStations((prev) => !prev);
  const toggleFiltersPanel = () => setShowFiltersPanel((prev) => !prev);

  return {
    isFullscreen,
    showStations,
    showFiltersPanel,
    toggleFullscreen,
    toggleStations,
    toggleFiltersPanel,
    mapContainerRef,
  };
}
