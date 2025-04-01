import React from 'react';
import { TransitLine } from '@/core/types/graph';
import { getStationNameById } from '../../utils/station-helpers';
import {
  Navigation,
  Route as RouteIcon,
  Info,
  Clock,
  Ticket,
} from 'lucide-react';
import StationList from './StationList';

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

// Helper function to get ticket prices
const getTicketPrice = (
  ticketCost:
    | { singleTrip?: number; dayPass?: number }
    | number
    | null
    | undefined,
  type: 'singleTrip' | 'dayPass'
): number => {
  if (!ticketCost) {
    return type === 'singleTrip' ? 50 : 130;
  }

  if (typeof ticketCost === 'object' && ticketCost !== null) {
    return ticketCost[type] || (type === 'singleTrip' ? 50 : 130);
  }

  // If it's just a number
  if (typeof ticketCost === 'number') {
    return type === 'singleTrip' ? ticketCost : Math.round(ticketCost * 2.6);
  }

  return type === 'singleTrip' ? 50 : 130;
};

export default function LineDetails({
  selectedLineData,
  schedule,
  onClearSelection,
  onStationSelect,
}: LineDetailsProps) {
  if (!selectedLineData) {
    return (
      <div className="bg-white rounded-xl h-full flex flex-col p-5">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <RouteIcon className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Line
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-xs">
            Select a metro line to view its details and stations
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Choose from List
          </button>
        </div>
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
    <div className="bg-white rounded-xl h-full flex flex-col">
      {/* Line header */}
      <div className="flex items-center p-5 border-b border-gray-100">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm mr-4 flex-shrink-0"
          style={{ backgroundColor: `${lineColor}20` }}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg">
            {selectedLineData.name}
          </h3>
          <div className="text-sm text-gray-500 flex items-center">
            <div className="flex items-center">{defaultSchedule.frequency}</div>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-auto flex flex-col gap-5">
        {/* Route summary section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <RouteIcon className="w-4 h-4 text-emerald-500 mr-2" />
            Route Summary
          </h4>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-1 ring-green-100"></div>
              <div className="flex-grow h-px bg-gray-300 mx-2"></div>
              <div className="w-3 h-3 rounded-full bg-red-500 ring-1 ring-red-100"></div>
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Schedule info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-700 flex items-center mb-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                Schedule
              </h5>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>First Train:</span>
                  <span className="font-medium">
                    {defaultSchedule.firstTrain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Train:</span>
                  <span className="font-medium">
                    {defaultSchedule.lastTrain}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-700 flex items-center mb-2">
                <Ticket className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                Ticket
              </h5>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Single Trip:</span>
                  <span className="font-medium">
                    Rs.{' '}
                    {getTicketPrice(selectedLineData.ticketCost, 'singleTrip')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stations list section */}
        <div className="flex-1 flex flex-col">
          <div className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-emerald-500 mr-2" />
              All Stations ({selectedLineData.stations.length})
            </div>
          </div>

          {/* Station list - always visible with fixed height */}
          <div
            className="bg-gray-50 rounded-lg overflow-hidden flex flex-col"
            style={{ height: '280px' }}
          >
            <StationList
              stations={selectedLineData.stations}
              lineId={selectedLineData.id}
              lineColor={lineColor}
              onStationSelect={onStationSelect}
              maxHeight="280px"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <button
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
            onClick={() => {
              window.location.href = `/route`;
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
