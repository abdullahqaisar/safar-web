'use client';

import { useState, useRef, useEffect } from 'react';
import { metroLines } from '@/core/data/metro-data';
import { TransitLine } from '@/core/types/graph';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  formatScheduleTimes,
  getStationNameById,
} from '../utils/station-helpers';
import { cn } from '@/lib/utils/formatters';
import { getLineColor } from '@/lib/utils/route';

// Import components
import MapContainer from '../../map-view/MapContainer';
import LineDetails from './StationInfo/LineDetails';
import LineSelector from './StationInfo/LineSelector';
import PageHeader from './PageHeader';
import ScheduleInfo from './StationInfo/ScheduleInfo';
import TicketInfo from './StationInfo/TicketInfo';

// Import icons
import { ChevronRight, Clock } from 'lucide-react';

// Enhance metro lines data with UI-specific defaults
const enhancedMetroLines: TransitLine[] = metroLines.map((line) => ({
  ...line,
  color: getLineColor(line.id),
}));

export default function RoutesPageContainer() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'map' | 'overview'>('overview');
  const mapRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Reset selection when changing views
  useEffect(() => {
    if (activeView === 'overview' && selectedStation) {
      setSelectedStation(null);
    }
  }, [activeView, selectedStation]);

  const handleStationSelect = (stationId: string | null) => {
    setSelectedStation(stationId);

    // On mobile, scroll the map into view when station is selected
    if (stationId && isMobile) {
      setTimeout(() => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    // When a station is selected, ensure we're on the map view
    if (stationId && activeView !== 'map') {
      setActiveView('map');
    }
  };

  const handleLineSelect = (lineId: string) => {
    // If selecting "All Lines" button (empty string) or toggling current selection, set to null
    if (lineId === '' || lineId === selectedLine) {
      setSelectedLine(null);
    } else {
      // Otherwise select the new line
      setSelectedLine(lineId);
    }

    // Clear selected station when changing lines
    setSelectedStation(null);

    // Switch to map view when selecting a line
    setActiveView('map');
  };

  const handleClearSelection = () => {
    setSelectedLine(null);
    setSelectedStation(null);
  };

  // Get the currently selected line data
  const selectedLineData = selectedLine
    ? enhancedMetroLines.find((line) => line.id === selectedLine)
    : undefined;

  // Generate formatted data for display
  const schedule = selectedLineData
    ? formatScheduleTimes(selectedLineData.schedule)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Use the PageHeader component instead of inline header */}
      <PageHeader
        title="Transit"
        activeView={activeView}
        onViewChange={setActiveView}
        hasSelection={!!selectedLine}
        onClearSelection={handleClearSelection}
      />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        {activeView === 'overview' ? (
          <div className="space-y-8">
            {/* Transit lines list - redesigned with cleaner approach */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Transit Lines
              </h2>
              <div className="space-y-3">
                {enhancedMetroLines.map((line) => {
                  // Get station names for first and last stations
                  const startStationName =
                    line.stations && line.stations.length > 0
                      ? getStationNameById(line.stations[0])
                      : 'Starting Point';

                  const endStationName =
                    line.stations && line.stations.length > 0
                      ? getStationNameById(
                          line.stations[line.stations.length - 1]
                        )
                      : 'Ending Point';

                  return (
                    <div
                      key={line.id}
                      className={cn(
                        'bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer',
                        selectedLine === line.id &&
                          'ring-2 ring-[color:var(--color-accent)]/20 border-[color:var(--color-accent)]'
                      )}
                      onClick={() => handleLineSelect(line.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: `${line.color}20` }}
                          >
                            <div
                              className="w-5 h-5 rounded-full"
                              style={{
                                backgroundColor: line.color || '#4A5568',
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {line.name}
                            </h3>
                            <div className="text-xs text-gray-500">
                              {line.stations ? line.stations.length : 0}{' '}
                              stations
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="pl-[52px]">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span
                              className="font-medium text-gray-700 max-w-[120px] truncate"
                              title={startStationName}
                            >
                              {startStationName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="font-medium text-gray-700 max-w-[120px] truncate text-right"
                              title={endStationName}
                            >
                              {endStationName}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {line.frequency || 'Every 10 min'}
                          </div>
                          <div>
                            {line.ticketCost
                              ? `Rs. ${line.ticketCost}`
                              : 'Rs. 30'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Map View */
          <div className="space-y-4">
            {/* Line selector - Clean, minimal design */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <LineSelector
                lines={enhancedMetroLines}
                selectedLine={selectedLine}
                onLineSelect={handleLineSelect}
              />
            </div>

            {/* Mobile view */}
            {isMobile && (
              <div className="space-y-4">
                {selectedLineData && (
                  <div>
                    <LineDetails
                      selectedLineData={selectedLineData}
                      schedule={schedule}
                      onClearSelection={handleClearSelection}
                      onStationSelect={handleStationSelect}
                    />
                  </div>
                )}

                <div
                  ref={mapRef}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                  style={{ height: '400px' }}
                >
                  <MapContainer
                    metroLines={enhancedMetroLines}
                    selectedLine={selectedLine || undefined}
                    selectedStation={selectedStation}
                    onStationSelect={handleStationSelect}
                  />
                </div>
              </div>
            )}

            {/* Desktop view */}
            {!isMobile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Map section - takes 2/3 of space */}
                <div ref={mapRef} className="lg:col-span-2">
                  <div
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                    style={{ height: '600px' }}
                  >
                    <MapContainer
                      metroLines={enhancedMetroLines}
                      selectedLine={selectedLine || undefined}
                      selectedStation={selectedStation}
                      onStationSelect={handleStationSelect}
                    />
                  </div>
                </div>

                {/* Details section - 1/3 of space */}
                <div className="lg:col-span-1">
                  <LineDetails
                    selectedLineData={selectedLineData}
                    schedule={schedule}
                    onClearSelection={handleClearSelection}
                    onStationSelect={handleStationSelect}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
