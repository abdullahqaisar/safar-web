'use client';

import { useState, useEffect } from 'react';
import { metroLines } from '@/core/data/metro-data';
import { useMapControls } from '@/hooks/useMapControls';
import { useLineSelection } from '@/hooks/useLineSelection';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getLineColor } from '@/lib/utils/route';
import { TransitLine } from '@/core/types/graph';

// Import components
import PageLayout from './MapLayout';
import PageHeader from '../../../components/common/PageHeader';
import MapSidebar from './MapSidebar';
import MapContentArea from './MapContentArea';
import MobileLineSelector from './MobileLineSelector';
import MobileFilterPanel from './MobileFilterPanel';

// Enhance metro lines data with UI-specific defaults
const enhancedMetroLines: TransitLine[] = metroLines.map((line) => ({
  ...line,
  color: getLineColor(line.id),
}));

export default function RoutesPageContainer() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showInfoPanel] = useState(true); // Always show info panel
  const [showMobileFilterPanel, setShowMobileFilterPanel] = useState(false);
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

  // Handle toggling the mobile filter panel
  const handleToggleMobileFilterPanel = () => {
    setShowMobileFilterPanel((prev) => !prev);

    // Track analytics
    trackEvent(
      showMobileFilterPanel
        ? 'mobile_filter_panel_closed'
        : 'mobile_filter_panel_opened'
    );
  };

  // Handle reset filters and view
  const handleResetFilters = () => {
    lineSelection.showAllLines();
    lineSelection.setSelectedLineId('');
    trackEvent('filters_reset');
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Page Header with PageHeader component */}
        <PageHeader
          title="Transit Network Map"
          description="Explore Pakistan's modern transit network with our interactive map"
        />

        <main className="relative z-10">
          <div className="px-4 sm:px-6 py-2 md:py-6">
            {/* Metro line selector dropdown (mobile only) */}
            <MobileLineSelector
              metroLines={enhancedMetroLines}
              selectedLineId={lineSelection.selectedLineId}
              onSelectLine={lineSelection.setSelectedLineId}
            />

            {/* Map Layout */}
            <PageLayout
              sidebar={
                <MapSidebar
                  metroLines={enhancedMetroLines}
                  selectedLineId={lineSelection.selectedLineId}
                  visibleLines={lineSelection.visibleLines}
                  onSelectLine={lineSelection.setSelectedLineId}
                  onToggleLineVisibility={
                    lineSelection.handleLineVisibilityToggle
                  }
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
                  showInfoPanel={showInfoPanel}
                  toggleFullscreen={mapControls.toggleFullscreen}
                  toggleFiltersPanel={handleToggleMobileFilterPanel}
                  onStationSelect={handleStationSelect}
                  selectedStation={selectedStation}
                  onResetFilters={handleResetFilters}
                />
              }
            />

            {/* Mobile Filter Panel */}
            <MobileFilterPanel
              isOpen={showMobileFilterPanel}
              onClose={() => setShowMobileFilterPanel(false)}
              metroLines={enhancedMetroLines}
              visibleLines={lineSelection.visibleLines}
              onToggleLineVisibility={lineSelection.handleLineVisibilityToggle}
              onShowAll={lineSelection.showAllLines}
              onHideAll={lineSelection.hideAllLines}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
