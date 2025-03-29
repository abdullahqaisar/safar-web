import { useEffect, useCallback, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapResizeHandlerProps {
  setMapRef: (map: L.Map) => void;
  onMapReady: () => void;
}

const MapResizeHandler = ({ setMapRef, onMapReady }: MapResizeHandlerProps) => {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [hasSignaledReady, setHasSignaledReady] = useState(false);

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

  // Set up ResizeObserver for more reliable size detection
  useEffect(() => {
    const mapContainer = map.getContainer();

    if (mapContainer && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        forceResizeMap();
      });

      resizeObserverRef.current.observe(mapContainer);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [map, forceResizeMap]);

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      forceResizeMap();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Force resize on component mount with a series of timed invalidations
    const timers = [
      setTimeout(forceResizeMap, 100),
      setTimeout(() => {
        forceResizeMap();
        if (!hasSignaledReady) {
          setHasSignaledReady(true);
          onMapReady();
        }
      }, 500),
    ];

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [forceResizeMap, onMapReady, hasSignaledReady]);

  return null;
};

export default MapResizeHandler;
