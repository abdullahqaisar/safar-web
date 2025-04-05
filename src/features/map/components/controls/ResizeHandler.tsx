import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface ResizeHandlerProps {
  setMapRef: (map: L.Map) => void;
  onMapReady: () => void;
}

const ResizeHandler = ({ setMapRef, onMapReady }: ResizeHandlerProps) => {
  const map = useMap();

  // Store map reference and set up resize handling
  useEffect(() => {
    // Store map reference in parent component
    setMapRef(map);

    // Initial size correction
    map.invalidateSize();

    // Handle resize events
    const handleResize = () => map.invalidateSize();

    // Set up resize observer for container changes
    let resizeObserver: ResizeObserver | null = null;
    const mapContainer = map.getContainer();

    if (mapContainer && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mapContainer);
    }

    // Handle window resize events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Signal map is ready after a short delay to ensure tiles have loaded
    const readyTimer = setTimeout(onMapReady, 500);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(readyTimer);
    };
  }, [map, setMapRef, onMapReady]);

  return null;
};

export default ResizeHandler;
