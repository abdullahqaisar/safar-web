import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface TileLoadTrackerProps {
  onTilesLoaded: () => void;
  onProgressChange?: (progress: number) => void;
}

const TileLoadTracker = ({
  onTilesLoaded,
  onProgressChange = () => {},
}: TileLoadTrackerProps) => {
  const map = useMap();

  // Use refs to track loading state persistently
  const loadTrackerRef = useRef({
    hasLoaded: false,
    activeTiles: 0,
    loadedTiles: 0,
    estimatedTotalTiles: 25, // Reasonable starting estimate
    startTime: Date.now(),
    currentProgress: 0,
    lastReportedProgress: 0,
    progressReported: false,
  });

  useEffect(() => {
    // Set initial progress immediately but only once
    if (!loadTrackerRef.current.progressReported) {
      loadTrackerRef.current.currentProgress = 10;
      loadTrackerRef.current.lastReportedProgress = 10;
      loadTrackerRef.current.progressReported = true;
      onProgressChange(10);
    }

    // Smooth progress reporter that prevents flickering and ensures progress always moves forward
    const reportProgress = (newProgress: number) => {
      const { currentProgress, lastReportedProgress } = loadTrackerRef.current;

      // Never decrease progress - only move forward
      const smoothedProgress = Math.max(currentProgress, newProgress);

      // Only report significant changes to avoid micro-updates
      if (Math.abs(smoothedProgress - lastReportedProgress) > 0.5) {
        loadTrackerRef.current.currentProgress = smoothedProgress;
        loadTrackerRef.current.lastReportedProgress = smoothedProgress;
        onProgressChange(smoothedProgress);
      }
    };

    // Handle tile loading start events
    const handleTileLoadStart = () => {
      loadTrackerRef.current.activeTiles++;

      // Update estimate of total tiles if needed
      if (
        loadTrackerRef.current.activeTiles >
        loadTrackerRef.current.estimatedTotalTiles
      ) {
        loadTrackerRef.current.estimatedTotalTiles =
          loadTrackerRef.current.activeTiles;
      }
    };

    // Handle successful tile loads
    const handleTileLoad = () => {
      loadTrackerRef.current.loadedTiles++;
      calculateAndReportProgress();
      checkIfComplete();
    };

    // Handle tile load errors (still count as loaded for progress purposes)
    const handleTileError = () => {
      loadTrackerRef.current.loadedTiles++;
      calculateAndReportProgress();
      checkIfComplete();
    };

    // Calculate progress based on loaded vs total tiles with smooth transitions
    const calculateAndReportProgress = () => {
      const { loadedTiles, estimatedTotalTiles, startTime } =
        loadTrackerRef.current;

      // Calculate progress from loaded tiles
      let tilesProgress = 0;
      if (estimatedTotalTiles > 0) {
        tilesProgress = (loadedTiles / estimatedTotalTiles) * 80; // Max 80% from tile loading
      }

      // Calculate progress from elapsed time as fallback
      const timeElapsed = Date.now() - startTime;
      const timeProgress = Math.min(80, 10 + (timeElapsed / 8000) * 70);

      // Use the higher of the two progress values, ensuring we never go backward
      const combinedProgress = Math.max(10, tilesProgress, timeProgress);

      // Limit to 95% until fully loaded to avoid premature completion appearance
      const cappedProgress = Math.min(95, combinedProgress);

      // Report smoothed progress
      reportProgress(cappedProgress);
    };

    // Determine if loading is complete
    const checkIfComplete = () => {
      const { loadedTiles, activeTiles, hasLoaded } = loadTrackerRef.current;

      // Consider loaded when we have loaded tiles and they match or exceed active count
      if (loadedTiles > 5 && loadedTiles >= activeTiles && !hasLoaded) {
        console.log(
          `TileLoadTracker: All tiles loaded (${loadedTiles}/${activeTiles})`
        );
        loadTrackerRef.current.hasLoaded = true;
        reportProgress(100);
        onTilesLoaded();
      }
    };

    // Gradual progress simulation to ensure smooth progress even without tile events
    const simulationInterval = setInterval(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        const elapsed = Date.now() - loadTrackerRef.current.startTime;

        // Create a logarithmic curve that approaches 95% asymptotically
        const simulatedProgress = 10 + 85 * (1 - Math.exp(-elapsed / 5000));

        reportProgress(Math.min(95, simulatedProgress));
      }
    }, 100);

    // Safety fallback to ensure we don't get stuck in loading state
    const fallbackTimer = setTimeout(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        console.log('TileLoadTracker: Fallback timer forcing completion');
        loadTrackerRef.current.hasLoaded = true;
        reportProgress(100);
        onTilesLoaded();
      }
    }, 8000);

    // Attach map event listeners
    map.on('tileloadstart', handleTileLoadStart);
    map.on('tileload', handleTileLoad);
    map.on('tileerror', handleTileError);

    // Listen to map load event as additional signal
    map.on('load', () => {
      setTimeout(() => {
        if (
          !loadTrackerRef.current.hasLoaded &&
          loadTrackerRef.current.loadedTiles > 0
        ) {
          console.log('TileLoadTracker: Map load event triggered completion');
          loadTrackerRef.current.hasLoaded = true;
          reportProgress(100);
          onTilesLoaded();
        }
      }, 1000);
    });

    // Clean up event listeners and timers
    return () => {
      clearInterval(simulationInterval);
      clearTimeout(fallbackTimer);
      map.off('tileloadstart', handleTileLoadStart);
      map.off('tileload', handleTileLoad);
      map.off('tileerror', handleTileError);
      map.off('load');
    };
  }, [map, onTilesLoaded, onProgressChange]);

  return null;
};

export default TileLoadTracker;
