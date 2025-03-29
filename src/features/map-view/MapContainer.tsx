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

  // Adjust height based on screen size
  const mapHeight = isMobile ? '450px' : isTablet ? '500px' : '600px';

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

      <MapLegend metroLines={metroLines} />
    </div>
  );
}

function MapLegend({ metroLines }: { metroLines: TransitLine[] }) {
  // Create sample HTML for the multi-line station (pie chart for zoomed out)
  const createMultiStationPieHtml = () => {
    const size = 13;
    const colors = ['#EF4444', '#3B82F6', '#10B981']; // Red, Blue, Green

    // Create pie chart segments
    const segments = colors
      .map((color, i) => {
        const segmentSize = 1 / colors.length;
        const startAngle = i * segmentSize * 2 * Math.PI;
        const endAngle = (i + 1) * segmentSize * 2 * Math.PI;

        // Create a path for a pie segment
        const startX = size / 2 + Math.cos(startAngle) * (size / 2);
        const startY = size / 2 + Math.sin(startAngle) * (size / 2);
        const endX = size / 2 + Math.cos(endAngle) * (size / 2);
        const endY = size / 2 + Math.sin(endAngle) * (size / 2);

        const largeArc = segmentSize > 0.5 ? 1 : 0;

        return `
          <path 
            d="M ${size / 2} ${size / 2} L ${startX} ${startY} A ${size / 2} ${
          size / 2
        } 0 ${largeArc} 1 ${endX} ${endY} Z"
            fill="${color}"
            stroke="#333"
            stroke-width="0.5"
          />
        `;
      })
      .join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2 - 0.5
    }" fill="none" stroke="#333" stroke-width="1"/>
        ${segments}
      </svg>
    `;
  };

  // Create sample HTML for the multi-line station pill (zoomed in)
  const createMultiStationPillHtml = () => {
    const dotSize = 5;
    const dotSpacing = 3;
    const pillPadding = 4;
    const pillWidth = dotSize * 3 + dotSpacing * 2 + pillPadding * 2;
    const pillHeight = dotSize + pillPadding * 2;

    const colors = ['#EF4444', '#3B82F6', '#10B981']; // Red, Blue, Green

    const dots = colors
      .map((color, index) => {
        const leftPosition = pillPadding + index * (dotSize + dotSpacing);
        return `
          <div style="
            position: absolute;
            left: ${leftPosition}px;
            top: 50%;
            transform: translateY(-50%);
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background-color: ${color};
          "></div>
        `;
      })
      .join('');

    return `
      <div style="
        width: ${pillWidth}px;
        height: ${pillHeight}px;
        background-color: white;
        border: 1px solid #333;
        border-radius: ${pillHeight / 2}px;
        position: relative;
      ">
        ${dots}
      </div>
    `;
  };

  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs">
      <div className="flex flex-wrap gap-2 mr-2">
        {metroLines.map((line) => (
          <div key={line.id} className="flex items-center">
            <div
              className="w-2.5 h-2.5 rounded-full mr-1"
              style={{ backgroundColor: line.color || '#4A5568' }}
            ></div>
            <span className="mr-1">{line.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-l pl-3">
        {/* Line type indicators */}
        <div className="flex items-center">
          <div className="w-8 h-1.5 bg-gray-700 mr-1.5"></div>
          <span>Main Route</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gray-500 mr-1.5"></div>
          <span>Feeder Route</span>
        </div>

        {/* Station type indicators */}
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></div>
          <span>Regular Station</span>
        </div>
        <div className="flex items-center">
          <div className="rounded-full w-2.5 h-2.5 bg-white border border-blue-500 mr-1.5"></div>
          <span>Transfer Station</span>
        </div>

        {/* Multi-line station indicators - both zoomed in and out versions */}
        <div className="flex items-center">
          <div
            className="mr-1.5 flex-shrink-0"
            style={{ width: '13px', height: '13px' }}
            dangerouslySetInnerHTML={{ __html: createMultiStationPieHtml() }}
          ></div>
          <span>Multi-Line (Zoomed Out)</span>
        </div>
        <div className="flex items-center">
          <div
            className="mr-1.5 flex-shrink-0"
            style={{ width: '29px', height: '13px' }}
            dangerouslySetInnerHTML={{ __html: createMultiStationPillHtml() }}
          ></div>
          <span>Multi-Line (Zoomed In)</span>
        </div>
      </div>
    </div>
  );
}
