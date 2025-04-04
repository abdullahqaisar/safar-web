import { useRef, useState, useEffect, useCallback } from 'react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/use-media-query';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import type { Map as LeafletMap } from 'leaflet';
import MapSkeleton from './MapSkeleton';

// Load the TransitMap component with improved loading strategy
// The 'ssr: false' is critical for Leaflet which requires browser APIs
const TransitMap = dynamic(() => import('./TransitMap'), {
  loading: () => <MapSkeleton loadingPhase="loading" loadingProgress={30} />,
  ssr: false,
});

interface MapContainerProps {
  metroLines: TransitLine[];
  selectedLine?: string;
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
  toggleFiltersPanel?: () => void;
  onResetFilters?: () => void;
}

export default function MapContainer({
  metroLines,
  selectedLine,
  selectedStation,
  onStationSelect,
  isFullscreen = false,
  toggleFullscreen = () => {},
  toggleFiltersPanel = () => {},
  onResetFilters,
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

  // Simplified loading state management
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  // Handle map ready state
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Resize handler with cleanup
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

  // Create a stabilized callback for station selection
  const handleStationSelect = useCallback(
    (stationId: string | null) => {
      onStationSelect(stationId);
    },
    [onStationSelect]
  );

  // Function to handle fullscreen mode
  const enterFullScreen = useCallback(() => {
    if (mapRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapRef.current.requestFullscreen();
      }
      toggleFullscreen();
    }
  }, [toggleFullscreen]);

  // Zoom handler functions
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
      } catch (error) {
        console.error('Error zooming in:', error);
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
      } catch (error) {
        console.error('Error zooming out:', error);
      }
    }
  }, []);

  // Store map instance reference
  const handleMapInstance = useCallback((mapInstance: LeafletMap) => {
    mapInstanceRef.current = mapInstance;
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
        {/* TransitMap - we no longer need multiple visible/invisible divs */}
        <TransitMap
          metroLines={metroLines}
          selectedLine={selectedLine}
          className="w-full h-full"
          selectedStation={selectedStation}
          onStationSelect={handleStationSelect}
          onMapReady={handleMapReady}
          onMapInstance={handleMapInstance}
          onResetFilters={onResetFilters}
        />

        {/* Map controls - only shown when map is ready */}
        {isMapReady && (
          <MapControls
            isFullscreen={isFullscreen}
            toggleFullscreen={enterFullScreen}
            toggleFiltersPanel={toggleFiltersPanel}
            showMobileControls={isMobile}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        )}

        {/* Map legend - only shown when map is ready */}
        {isMapReady && (
          <MapLegend visibleLines={metroLines} isMobile={isMobile} />
        )}
      </div>
    </div>
  );
}
