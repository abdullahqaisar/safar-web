import React from 'react';
import { TransitLine } from '@/core/types/graph';
import { getStationNameById } from '../../utils/station-helpers';
import { Navigation, Route as RouteIcon, Info } from 'lucide-react';
import StationList from './StationList';
import ScheduleInfo from './ScheduleInfo';
import TicketInfo from './TicketInfo';

interface ScheduleType {
  firstTrain?: string;
  lastTrain?: string;
  frequency?: string;
}

interface LineDetailsProps {
  selectedLineData?: TransitLine;
  schedule?: ScheduleType;
  onClearSelection: () => void;
  onStationSelect: (stationId: string | null) => void;
}

export default function LineDetails({
  selectedLineData,
  schedule,
  onClearSelection,
  onStationSelect,
}: LineDetailsProps) {
  if (!selectedLineData) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm h-full p-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <RouteIcon className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Line Selected
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Select a transit line to view detailed route and station information.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-4 py-2 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/90 text-white rounded-lg font-medium text-sm transition-colors"
        >
          Select a Line
        </button>
      </div>
    );
  }

  const lineColor = selectedLineData.color || '#4A5568';
  const defaultSchedule = {
    firstTrain: schedule?.firstTrain || '6:00',
    lastTrain: schedule?.lastTrain || '23:00',
    frequency: selectedLineData.frequency || 'Every 10 minutes',
  };

  // Get station names for displaying route endpoints
  const stationNames = selectedLineData.stations.map((stationId) =>
    getStationNameById(stationId)
  );
  const startStationName = stationNames[0] || 'Unknown';
  const endStationName = stationNames[stationNames.length - 1] || 'Unknown';

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm h-full flex flex-col">
      {/* Line header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner mr-3 flex-shrink-0"
          style={{ backgroundColor: `${lineColor}20` }}
        >
          <div
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {selectedLineData.name}
          </h3>
          <div className="text-xs text-gray-500 flex items-center">
            <div className="flex items-center">{defaultSchedule.frequency}</div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
        {/* Route summary section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <RouteIcon className="w-4 h-4 text-[color:var(--color-accent)] mr-1.5" />
            Route Summary
          </h4>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-1 ring-green-100"></div>
              <div className="flex-grow h-[1px] bg-gray-300 mx-2"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-1 ring-red-100"></div>
            </div>

            <div className="flex justify-between text-sm">
              <div className="max-w-[45%]">
                <div
                  className="font-medium text-gray-800 truncate"
                  title={startStationName}
                >
                  {startStationName}
                </div>
              </div>
              <div className="text-right max-w-[45%]">
                <div
                  className="font-medium text-gray-800 truncate"
                  title={endStationName}
                >
                  {endStationName}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <ScheduleInfo schedule={defaultSchedule} compact={true} />
            <TicketInfo
              ticketCost={selectedLineData.ticketCost}
              compact={true}
            />
          </div>
        </div>

        {/* Stations list section - Now always visible with fixed height */}
        <div className="flex-1 flex flex-col">
          {/* Static header - no longer clickable */}
          <div className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-[color:var(--color-accent)] mr-1.5" />
              All Stations ({selectedLineData.stations.length})
            </div>
          </div>

          {/* Station list - always visible with fixed height */}
          <div
            className="bg-gray-50 rounded-lg overflow-hidden"
            style={{ height: '280px' }}
          >
            <StationList
              stations={selectedLineData.stations}
              lineId={selectedLineData.id}
              lineColor={lineColor}
              onStationSelect={onStationSelect}
              maxHeight="100%"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="w-full h-10 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/90 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
            onClick={() => {
              window.location.href = `/plan-journey?line=${selectedLineData.id}`;
            }}
          >
            <Navigation className="w-4 h-4 mr-1.5" />
            Plan Journey
          </button>

          <button
            className="w-full h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
            onClick={onClearSelection}
          >
            All Lines
          </button>
        </div>
      </div>
    </div>
  );
}
