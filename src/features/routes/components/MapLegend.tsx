import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';

interface MapLegendProps {
  visibleLines: TransitLine[];
  isMobile?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({
  visibleLines,
  isMobile = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  // Group lines by type (regular metro lines and feeder routes)
  const feederRoutes = visibleLines.filter((line) =>
    line.name.startsWith('FR-')
  );

  const regularLines = visibleLines.filter(
    (line) => !line.name.startsWith('FR-')
  );

  // Handle clicks outside the legend to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        legendRef.current &&
        !legendRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // If no lines are visible, don't show the legend
  if (visibleLines.length === 0) return null;

  // Get the default feeder route color if any exist
  const feederRouteColor =
    feederRoutes.length > 0 ? feederRoutes[0].color : '#4A5568';

  return (
    <div className="absolute left-4 bottom-4 z-10" ref={legendRef}>
      {isMobile ? (
        // Mobile collapsible legend
        <div className="flex flex-col">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 flex items-center justify-between w-10 h-10"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: visibleLines[0]?.color || '#4A5568' }}
            />
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-600" />
            ) : (
              <ChevronUp className="h-3 w-3 text-gray-600" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 max-w-[200px]">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Legend
              </div>
              <div className="space-y-1.5">
                {/* Regular lines */}
                {regularLines.map((line) => (
                  <div key={line.id} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: line.color }}
                    ></div>
                    <span className="text-xs">{line.name}</span>
                  </div>
                ))}

                {/* Single entry for all feeder routes */}
                {feederRoutes.length > 0 && (
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: feederRouteColor }}
                    ></div>
                    <span className="text-xs">Feeder Routes</span>
                  </div>
                )}

                <div className="pt-1 mt-1 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white border-2 border-gray-800 rounded-full mr-2"></div>
                    <span className="text-xs">Transfer Station</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Desktop legend
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 max-w-[200px]">
          <div className="text-xs font-medium text-gray-600 mb-2">Legend</div>
          <div className="space-y-1.5">
            {/* Regular lines */}
            {regularLines.map((line) => (
              <div key={line.id} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: line.color }}
                ></div>
                <span className="text-xs">{line.name}</span>
              </div>
            ))}

            {/* Single entry for all feeder routes */}
            {feederRoutes.length > 0 && (
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: feederRouteColor }}
                ></div>
                <span className="text-xs">Feeder Routes</span>
              </div>
            )}

            <div className="pt-1 mt-1 border-t border-gray-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white border-2 border-gray-800 rounded-full mr-2"></div>
                <span className="text-xs">Transfer Station</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              <span>Zoom in for more details</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
