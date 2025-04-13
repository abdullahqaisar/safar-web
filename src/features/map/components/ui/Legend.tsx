import React, { useState, useRef, useEffect } from 'react';
import { Info, Map } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';

interface LegendProps {
  visibleLines: TransitLine[];
  isMobile?: boolean;
}

const Legend: React.FC<LegendProps> = ({ visibleLines, isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  // Group lines by type (regular metro lines and feeder routes)
  const feederRoutes = visibleLines.filter((line) =>
    line.name.startsWith('FR-')
  );

  const regularLines = visibleLines.filter(
    (line) => !line.name.startsWith('FR-')
  );

  // Handle clicks outside the legend to close it (mobile only)
  useEffect(() => {
    if (!isMobile) return; // Only apply for mobile

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
  }, [isExpanded, isMobile]);

  // If no lines are visible, don't show the legend
  if (visibleLines.length === 0) return null;

  // Get the default feeder route color if any exist
  const feederRouteColor =
    feederRoutes.length > 0 ? feederRoutes[0].color : '#4A5568';

  // Common button styles for consistency with other controls
  const buttonClass =
    'bg-white shadow-md border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50';

  if (isMobile) {
    // Mobile legend - positioned as part of the bottom control panel
    return (
      <div ref={legendRef} className="absolute z-10">
        {/* Integrate with the mobile control panel at the bottom */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${buttonClass} h-9 w-9`}
          title="Map legend"
          aria-label="Toggle map legend"
        >
          <Map className="h-4 w-4 text-gray-700" />
        </button>

        {isExpanded && (
          <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 min-w-[180px] max-w-[220px]">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <Map className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
              <span>Legend</span>
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

              <div className="pt-1 mt-1 border-t border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-white border-2 border-gray-800 rounded-full mr-2"></div>
                  <span className="text-xs">Transfer Station</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop legend - positioned at top right near other controls
  return (
    <div className="absolute right-4 top-32 z-10" ref={legendRef}>
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 max-w-[200px]">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
          <Map className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
          <span>Legend</span>
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

          <div className="pt-1 mt-1 border-t border-gray-100">
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
    </div>
  );
};

export default Legend;
