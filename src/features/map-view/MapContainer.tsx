import { useRef, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import MapSkeleton from './MapSkeleton';
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
  const mapRef = useRef<HTMLDivElement>(null);

  // Unified loading state handler with logging for debugging
  const handleMapLoadingChange = (state: 'initial' | 'loading' | 'ready') => {
    console.log(`Map loading state changing to: ${state}`);
    setMapLoadingState(state);

    // Safety fallback - if we're in loading state for too long, force to ready
    if (state === 'loading') {
      const fallbackTimer = setTimeout(() => {
        setMapLoadingState((prev) => {
          if (prev !== 'ready') {
            console.log('Fallback: MapContainer forcing ready state');
            return 'ready';
          }
          return prev;
        });
      }, 8000); // 8 second safety timeout

      return () => clearTimeout(fallbackTimer);
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

  return (
    <div>
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
              onStationSelect={onStationSelect}
              onLoadingChange={handleMapLoadingChange}
            />
          </div>

          {/* Show skeleton until map is fully ready */}
          {mapLoadingState !== 'ready' && (
            <div className="absolute inset-0 z-10 transition-opacity duration-300 ease-in-out">
              <MapSkeleton loadingPhase={mapLoadingState} />
            </div>
          )}
        </div>
      </div>

      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div className="mt-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs flex flex-wrap">
      <div className="w-full md:w-auto flex flex-wrap items-center gap-5">
        {/* Line type indicators */}
        <div className="flex items-center mr-2">
          <div className="w-8 h-1.5 bg-gray-700 mr-2.5 rounded-sm"></div>
          <span className="text-gray-700">Main Route</span>
        </div>
        <div className="flex items-center mr-2">
          <div className="w-8 h-0.5 bg-gray-500 mr-2.5 rounded-sm"></div>
          <span className="text-gray-700">Feeder Route</span>
        </div>

        {/* Station type indicators */}
        <div className="flex items-center mr-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2.5"></div>
          <span className="text-gray-700">Regular Station</span>
        </div>
        <div className="flex items-center mr-2">
          <div className="rounded-full w-3 h-3 bg-white border-2 border-blue-500 mr-2.5"></div>
          <span className="text-gray-700">Transfer Station</span>
        </div>

        {/* Multi-line stations - simplified representation */}
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 outline outline-2 outline-white mr-2.5"></div>
          <span className="text-gray-700">Multi-Line Station</span>
        </div>
      </div>
    </div>
  );
}
