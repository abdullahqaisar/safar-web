import { useRef, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import MapSkeleton from './components/MapSkeleton';
import { useMediaQuery } from '@/hooks/use-media-query';

const TransitMap = dynamic(() => import('./TransitMap'), {
  loading: () => null, // Don't show anything during code splitting load
  ssr: false,
});

interface MapContainerProps {
  metroLines: TransitLine[];
  selectedLine?: string;
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
}

export default function MapContainer({
  metroLines,
  selectedLine,
  selectedStation,
  onStationSelect,
}: MapContainerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  // Adjust height based on screen size - increased for better visibility
  const mapHeight = isMobile ? '500px' : isTablet ? '550px' : '650px';

  const [mapLoadingState, setMapLoadingState] = useState<
    'initial' | 'loading' | 'ready'
  >('initial');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" />
          Transit Map
        </h3>
      </div>

      <div
        className="md:col-span-2 rounded-lg shadow-md overflow-hidden bg-white border border-gray-100"
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
              selectedLine={selectedLine || undefined}
              className="w-full h-full"
              selectedStation={selectedStation}
              onStationSelect={(stationId) =>
                handleStationSelect.current(stationId)
              }
              onLoadingChange={handleMapLoadingChange}
              onProgressChange={handleProgressChange}
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
        </div>
      </div>

      <EnhancedMapLegend />
    </div>
  );
}

function EnhancedMapLegend() {
  return (
    <div className="mt-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h4 className="font-medium text-gray-700 mb-2">Transit Lines</h4>
          <div className="flex flex-col gap-2.5">
            {/* Main routes section */}
            <div className="flex flex-wrap gap-4">
              {/* Main routes with thicker lines */}
              <div className="flex items-center">
                <div className="w-8 h-3 bg-blue-500 mr-2.5 rounded-sm"></div>
                <span className="text-gray-700">Blue Line</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-3 bg-green-500 mr-2.5 rounded-sm"></div>
                <span className="text-gray-700">Green Line</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-3 bg-red-500 mr-2.5 rounded-sm"></div>
                <span className="text-gray-700">Red Line</span>
              </div>
            </div>

            {/* Feeder route with improved dashed line - updated to brighter teal */}
            <div className="flex items-center">
              <div
                className="w-8 h-2 mr-2.5"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, #00D1D1 0px, #00D1D1 6px, transparent 6px, transparent 14px)',
                  backgroundSize: '14px 2px',
                  backgroundRepeat: 'repeat-x',
                  backgroundPosition: 'center',
                }}
              ></div>
              <span className="text-gray-700">Feeder Route</span>
            </div>

            {/* Parallel lines example */}
            <div className="flex items-center mt-1">
              <div className="w-9 h-8 relative mr-2.5">
                <div className="absolute top-1 left-0 right-0 h-2.5 bg-blue-500 rounded-sm"></div>
                <div className="absolute bottom-1 left-0 right-0 h-2.5 bg-green-500 rounded-sm"></div>
              </div>
              <span className="text-gray-700">Parallel Lines</span>
            </div>
          </div>
        </div>

        {/* Station types section - improved styling */}
        <div className="flex flex-col">
          <h4 className="font-medium text-gray-700 mb-2">Station Types</h4>
          <div className="flex flex-wrap gap-4">
            <div
              className="flex items-center tooltip"
              title="Regular station on a single line"
            >
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2.5"></div>
              <span className="text-gray-700">Regular Station</span>
            </div>
            <div
              className="flex items-center tooltip"
              title="Transfer station connecting multiple lines"
            >
              <div className="flex items-center bg-white border border-gray-200 rounded-full px-1.5 py-0.5 mr-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mx-0.5"></div>
                <div className="w-2 h-2 rounded-full bg-green-500 mx-0.5"></div>
              </div>
              <span className="text-gray-700">Transfer Station</span>
            </div>
            <div
              className="flex items-center tooltip"
              title="Currently selected station"
            >
              <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-500 mr-2.5 shadow-sm"></div>
              <span className="text-gray-700">Selected Station</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Zoom in for more detailed station information and route labels
        </div>
      </div>
    </div>
  );
}
