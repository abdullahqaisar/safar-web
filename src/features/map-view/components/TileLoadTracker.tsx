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
  const loadTrackerRef = useRef({
    hasLoaded: false,
    activeTiles: 0,
    loadedTiles: 0,
    estimatedTotalTiles: 25, // Start with a reasonable estimate
    startTime: Date.now(),
  });

  useEffect(() => {
    // Set initial progress to 10% immediately
    onProgressChange(10);

    // Improved tile loading tracking that counts tiles and reports progress
    const handleTileLoadStart = () => {
      loadTrackerRef.current.activeTiles++;

      // Update estimated total if it grows
      if (
        loadTrackerRef.current.activeTiles >
        loadTrackerRef.current.estimatedTotalTiles
      ) {
        loadTrackerRef.current.estimatedTotalTiles =
          loadTrackerRef.current.activeTiles;
      }

      // Calculate progress based on current knowledge
      calculateAndReportProgress();
    };

    const handleTileLoad = () => {
      loadTrackerRef.current.loadedTiles++;
      calculateAndReportProgress();

      // Consider loaded when we've loaded most tiles and no new ones are pending for a while
      checkIfComplete();
    };

    const handleTileError = () => {
      loadTrackerRef.current.loadedTiles++;
      calculateAndReportProgress();
      checkIfComplete();
    };

    // Calculate progress as a percentage
    const calculateAndReportProgress = () => {
      const { loadedTiles, estimatedTotalTiles } = loadTrackerRef.current;

      // If we have an estimate of total tiles, use that for progress
      if (estimatedTotalTiles > 0) {
        // Clamp progress to 0-100
        const rawProgress = (loadedTiles / estimatedTotalTiles) * 100;

        // Make progress at least 10% and cap at 95% until fully loaded
        const progress = Math.max(10, Math.min(95, rawProgress));
        onProgressChange(progress);
      } else {
        // Default progress based on time elapsed if we don't know total tiles
        // This ensures progress always moves forward
        const timeProgress = Math.min(
          95,
          10 + ((Date.now() - loadTrackerRef.current.startTime) / 5000) * 85
        );
        onProgressChange(timeProgress);
      }

      // Add time-based incremental progress regardless of tile loading
      // This ensures the progress bar always moves, even if tile events are slow
      const timeSinceStart = Date.now() - loadTrackerRef.current.startTime;
      if (timeSinceStart > 1000 && timeSinceStart % 500 < 100) {
        const timeBonus = Math.min(95, 10 + (timeSinceStart / 8000) * 85);
        onProgressChange(timeBonus);
      }
    };

    // Check if loading is complete
    const checkIfComplete = () => {
      const { loadedTiles, activeTiles, hasLoaded } = loadTrackerRef.current;

      // Consider loaded when we've loaded at least some tiles and no new ones are pending
      if (loadedTiles > 0 && loadedTiles >= activeTiles && !hasLoaded) {
        loadTrackerRef.current.hasLoaded = true;
        onProgressChange(100);
        onTilesLoaded();
      }
    };

    // Setup progress simulation to keep moving even without tile events
    const simulationInterval = setInterval(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        const elapsed = Date.now() - loadTrackerRef.current.startTime;
        const simulatedProgress = Math.min(90, 10 + (elapsed / 10000) * 80);
        onProgressChange(simulatedProgress);
      }
    }, 200);

    // Fallback timer to ensure we exit loading state after a timeout
    const fallbackTimer = setTimeout(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        console.log('Fallback: forcing tile load completion after timeout');
        loadTrackerRef.current.hasLoaded = true;
        onProgressChange(100);
        onTilesLoaded();
      }
    }, 8000); // 8 seconds fallback

    map.on('tileloadstart', handleTileLoadStart);
    map.on('tileload', handleTileLoad);
    map.on('tileerror', handleTileError);

    // Also listen to general map load event as backup
    map.on('load', () => {
      setTimeout(() => {
        if (!loadTrackerRef.current.hasLoaded) {
          loadTrackerRef.current.hasLoaded = true;
          onProgressChange(100);
          onTilesLoaded();
        }
      }, 500);
    });

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(simulationInterval);
      map.off('tileloadstart', handleTileLoadStart);
      map.off('tileload', handleTileLoad);
      map.off('tileerror', handleTileError);
      map.off('load');
    };
  }, [map, onTilesLoaded, onProgressChange]);

  return null;
};

export default TileLoadTracker;
