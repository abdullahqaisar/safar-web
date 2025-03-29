import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface TileLoadTrackerProps {
  onTilesLoaded: () => void;
}

const TileLoadTracker = ({ onTilesLoaded }: TileLoadTrackerProps) => {
  const map = useMap();
  const loadTrackerRef = useRef({ hasLoaded: false });

  useEffect(() => {
    // Improved tile loading tracking that counts tiles
    let activeTiles = 0;
    let loadedTiles = 0;

    const handleTileLoadStart = () => {
      activeTiles++;
    };

    const handleTileLoad = () => {
      loadedTiles++;

      // Consider loaded when we've loaded at least some tiles and no new ones are pending
      if (
        loadedTiles > 0 &&
        loadedTiles >= activeTiles &&
        !loadTrackerRef.current.hasLoaded
      ) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    };

    const handleTileError = () => {
      loadedTiles++;

      if (loadedTiles >= activeTiles && !loadTrackerRef.current.hasLoaded) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    };

    // Fallback timer to ensure we exit loading state after a timeout
    const fallbackTimer = setTimeout(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    }, 4000); // 4 seconds fallback

    map.on('tileloadstart', handleTileLoadStart);
    map.on('tileload', handleTileLoad);
    map.on('tileerror', handleTileError);

    // Also listen to general map load event as backup
    map.on('load', () => {
      setTimeout(() => {
        if (!loadTrackerRef.current.hasLoaded) {
          loadTrackerRef.current.hasLoaded = true;
          onTilesLoaded();
        }
      }, 500);
    });

    return () => {
      clearTimeout(fallbackTimer);
      map.off('tileloadstart', handleTileLoadStart);
      map.off('tileload', handleTileLoad);
      map.off('tileerror', handleTileError);
      map.off('load');
    };
  }, [map, onTilesLoaded]);

  return null;
};

export default TileLoadTracker;
