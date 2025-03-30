import { useRef, useState, useEffect } from 'react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import MapSkeleton from './components/MapSkeleton';
import { useMediaQuery } from '@/hooks/use-media-query';
import MapControls from '../routes/components/MapControls';
import MapLegend from '../routes/components/MapLegend';
import type { Map as LeafletMap } from 'leaflet';

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
  showStations?: boolean;
  toggleFullscreen?: () => void;
  toggleStations?: () => void;
  toggleFiltersPanel?: () => void;
}

export default function MapContainer({
  metroLines,
  selectedLine,
  selectedStation,
  onStationSelect,
  isFullscreen = false,
  showStations = true,
  toggleFullscreen = () => {},
  toggleStations = () => {},
  toggleFiltersPanel = () => {},
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  // Add a persistent reference to track if the map has been initialized
  const hasInitializedMapRef = useRef(false);

  // Unified loading state handler with protection against re-initialization
  const handleMapLoadingChange = (state: 'initial' | 'loading' | 'ready') => {
    // Skip loading state changes if we've already initialized the map once
    if (state === 'loading' && hasInitializedMapRef.current) {
      console.log('Map already initialized, skipping loading state change');
      return;
    }

    console.log(`Map loading state changing to: ${state}`);
    setMapLoadingState(state);

    // Mark as initialized when ready state is reached
    if (state === 'ready') {
      hasInitializedMapRef.current = true;
    }

    // Safety fallback - if we're in loading state for too long, force to ready
    if (state === 'loading') {
      const fallbackTimer = setTimeout(() => {
        setMapLoadingState((prev) => {
          if (prev !== 'ready') {
            console.log('Fallback: MapContainer forcing ready state');
            hasInitializedMapRef.current = true;
            return 'ready';
          }
          return prev;
        });
      }, 8000); // 8 second safety timeout

      return () => clearTimeout(fallbackTimer);
    }
  };

  // Handle progress updates - only when not initialized
  const handleProgressChange = (progress: number) => {
    if (!hasInitializedMapRef.current) {
      setLoadingProgress(progress);
    }
  };

  // Ensure map resize on orientation change
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && mapLoadingState === 'ready') {
        // Trigger invalidation of map size
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [mapLoadingState]);

  // Create a stabilized callback for station selection to avoid regenerating
  // the function on each render, which contributes to unnecessary re-renders
  const handleStationSelect = useRef((stationId: string | null) => {
    onStationSelect(stationId);
  });

  // Update the handler ref if the parent handler changes
  useEffect(() => {
    handleStationSelect.current = onStationSelect;
  }, [onStationSelect]);

  // Function to handle fullscreen mode
  const enterFullScreen = () => {
    if (mapRef.current && toggleFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapRef.current.requestFullscreen();
      }
      toggleFullscreen();
    }
  };

  // Zoom handler functions
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
      } catch (error) {
        console.error('Error zooming in:', error);
      }
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
      } catch (error) {
        console.error('Error zooming out:', error);
      }
    }
  };

  // Function to store map instance
  const handleMapInstance = (mapInstance: LeafletMap) => {
    mapInstanceRef.current = mapInstance;
  };

  return (
    <div className="animate-fade-in">
      <div
        className={`relative rounded-xl overflow-hidden bg-white transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50' : 'w-full'
        }`}
        ref={mapRef}
        style={{ height: mapHeight, minHeight: '450px' }}
      >
        {/* Use position relative/absolute to stack the map and loading UI */}
        <div className="relative w-full h-full">
          {/* Always render TransitMap but keep it invisible until ready */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
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
            />
          </div>

          {/* Show skeleton until map is fully ready */}
          {mapLoadingState !== 'ready' && (
            <div className="absolute inset-0 z-10 transition-opacity duration-300 ease-in-out">
              <MapSkeleton
                loadingPhase={mapLoadingState}
                loadingProgress={loadingProgress}
              />
            </div>
          )}

          {/* Map controls */}
          {mapLoadingState === 'ready' && (
            <MapControls
              isFullscreen={isFullscreen}
              showStations={showStations}
              toggleFullscreen={enterFullScreen}
              toggleStations={toggleStations}
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
