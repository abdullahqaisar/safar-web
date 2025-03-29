'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { stationData } from '@/core/data/station-data';
import {
  isTransferStation,
  getLinesForStation,
} from '../../utils/station-helpers';

interface StationListProps {
  stationIds: string[];
  lineColor?: string;
}

export default function StationList({
  stationIds,
  lineColor = '#4A5568',
}: StationListProps) {
  // Get station names and coordinates from IDs
  const stations = stationIds.map((id) => {
    const stationInfo = stationData.find((s) => s.id === id);
    return {
      id,
      name: stationInfo?.name || id,
      isTransfer: isTransferStation(id),
      connectingLines: getLinesForStation(id),
    };
  });

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium mb-3 text-gray-800">Stations</h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-1 relative">
          {/* Vertical line connecting stations */}
          <div
            className="absolute left-4 top-6 bottom-6 w-0.5 rounded-full"
            style={{ backgroundColor: lineColor, opacity: 0.4 }}
          ></div>

          {stations.map((station, index) => (
            <div
              key={station.id}
              className="flex items-center py-2 hover:bg-gray-50 rounded-md px-2 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: station.isTransfer ? 'white' : lineColor,
                  border: station.isTransfer
                    ? `2px solid ${lineColor}`
                    : 'none',
                }}
              >
                <MapPin
                  size={16}
                  className={
                    station.isTransfer ? 'text-gray-800' : 'text-white'
                  }
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-800">
                    {station.name}
                  </p>
                  {station.isTransfer && (
                    <Badge
                      variant="outline"
                      className="text-xs ml-2 bg-gray-50"
                    >
                      Transfer
                    </Badge>
                  )}
                </div>

                {index === 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs mt-1 bg-green-100 text-green-800 border-0"
                  >
                    Start
                  </Badge>
                )}

                {index === stations.length - 1 && (
                  <Badge
                    variant="secondary"
                    className="text-xs mt-1 bg-red-100 text-red-800 border-0"
                  >
                    End
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
