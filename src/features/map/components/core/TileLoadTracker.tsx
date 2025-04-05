import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface TileLoadTrackerProps {
  onTilesLoaded: () => void;
}

/**
 * Component that tracks tile loading events to signal when the map is visually ready
 */
const TileLoadTracker: React.FC<TileLoadTrackerProps> = ({ onTilesLoaded }) => {
  const map = useMap();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Set up tile loading event listeners
  useEffect(() => {
    const handleTileEvent = () => {
      // Cancel existing timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Set timeout for debounced completion
      timeoutIdRef.current = setTimeout(() => {
        onTilesLoaded();
      }, 300);
    };

    // Register tile events
    map.addEventListener('tileload', handleTileEvent);
    map.addEventListener('tileerror', handleTileEvent);

    // Set a fallback timer in case some tiles never load
    const fallbackTimer = setTimeout(() => {
      onTilesLoaded();
    }, 3000);

    return () => {
      map.removeEventListener('tileload', handleTileEvent);
      map.removeEventListener('tileerror', handleTileEvent);
      clearTimeout(fallbackTimer);

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [map, onTilesLoaded]);

  return null;
};

export default TileLoadTracker;
