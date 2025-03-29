import { useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import dynamic from 'next/dynamic';
import MapSkeleton from './MapSkeleton';

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
  const mapHeight = '600px';
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 text-[color:var(--color-accent)]" />
          Transit Map
        </h3>
      </div>

      <div
        className="md:col-span-2 rounded-lg shadow-md overflow-hidden"
        ref={mapRef}
        style={{ height: mapHeight, minHeight: '400px' }}
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
              className="h-[600px]"
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

      <MapLegend metroLines={metroLines} />
    </div>
  );
}

function MapLegend({ metroLines }: { metroLines: TransitLine[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {metroLines.map((line) => (
        <div key={line.id} className="flex items-center">
          <div
            className="w-2.5 h-2.5 rounded-full mr-1"
            style={{ backgroundColor: line.color || '#4A5568' }}
          ></div>
          <span className="mr-3">{line.name}</span>
        </div>
      ))}

      <div className="flex items-center ml-4">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-800 bg-white mr-1"></div>
        <span>Transfer Station</span>
      </div>
    </div>
  );
}
