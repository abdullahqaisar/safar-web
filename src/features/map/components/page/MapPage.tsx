'use client';

import { useState, useRef, useEffect } from 'react';
import { useLineSelection } from '@/hooks/useLineSelection';
import { useMediaQuery } from '@/hooks/use-media-query';
import PageLayout from './PageLayout';
import PageHeader from '../../../../components/common/PageHeader';
import MapSidebar from '../ui/MapSidebar';
import UnifiedMobileMenu from '../mobile/UnifiedMobileMenu';
import MapContentArea from '../ui/MapContentArea';
import { enhancedMetroLines } from '../../utils/map-helpers';
import { useControlPanel } from '@/hooks/useMapControls';

export default function MapPage() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showInfoPanel] = useState(true); // Always show info panel
  const isMobile = useMediaQuery('(max-width: 768px)');
  const mapContentRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const mapControls = useControlPanel();
  const lineSelection = useLineSelection(enhancedMetroLines);

  // Scroll to map content when line selection changes on both mobile and desktop
  useEffect(() => {
    if (lineSelection.selectedLineId && mapContentRef.current) {
      // Use a short delay to ensure UI has updated
      setTimeout(() => {
        const element = mapContentRef.current;
        if (element) {
          // Calculate position, accounting for the navbar height
          // We use different offsets for mobile vs desktop based on the padding
          const navbarOffset = isMobile ? 140 : 80; // Increased for mobile to account for dropdown
          const yOffset = -20; // Additional offset to show some details

          // Calculate position in the viewport
          const rect = element.getBoundingClientRect();
          const y = rect.top + window.pageYOffset - navbarOffset + yOffset;

          window.scrollTo({
            top: y,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [lineSelection.selectedLineId, isMobile]);

  const handleStationSelect = (stationId: string | null) => {
    // Skip if the same station is already selected
    if (stationId === selectedStation) return;

    setSelectedStation(stationId);

    // Scroll the map into view when station is selected
    if (stationId && mapControls.mapContainerRef.current) {
      setTimeout(() => {
        const mapContainer = mapControls.mapContainerRef.current;
        if (mapContainer) {
          // Calculate position, accounting for the navbar height
          const navbarOffset = isMobile ? 120 : 80; // Increased for mobile to account for dropdown
          const rect = mapContainer.getBoundingClientRect();
          const y = rect.top + window.pageYOffset - navbarOffset;

          window.scrollTo({
            top: y,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  };

  // Handle reset filters and view
  const handleResetFilters = () => {
    lineSelection.showAllLines();
    lineSelection.setSelectedLineId('');
  };

  // Handle line selection
  const handleSelectLine = (lineId: string | undefined) => {
    lineSelection.setSelectedLineId(lineId || '');
  };

  // Handle line visibility toggle
  const handleToggleLine = (lineId: string) => {
    lineSelection.handleLineVisibilityToggle(lineId);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <PageHeader
          title="Transit Network Map"
          description="Explore Pakistan's modern transit network with our interactive map"
        />

        <main className="relative z-10">
          <div className="px-4 sm:px-6 py-2 md:py-6">
            {/* Unified Mobile Menu (dropdown for line selection and visibility) */}
            <div ref={mobileMenuRef} className="md:hidden">
              <UnifiedMobileMenu
                metroLines={enhancedMetroLines}
                selectedLine={lineSelection.selectedLineId || undefined}
                visibleLines={lineSelection.visibleLines}
                onSelectLine={handleSelectLine}
                onToggleLine={handleToggleLine}
                onShowAll={lineSelection.showAllLines}
                onHideAll={lineSelection.hideAllLines}
              />
            </div>

            {/* Map Layout */}
            <div ref={mapContentRef}>
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
                    onStationSelect={handleStationSelect}
                    selectedStation={selectedStation}
                    onResetFilters={handleResetFilters}
                  />
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
