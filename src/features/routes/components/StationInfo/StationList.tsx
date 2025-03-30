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
  maxHeight = '280px',
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

    // Initial adjustment
    adjustConnectorLine();

    // Delayed adjustment to handle any post-render layout changes
    const timeoutId = setTimeout(adjustConnectorLine, 100);

    // Add resize listener
    window.addEventListener('resize', adjustConnectorLine);

    return () => {
      window.removeEventListener('resize', adjustConnectorLine);
      clearTimeout(timeoutId);
    };
  }, [stations]);

  if (!stations || stations.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No station information available.
      </div>
    );
  }

  return (
    <div
      className="station-list-container bg-gray-50 rounded-lg"
      style={{
        height: maxHeight,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top shadow overlay */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />

      {/* Bottom shadow overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />

      {/* Scrollable content area */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-3 pr-1 stations-scroll-container"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 transparent',
        }}
      >
        <div className="relative">
          {/* Connector line - absolute positioned within the scrollable container */}
          <div
            ref={connectorLineRef}
            className="absolute top-0 bottom-0 w-0.5"
            style={{
              backgroundColor: lineColor,
              opacity: 0.5,
              left: '12.5px',
              zIndex: 1,
            }}
          />

          {/* Station list items */}
          <ul className="relative space-y-1 z-2">
            {stations.map((stationId, index) => {
              const isFirst = index === 0;
              const isLast = index === stations.length - 1;
              const stationName = getStationNameById(stationId);
              const isTransfer = isTransferStation(stationId);
              const connectingLines = isTransfer
                ? getLinesForStation(stationId).filter(
                    (line) => line !== lineId
                  )
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
                          'rounded-full',
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
                          zIndex: 2,
                        }}
                      />
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
                                />
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

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .stations-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .stations-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .stations-scroll-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
