import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/use-media-query';
import ControlPanel from '../controls/ControlPanel';
import type { Map as LeafletMap } from 'leaflet';
import LoadingSkeleton from './LoadingSkeleton';

// Load the TransitMapView component with improved loading strategy
// The 'ssr: false' is critical for Leaflet which requires browser APIs
const TransitMapView = dynamic(() => import('./TransitMapView'), {
  loading: () => (
    <LoadingSkeleton loadingPhase="loading" loadingProgress={30} />
  ),
  ssr: false,
});

interface MapContainerProps {
  metroLines: TransitLine[];
  selectedLine?: string;
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
}

export default function MapContainer({
  metroLines,
  selectedLine,
  selectedStation,
  onStationSelect,
  isFullscreen = false,
  toggleFullscreen = () => {},
}: MapContainerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  // Adjust height based on screen size
  const mapHeight = isMobile
    ? '500px'
    : isTablet
      ? '550px'
      : isFullscreen
        ? '100vh'
        : '600px';

  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  // Map event handlers
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Default center coordinates for Islamabad
  const defaultCenter = useMemo<[number, number]>(
    () => [33.6861871107659, 73.048283867797],
    []
  );

  // Function to handle fullscreen mode
  const enterFullScreen = useCallback(() => {
    // Toggle fullscreen on the map container
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (mapRef.current) {
      mapRef.current.requestFullscreen();
    }
    toggleFullscreen();
    // Wait for mapRef to be available
  }, [toggleFullscreen]);

  // Function to center map on default view
  const handleCenterMap = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, 12);
    }
  }, [defaultCenter]);

  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <div
        className={`relative rounded-xl overflow-hidden bg-white transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50' : 'w-full'
        }`}
        ref={mapRef}
        style={{ height: mapHeight, minHeight: '450px' }}
      >
        <TransitMapView
          metroLines={metroLines}
          selectedLine={selectedLine}
          className="w-full h-full"
          selectedStation={selectedStation}
          onStationSelect={onStationSelect}
          onMapReady={handleMapReady}
          onMapInstance={(map) => {
            mapInstanceRef.current = map;
          }}
          isFullscreen={isFullscreen}
        />

        {/* Map controls */}
        {isMapReady && (
          <ControlPanel
            isFullscreen={isFullscreen}
            toggleFullscreen={enterFullScreen}
            showMobileControls={isMobile}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onCenterMap={handleCenterMap}
          />
        )}
      </div>
    </div>
  );
}
