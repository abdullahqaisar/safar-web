import React, { useState } from 'react';
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
  const [activeStationId, setActiveStationId] = useState<string | null>(null);

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
        className="h-full overflow-y-auto p-3 pr-1 stations-scroll-container"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 transparent',
          scrollBehavior: 'smooth',
        }}
      >
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: '12.5px',
              width: '2px',
              zIndex: 1,
              background: `linear-gradient(to bottom, 
                ${lineColor}80 0%, 
                ${lineColor} 10%, 
                ${lineColor} 90%, 
                ${lineColor}80 100%
              )`,
            }}
          />

          {/* Station list items */}
          <ul className="relative space-y-1 z-2">
            {stations.map((stationId, index) => {
              const isFirst = index === 0;
              const isLast = index === stations.length - 1;
              const stationName = getStationNameById(stationId);
              const isTransfer = isTransferStation(stationId);
              const isActive = activeStationId === stationId;

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
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 text-sm">
                            {stationName}
                          </div>
                          {isTransfer && (
                            <div className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded-full">
                              Transfer
                            </div>
                          )}
                        </div>

                        {/* Connection details */}
                        {connectingLines.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {connectingLines.map((connectingLineId) => {
                              const lineName =
                                getLineNameById(connectingLineId);
                              // Use light teal color for feeder routes
                              const isFeeder =
                                connectingLineId.startsWith('fr_') ||
                                connectingLineId.startsWith('F') ||
                                connectingLineId
                                  .toLowerCase()
                                  .includes('feeder');
                              const lineColor = isFeeder
                                ? '#4FD1C5'
                                : getLineColor(connectingLineId);
                              return (
                                <div
                                  key={connectingLineId}
                                  className="flex items-center text-xs"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                    style={{ backgroundColor: lineColor }}
                                  ></span>
                                  <span className="text-gray-600 truncate">
                                    {lineName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
