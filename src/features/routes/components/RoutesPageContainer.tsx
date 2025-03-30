'use client';

import { useState, useEffect } from 'react';
import { metroLines } from '@/core/data/metro-data';
import { useMapControls } from '@/hooks/useMapControls';
import { useLineSelection } from '@/hooks/useLineSelection';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getLineColor } from '@/lib/utils/route';
import { TransitLine } from '@/core/types/graph';

// Import components
import PageHeader from './PageHeader';
import MapLayout from './MapLayout';
import MapSidebar from './MapSidebar';
import MapContentArea from './MapContentArea';
import MobileLineSelector from './MobileLineSelector';

// Enhance metro lines data with UI-specific defaults
const enhancedMetroLines: TransitLine[] = metroLines.map((line) => ({
  ...line,
  color: getLineColor(line.id),
}));

export default function RoutesPageContainer() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showInfoPanel] = useState(true); // Always show info panel
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use custom hooks
  const mapControls = useMapControls();
  const lineSelection = useLineSelection(enhancedMetroLines);

  // Function to track analytics
  const trackEvent = (eventName: string) => {
    console.log(`Event tracked: ${eventName}`);
    // Implement actual analytics tracking here
  };

  // Track page view on component mount
  useEffect(() => {
    trackEvent('routes_page_viewed');
  }, []);

  const handleStationSelect = (stationId: string | null) => {
    setSelectedStation(stationId);

    // On mobile, scroll the map into view when station is selected
    if (stationId && isMobile && mapControls.mapContainerRef.current) {
      setTimeout(() => {
        const mapContainer = mapControls.mapContainerRef.current;
        if (mapContainer) {
          mapContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Page Header */}
      <PageHeader
        title="Transit Network Map"
        description="Explore Pakistan's modern transit network with our interactive map"
      />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-2 md:py-6">
        {/* Metro line selector dropdown (mobile only) */}
        <MobileLineSelector
          metroLines={enhancedMetroLines}
          selectedLineId={lineSelection.selectedLineId}
          onSelectLine={lineSelection.setSelectedLineId}
        />

        {/* Map Layout */}
        <MapLayout
          sidebar={
            <MapSidebar
              metroLines={enhancedMetroLines}
              selectedLineId={lineSelection.selectedLineId}
              visibleLines={lineSelection.visibleLines}
              onSelectLine={lineSelection.setSelectedLineId}
              onToggleLineVisibility={lineSelection.handleLineVisibilityToggle}
              onShowAll={lineSelection.showAllLines}
              onHideAll={lineSelection.hideAllLines}
            />
          }
          content={
            <MapContentArea
              filteredLines={lineSelection.filteredLines}
              selectedLineId={lineSelection.selectedLineId}
              selectedLineData={lineSelection.selectedLineData}
              isFullscreen={mapControls.isFullscreen}
              showStations={mapControls.showStations}
              showFiltersPanel={mapControls.showFiltersPanel}
              showInfoPanel={showInfoPanel}
              toggleFullscreen={mapControls.toggleFullscreen}
              toggleStations={mapControls.toggleStations}
              toggleFiltersPanel={mapControls.toggleFiltersPanel}
              onStationSelect={handleStationSelect}
              selectedStation={selectedStation}
            />
          }
        />
      </main>
    </div>
  );
}
