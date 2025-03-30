import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils/formatters';
import {
  getStationNameById,
  isTransferStation,
  getLinesForStation,
  getLineNameById,
} from '../../utils/station-helpers';
import { getLineColor } from '@/lib/utils/route';
import { ArrowRight } from 'lucide-react';

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
  const [activeStationId, setActiveStationId] = useState<string | null>(null);

  // Effect to adjust connector line
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

    adjustConnectorLine();
    const timeoutId = setTimeout(adjustConnectorLine, 100);
    window.addEventListener('resize', adjustConnectorLine);

    return () => {
      window.removeEventListener('resize', adjustConnectorLine);
      clearTimeout(timeoutId);
    };
  }, [stations]);

  const handleStationClick = (stationId: string) => {
    setActiveStationId(stationId);
    onStationSelect(stationId);
  };

  if (!stations || stations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <div>
          <div className="mb-2 text-gray-400">
            <svg
              className="w-10 h-10 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <p className="font-medium">No station information available</p>
        </div>
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
          scrollBehavior: 'smooth',
        }}
      >
        <div className="relative">
          {/* Connector line - with segments to distinguish sections */}
          <div
            ref={connectorLineRef}
            className="absolute top-0 bottom-0"
            style={{
              left: '12.5px',
              zIndex: 1,
            }}
          >
            <div
              className="w-0.5 h-full"
              style={{
                background: `linear-gradient(to bottom, 
                  ${lineColor}80 0%, 
                  ${lineColor} 10%, 
                  ${lineColor} 90%, 
                  ${lineColor}80 100%
                )`,
              }}
            />
          </div>

          {/* Station list items */}
          <ul className="relative space-y-1 z-2">
            {stations.map((stationId, index) => {
              const isFirst = index === 0;
              const isLast = index === stations.length - 1;
              const stationName = getStationNameById(stationId);
              const isTransfer = isTransferStation(stationId);
              const isActive = activeStationId === stationId;

              // Travel time estimation (would be from actual data in production)
              const timeToNext =
                index < stations.length - 1
                  ? Math.floor(Math.random() * 5) + 2
                  : null; // 2-7 min

              const connectingLines = isTransfer
                ? getLinesForStation(stationId).filter(
                    (line) => line !== lineId
                  )
                : [];

              return (
                <li key={stationId}>
                  <div className="relative">
                    {/* Station card */}
                    <button
                      onClick={() => handleStationClick(stationId)}
                      className={cn(
                        'w-full text-left flex items-start py-2 px-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-white shadow-sm border border-gray-100 transform scale-[1.01]'
                          : 'hover:bg-white/80 hover:shadow-sm'
                      )}
                    >
                      {/* Station marker */}
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-3 mt-[2px] station-marker">
                        <div
                          className={cn(
                            'rounded-full transition-all duration-200',
                            isActive && 'ring-2 ring-offset-1',
                            isFirst || isLast
                              ? 'w-4 h-4 ring-offset-gray-50'
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
                        <div className="flex items-center flex-wrap">
                          <div
                            className={cn(
                              'text-sm font-medium transition-colors',
                              isActive
                                ? 'text-emerald-600'
                                : 'text-gray-800 group-hover:text-emerald-600'
                            )}
                          >
                            {stationName}
                          </div>

                          {/* Station badges */}
                          {isFirst && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                              Origin
                            </span>
                          )}
                          {isLast && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                              Destination
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
                          <div className="flex flex-wrap gap-1 mt-1.5">
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

                    {/* Time to next station indicator */}
                    {timeToNext && !isLast && (
                      <div className="ml-[24px] mt-0.5 mb-0.5 flex items-center text-xs text-gray-400 pl-3 py-0.5">
                        <ArrowRight className="h-3 w-3 mr-1 opacity-70" />
                        <span>{timeToNext} min</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Custom scrollbar styles */}
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
        .stations-scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: #a0aec0;
        }
      `}</style>
    </div>
  );
}
