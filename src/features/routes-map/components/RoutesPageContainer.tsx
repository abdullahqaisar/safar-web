'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { metroLines } from '@/core/data/metro-data';
import { TransitLine } from '@/core/types/graph';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatScheduleTimes } from '../utils/station-helpers';

// Import components
import PageHeader from './StationInfo/PageHeader';
import MapContainer from './MapDisplay/MapContainer';
import LineDetails from './StationInfo/LineDetails';
import LineSelector from './StationInfo/LineSelector';
import { getLineColor } from '@/lib/utils/route';

// Enhance metro lines data with UI-specific defaults
const enhancedMetroLines: TransitLine[] = metroLines.map((line) => ({
  ...line,
  color: getLineColor(line.id),
}));

export default function RoutesPageContainer() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleStationSelect = (stationId: string | null) => {
    setSelectedStation(stationId);

    // On mobile, scroll the map into view when station is selected
    if (stationId && isMobile) {
      setTimeout(() => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[color:var(--color-bg-cream)]">
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        <PageHeader />

        {/* Main content card with map and details */}
        <Card className="bg-white shadow-md border border-gray-100 p-4 sm:p-6 rounded-xl mb-6">
          <LineSelector
            lines={enhancedMetroLines}
            selectedLine={selectedLine}
            onLineSelect={handleLineSelect}
          />

          {/* Mobile view */}
          {isMobile && (
            <div className="mt-4">
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <LineDetails
                  selectedLineData={selectedLineData}
                  schedule={schedule}
                  onClearSelection={handleClearSelection}
                  onStationSelect={handleStationSelect}
                  isMobile={true}
                />
              </div>

              <div>
                <MapContainer
                  metroLines={enhancedMetroLines}
                  selectedLine={selectedLine || undefined}
                  selectedStation={selectedStation}
                  onStationSelect={handleStationSelect}
                />
              </div>
            </div>
          )}

          {!isMobile && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map section - takes 2/3 of space */}
              <div className="lg:col-span-2">
                <MapContainer
                  metroLines={enhancedMetroLines}
                  selectedLine={selectedLine || undefined}
                  selectedStation={selectedStation}
                  onStationSelect={handleStationSelect}
                />
              </div>

              {/* Details section - 1/3 of space */}
              <div className="lg:col-span-1">
                <LineDetails
                  selectedLineData={selectedLineData}
                  schedule={schedule}
                  onClearSelection={handleClearSelection}
                  onStationSelect={handleStationSelect}
                  isMobile={false}
                />
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
