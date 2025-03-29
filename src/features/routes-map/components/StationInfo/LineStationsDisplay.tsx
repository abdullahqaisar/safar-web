import { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getStationNameById,
  isTransferStation,
  getLinesForStation,
} from '../../utils/station-helpers';
import { motion, AnimatePresence } from 'framer-motion';

type Station = {
  id: string;
  name: string;
  isMajor?: boolean;
  isTransfer?: boolean;
  connections?: string[];
};

interface LineStationsDisplayProps {
  lineId: string;
  lineColor: string;
  stations: Station[] | string[];
  onStationSelect: (stationId: string) => void;
}

export default function LineStationsDisplay({
  lineId,
  lineColor,
  stations,
  onStationSelect,
}: LineStationsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stationsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );

  // Process stations to ensure they're in the correct format
  const processedStations: Station[] = stations.map((station) => {
    if (typeof station === 'string') {
      const stationName = getStationNameById(station);
      const stationIsTransfer = isTransferStation(station);
      const stationConnections = stationIsTransfer
        ? getLinesForStation(station).filter((line) => line !== lineId)
        : [];

      return {
        id: station,
        name: stationName,
        isMajor: stationIsTransfer,
        isTransfer: stationIsTransfer,
        connections: stationConnections,
      };
    }
    return {
      ...(station as Station),
      isTransfer: isTransferStation((station as Station).id),
      connections: getLinesForStation((station as Station).id).filter(
        (line) => line !== lineId
      ),
    };
  });

  const startStation = processedStations[0];
  const endStation = processedStations[processedStations.length - 1];
  const transferStationsCount = processedStations.filter(
    (station) => station.isTransfer
  ).length;
  const stationsCount = processedStations.length;
  const duration = Math.round(stationsCount * 2.5); // Rough estimate of journey time

  const handleStationClick = (stationId: string) => {
    onStationSelect(stationId);
    setSelectedStationId(stationId);
  };

  // Get a formatted line name (for badges)
  const getLineLabel = (lineId: string): string => {
    return lineId.startsWith('fr_')
      ? lineId.replace('fr_', 'FR-').toUpperCase()
      : lineId.toUpperCase();
  };

  // Get a color for a line
  const getLineColor = (lineId: string): string => {
    switch (lineId) {
      case 'red':
        return '#E53E3E';
      case 'green':
        return '#38A169';
      case 'blue':
        return '#3182CE';
      case 'orange':
        return '#ED8936';
      default:
        return lineId.startsWith('fr_') ? '#0D9488' : '#4A5568';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Route summary card */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium flex items-center text-gray-800">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            <span>Route Summary</span>
          </h4>

          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
              <Clock className="w-3 h-3 mr-1 opacity-70" />
              <span>~{duration} min</span>
            </div>
            <div className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
              <Users className="w-3 h-3 mr-1 opacity-70" />
              <span>
                {transferStationsCount} transfer
                {transferStationsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Terminal stations overview in a single line */}
        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => handleStationClick(startStation.id)}
              className="text-sm font-medium text-left hover:text-primary transition-colors focus:outline-none text-gray-800 block"
            >
              {startStation.name}
            </button>
            <Badge
              variant="secondary"
              className="mt-1 text-xs bg-green-100 text-green-800 border-0"
            >
              Start
            </Badge>
          </div>

          <ArrowRight className="flex-shrink-0 mx-2 text-gray-400 w-4 h-4" />

          <div className="flex-1 text-right">
            <button
              onClick={() => handleStationClick(endStation.id)}
              className="text-sm font-medium text-right hover:text-primary transition-colors focus:outline-none text-gray-800 block ml-auto"
            >
              {endStation.name}
            </button>
            <div className="flex justify-end">
              <Badge
                variant="secondary"
                className="mt-1 text-xs bg-red-100 text-red-800 border-0"
              >
                End
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle for full station list */}
      <div className="border-t border-gray-100">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 rounded-none flex items-center justify-between hover:bg-gray-50 text-gray-700"
        >
          <span className="text-sm font-medium">
            {isExpanded
              ? 'Hide All Stations'
              : `View All Stations (${processedStations.length})`}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </Button>

        {/* Expanded station list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div
                ref={stationsContainerRef}
                className="max-h-[350px] overflow-y-auto p-3"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 transparent',
                }}
              >
                <div className="relative">
                  {/* Line connecting stations */}
                  <div
                    className="absolute left-1.5 top-6 bottom-6 w-0.5 rounded-full"
                    style={{ backgroundColor: lineColor, opacity: 0.4 }}
                  ></div>

                  {/* Stations list */}
                  <ul className="relative z-10 space-y-2">
                    {processedStations.map((station, index) => {
                      const isFirst = index === 0;
                      const isLast = index === processedStations.length - 1;
                      const isActive = station.id === selectedStationId;

                      return (
                        <li key={`${lineId}-${station.id}`}>
                          <div className="relative flex items-start">
                            {/* Station marker */}
                            <div
                              className={`shrink-0 w-3 h-3 rounded-full mt-1.5 relative z-10
                                ${
                                  isActive
                                    ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-400'
                                    : ''
                                }
                                ${station.isTransfer ? 'ring-1 ring-white' : ''}
                              `}
                              style={{
                                backgroundColor: isFirst
                                  ? '#22C55E'
                                  : isLast
                                  ? '#EF4444'
                                  : station.isTransfer
                                  ? 'white'
                                  : lineColor,
                                border:
                                  station.isTransfer && !isFirst && !isLast
                                    ? `1.5px solid ${lineColor}`
                                    : 'none',
                              }}
                            />

                            {/* Station content */}
                            <div className="ml-3 flex-1 min-w-0">
                              <div
                                className={`
                                  ${
                                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                                  } 
                                  -ml-3 py-1.5 px-3 rounded-md transition-colors
                                `}
                              >
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() =>
                                      handleStationClick(station.id)
                                    }
                                    className={`
                                      text-sm text-left focus:outline-none flex-1
                                      ${isFirst || isLast ? 'font-medium' : ''}
                                      ${
                                        isActive
                                          ? 'text-blue-700'
                                          : 'text-gray-800 hover:text-gray-900'
                                      }
                                    `}
                                  >
                                    {station.name}
                                  </button>

                                  {/* Station status badges */}
                                  <div className="flex gap-1 ml-2 flex-shrink-0">
                                    {isFirst && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 border-0 text-[10px] px-1.5 py-0"
                                      >
                                        START
                                      </Badge>
                                    )}
                                    {isLast && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-red-100 text-red-800 border-0 text-[10px] px-1.5 py-0"
                                      >
                                        END
                                      </Badge>
                                    )}
                                    {station.isTransfer && (
                                      <Badge
                                        variant="outline"
                                        className="bg-gray-50 text-gray-600 text-[10px] px-1.5 py-0 border-gray-200"
                                      >
                                        Transfer
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Connection lines - only show if there are connections */}
                                {station.connections &&
                                  station.connections.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {station.connections.map(
                                        (connectionId) => (
                                          <div
                                            key={connectionId}
                                            className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-gray-100"
                                          >
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  getLineColor(connectionId),
                                              }}
                                            />
                                            <span className="text-[10px] text-gray-600 font-medium">
                                              {getLineLabel(connectionId)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
