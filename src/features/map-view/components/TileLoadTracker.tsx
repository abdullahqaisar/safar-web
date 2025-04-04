import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface TileLoadTrackerProps {
  onTilesLoaded: () => void;
}

/**
 * Component that tracks tile loading events to signal when the map is visually ready
 * Uses a debounced approach to account for tile loading timing issues
 */
const TileLoadTracker: React.FC<TileLoadTrackerProps> = ({ onTilesLoaded }) => {
  const map = useMap();
  const loadedCountRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Only clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Set up tile loading event listeners
  useEffect(() => {
    const handleTileLoad = () => {
      loadedCountRef.current += 1;

      // Cancel existing timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Set timeout for debounced completion
      timeoutIdRef.current = setTimeout(() => {
        onTilesLoaded();
      }, 300);
    };

    const handleTileError = () => {
      loadedCountRef.current += 1;

      // For error tiles we still need to count them as loaded
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        onTilesLoaded();
      }, 300);
    };

    // Register tile events
    map.addEventListener('tileload', handleTileLoad);
    map.addEventListener('tileerror', handleTileError);

    // Set a fallback timer in case some tiles never load
    const fallbackTimer = setTimeout(() => {
      onTilesLoaded();
    }, 5000);

    return () => {
      map.removeEventListener('tileload', handleTileLoad);
      map.removeEventListener('tileerror', handleTileError);
      clearTimeout(fallbackTimer);

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [map, onTilesLoaded]);

  return null;
};

export default TileLoadTracker;
