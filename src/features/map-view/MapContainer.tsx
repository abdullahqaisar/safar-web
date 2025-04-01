import { useRef, useState, useEffect, useCallback } from 'react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import MapSkeleton from './components/MapSkeleton';
import { useMediaQuery } from '@/hooks/use-media-query';
import MapControls from './components/MapControls';
import MapLegend from '../routes/components/MapLegend';
import type { Map as LeafletMap } from 'leaflet';

// Load the TransitMap component dynamically to reduce initial bundle size
const TransitMap = dynamic(() => import('./TransitMap'), {
  loading: () => null, // Don't show anything during code splitting load
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

  const [mapLoadingState, setMapLoadingState] = useState<
    'initial' | 'loading' | 'ready'
  >('initial');
  const [loadingProgress, setLoadingProgress] = useState(10);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  // Track if the map has been fully initialized to prevent reloading states
  const hasInitializedMapRef = useRef(false);
  // Track the highest loading progress value to prevent going backward
  const highestProgressRef = useRef(10);

  // Smooth progress handler to prevent flickering
  const handleProgressChange = useCallback((progress: number) => {
    // Only update if the new progress is higher than what we've seen before
    if (progress > highestProgressRef.current || progress >= 100) {
      highestProgressRef.current = progress;
      setLoadingProgress(progress);
    }
  }, []);

  // Unified loading state handler with protection against re-initialization
  const handleMapLoadingChange = useCallback(
    (state: 'initial' | 'loading' | 'ready') => {
      // Skip loading state changes if we've already initialized the map once
      if (hasInitializedMapRef.current) {
        return;
      }

      // If transitioning to ready state, mark as initialized
      if (state === 'ready') {
        hasInitializedMapRef.current = true;

        // Add a small delay before showing the map to ensure smooth transition
        setTimeout(() => {
          setMapLoadingState('ready');
          handleProgressChange(100);
        }, 500);
        return;
      }

      setMapLoadingState(state);

      // Safety fallback - force ready state after a maximum wait time
      if (state === 'loading') {
        const fallbackTimer = setTimeout(() => {
          if (!hasInitializedMapRef.current) {
            hasInitializedMapRef.current = true;
            setMapLoadingState('ready');
            handleProgressChange(100);
          }
        }, 10000); // 10 second maximum timeout

        return () => clearTimeout(fallbackTimer);
      }
    },
    [handleProgressChange]
  );

  // Ensure map resize on orientation change
  useEffect(() => {
    const handleResize = () => {
      if (
        mapRef.current &&
        mapLoadingState === 'ready' &&
        mapInstanceRef.current
      ) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [mapLoadingState]);

  // Create a stabilized callback for station selection
  const handleStationSelect = useRef((stationId: string | null) => {
    onStationSelect(stationId);
  });

  // Update the handler ref if the parent handler changes
  useEffect(() => {
    handleStationSelect.current = onStationSelect;
  }, [onStationSelect]);

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
        {/* Container for map and loading UI with proper z-stacking */}
        <div className="relative w-full h-full">
          {/* Always render TransitMap but keep it invisible until ready */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              mapLoadingState === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <TransitMap
              metroLines={metroLines}
              selectedLine={selectedLine}
              className="w-full h-full"
              selectedStation={selectedStation}
              onStationSelect={(stationId) =>
                handleStationSelect.current(stationId)
              }
              onLoadingChange={handleMapLoadingChange}
              onProgressChange={handleProgressChange}
              onMapInstance={handleMapInstance}
              onResetFilters={onResetFilters}
            />
          </div>

          {/* Show skeleton until map is fully ready */}
          <div
            className={`absolute inset-0 z-10 transition-opacity duration-500 ease-in-out ${
              mapLoadingState === 'ready'
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
          >
            <MapSkeleton
              loadingPhase={mapLoadingState}
              loadingProgress={loadingProgress}
            />
          </div>

          {/* Map controls */}
          {mapLoadingState === 'ready' && (
            <MapControls
              isFullscreen={isFullscreen}
              toggleFullscreen={enterFullScreen}
              toggleFiltersPanel={toggleFiltersPanel}
              showMobileControls={isMobile}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
          )}

          {/* Map legend */}
          {mapLoadingState === 'ready' && (
            <MapLegend visibleLines={metroLines} isMobile={isMobile} />
          )}
        </div>
      </div>
    </div>
  );
}
