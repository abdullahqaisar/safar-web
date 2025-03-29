import { Button } from '@/components/ui/button';
import { Info, Route } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import LineStationsDisplay from './LineStationsDisplay';
import ScheduleInfo from './ScheduleInfo';
import TicketInfo from './TicketInfo';

interface LineDetailsProps {
  selectedLineData?: TransitLine;
  schedule?: { firstTrain: string; lastTrain: string };
  stationInfo?: { startStation: string; endStation: string };
  onClearSelection: () => void;
  onStationSelect: (stationId: string) => void;
  isMobile?: boolean;
}

export default function LineDetails({
  selectedLineData,
  schedule,
  onClearSelection,
  onStationSelect,
  isMobile = false,
}: LineDetailsProps) {
  if (!selectedLineData) {
    return (
      <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="bg-gray-50 p-3 rounded-full mb-3">
            <Route className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-medium mb-2 text-gray-800">No Line Selected</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Select a metro line from the selector above to view detailed
            information
          </p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{
                backgroundColor: selectedLineData.color || '#4A5568',
              }}
            ></div>
            <h3 className="font-medium text-gray-800">
              {selectedLineData.name}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-3 text-gray-600 hover:bg-gray-50 border-gray-200"
          >
            Clear
          </Button>
        </div>

        <div className="space-y-4">
          <LineStationsDisplay
            lineId={selectedLineData.id}
            lineColor={selectedLineData.color || '#4A5568'}
            stations={selectedLineData.stations}
            onStationSelect={onStationSelect}
          />

          <ScheduleInfo
            frequency={selectedLineData.frequency || 'Every 10 minutes'}
            firstTrain={schedule?.firstTrain || '6:00 AM'}
            lastTrain={schedule?.lastTrain || '11:00 PM'}
            isMobile={true}
          />

          <TicketInfo
            ticketCost={selectedLineData.ticketCost || 60}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium mb-4 flex items-center text-gray-800">
        <Info className="w-4 h-4 mr-2 text-primary" />
        Line Details
      </h3>

      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center">
            <div
              className="w-5 h-5 rounded-full mr-2 shadow-sm"
              style={{
                backgroundColor: selectedLineData.color || '#4A5568',
              }}
            ></div>
            <h3 className="text-lg font-medium text-gray-800">
              {selectedLineData.name}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-600 hover:bg-gray-50 border-gray-200"
          >
            Clear Selection
          </Button>
        </div>

        <div className="mt-5">
          <LineStationsDisplay
            lineId={selectedLineData.id}
            lineColor={selectedLineData.color || '#4A5568'}
            stations={selectedLineData.stations}
            onStationSelect={onStationSelect}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScheduleInfo
            frequency={selectedLineData.frequency || 'Every 10 minutes'}
            firstTrain={schedule?.firstTrain || '6:00 AM'}
            lastTrain={schedule?.lastTrain || '11:00 PM'}
          />

          <TicketInfo ticketCost={selectedLineData.ticketCost || 60} />
        </div>
      </div>
    </div>
  );
}
