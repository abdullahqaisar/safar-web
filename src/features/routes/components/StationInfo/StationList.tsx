import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/formatters';
import {
  getStationNameById,
  isTransferStation,
  getLinesForStation,
  getLineNameById,
} from '../../utils/station-helpers';
import { getLineColor } from '@/lib/utils/route';

interface StationListProps {
  stations: string[];
  lineId: string;
  lineColor: string;
  onStationSelect: (stationId: string | null) => void;
  maxHeight?: string;
}

export default function StationList({
  stations,
  lineId,
  lineColor,
  onStationSelect,
}: StationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const connectorLineRef = useRef<HTMLDivElement>(null);

  // Effect to adjust connector line on resize
  useEffect(() => {
    const adjustConnectorLine = () => {
      if (!containerRef.current || !connectorLineRef.current) return;

      // Find the first station marker to calculate its center position
      const stationMarker =
        containerRef.current.querySelector('.station-marker');
      if (stationMarker) {
        const markerRect = stationMarker.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Calculate center position relative to container
        const centerX =
          markerRect.left + markerRect.width / 2 - containerRect.left;

        // Apply the calculated position to connector line
        connectorLineRef.current.style.left = `${centerX}px`;
      }
    };

    // Run adjustment immediately after render and after a short delay
    // to ensure it works after layout adjustments
    adjustConnectorLine();
    const timeoutId = setTimeout(adjustConnectorLine, 100);

    // Add resize listener
    window.addEventListener('resize', adjustConnectorLine);

    return () => {
      window.removeEventListener('resize', adjustConnectorLine);
      clearTimeout(timeoutId);
    };
  }, [stations]); // Re-run when stations change

  if (!stations || stations.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
        No station information available.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative p-2 pb-4"
        style={{ height: '100%' }}
      >
        {/* Top shadow indicator for scrollable content */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none z-10"></div>

        {/* Bottom shadow indicator for scrollable content */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none z-10"></div>

        {/* Connector line */}
        <div
          ref={connectorLineRef}
          className="absolute top-0 bottom-0 w-0.5 z-0"
          style={{
            backgroundColor: lineColor,
            opacity: 0.5,
            // Default position (will be adjusted by JS)
            left: '12.5px',
          }}
        ></div>

        {/* Stations list */}
        <ul className="relative space-y-1 z-1 pt-2 pb-2">
          {stations.map((stationId, index) => {
            const isFirst = index === 0;
            const isLast = index === stations.length - 1;
            const stationName = getStationNameById(stationId);
            const isTransfer = isTransferStation(stationId);

            // Get connecting lines for transfer stations
            const connectingLines = isTransfer
              ? getLinesForStation(stationId).filter((line) => line !== lineId)
              : [];

            return (
              <li key={stationId} className="group">
                <button
                  onClick={() => onStationSelect(stationId)}
                  className="w-full text-left flex items-start py-2 px-3 hover:bg-white rounded-lg transition-colors"
                >
                  {/* Station marker */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-3 mt-[2px] station-marker">
                    <div
                      className={cn(
                        'rounded-full z-10',
                        isFirst || isLast
                          ? 'w-4 h-4'
                          : isTransfer
                          ? 'w-3.5 h-3.5 bg-white ring-1 ring-gray-300'
                          : 'w-3 h-3'
                      )}
                      style={{
                        backgroundColor: isFirst
                          ? '#10B981'
                          : isLast
                          ? '#EF4444'
                          : !isTransfer
                          ? lineColor
                          : undefined,
                      }}
                    ></div>
                  </div>

                  {/* Station details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">
                        {stationName}
                      </div>

                      {/* Station badges */}
                      {isFirst && (
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                          Start
                        </span>
                      )}
                      {isLast && (
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                          End
                        </span>
                      )}
                      {isTransfer && !isFirst && !isLast && (
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          Transfer
                        </span>
                      )}
                    </div>

                    {/* Transfer station connections */}
                    {isTransfer && connectingLines.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {connectingLines.map((lineId) => {
                          const lineColor = getLineColor(lineId);
                          const lineName = getLineNameById(lineId);

                          return (
                            <div
                              key={lineId}
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs"
                              style={{
                                backgroundColor: `${lineColor}15`,
                                color: lineColor,
                                boxShadow: `inset 0 0 0 1px ${lineColor}30`,
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: lineColor }}
                              ></div>
                              {lineName}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
