import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapResizeHandlerProps {
  setMapRef: (map: L.Map) => void;
  onMapReady: () => void;
}

const MapResizeHandler = ({ setMapRef, onMapReady }: MapResizeHandlerProps) => {
  const map = useMap();

  // Store map reference
  useEffect(() => {
    setMapRef(map);

    // Ensure map is properly sized immediately
    if (map) {
      map.invalidateSize();
    }
  }, [map, setMapRef]);

  // Function to forcefully invalidate the map size
  const forceResizeMap = useCallback(() => {
    if (map) {
      map.invalidateSize();
    }
  }, [map]);

  // Handle window resize events
  useEffect(() => {
    window.addEventListener('resize', forceResizeMap);

    // Force resize on component mount with a series of timed invalidations
    const timers = [
      setTimeout(forceResizeMap, 100),
      setTimeout(() => {
        forceResizeMap();
        onMapReady(); // Signal that the map is ready after all resizing
      }, 500),
    ];

    return () => {
      window.removeEventListener('resize', forceResizeMap);
      timers.forEach(clearTimeout);
    };
  }, [forceResizeMap, onMapReady]);

  return null;
};

export default MapResizeHandler;
