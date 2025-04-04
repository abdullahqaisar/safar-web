'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { JourneyErrorFallback } from '@/components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { SearchSection } from '@/features/journey/components/Search/SearchSection';
import { RouteResultsView } from './Results/RouteResultsView';
import { getCachedLocationName } from '@/features/search/services/geocoding.service';
import { PopularDestinations } from './Search/PopularDestinations';
import { JourneyTips } from './Search/JourneyTips';
import PageHeader from '@/components/common/PageHeader';
import PageLayout from '@/features/routes/components/MapLayout';

/**
 * JourneyHeader component renders the page header immediately
 * This is extracted to allow the header to render before the rest of the content
 */
function JourneyHeader({ isSearchMode = true }) {
  const router = useRouter();

  return (
    <PageHeader
      title={isSearchMode ? 'Plan Your Journey' : 'Journey Options'}
      description={
        isSearchMode
          ? 'Find the best transit routes to get you where you need to go. Enter your starting point and destination.'
          : 'Review available transit options for your selected journey.'
      }
      showBackButton
      onBackClick={() => router.push('/')}
    />
  );
}

function JourneyContent() {
  const searchParams = useSearchParams();

  // Journey hook for route search functionality
  const {
    routes,
    isLoading,
    error,
    fromLocation,
    toLocation,
    setFromLocation,
    setToLocation,
    searchRoutes,
  } = useJourney();

  // Determine initial state from URL immediately to avoid flicker
  const hasInitialSearchParams = useMemo(() => {
    if (!searchParams) return false;

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    return Boolean(from && to && from.includes(',') && to.includes(','));
  }, [searchParams]);

  // UI states
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDeterminingMode] = useState(false); // Set to false initially to avoid flicker
  const [shouldSearch, setShouldSearch] = useState(false);
  const [fromText, setFromText] = useState<string | null>(null);
  const [toText, setToText] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingPlaceNames, setIsLoadingPlaceNames] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(!hasInitialSearchParams);

  // Progress simulation for loading state
  const simulateLoadingProgress = useCallback(() => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);

    return interval;
  }, []);

  // Place name fetching functionality
  const fetchMissingPlaceNames = useCallback(
    async (
      fromLat?: number,
      fromLng?: number,
      toLat?: number,
      toLng?: number
    ) => {
      if (!fromLat || !fromLng || !toLat || !toLng) return;

      setIsLoadingPlaceNames(true);

      try {
        // Load place names in parallel
        const [fromPlaceName, toPlaceName] = await Promise.all([
          getCachedLocationName(fromLat, fromLng, true),
          getCachedLocationName(toLat, toLng, true),
        ]);

        setFromText(fromPlaceName);
        setToText(toPlaceName);
      } catch (error) {
        console.error('Error fetching place names:', error);
      } finally {
        setIsLoadingPlaceNames(false);
      }
    },
    []
  );

  // Setup UI on mount to avoid flicker - no useEffect for initial render
  useMemo(() => {
    if (!searchParams) {
      setIsSearchMode(true);
      setIsInitialized(true);
      return;
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const fromTextParam = searchParams.get('fromText');
    const toTextParam = searchParams.get('toText');

    // Check validity
    const hasValidFrom = from && from.includes(',');
    const hasValidTo = to && to.includes(',');

    // Set initial mode based on URL params
    if (!hasValidFrom || !hasValidTo) {
      setIsSearchMode(true);
      setIsInitialized(true);
      return;
    }

    // We have valid params, process them
    setIsSearchMode(false);

    // Process location coordinates
    if (hasValidFrom) {
      const [fromLat, fromLng] = from!.split(',').map(parseFloat);
      if (!isNaN(fromLat) && !isNaN(fromLng)) {
        setFromLocation({ lat: fromLat, lng: fromLng });
        setFromText(
          fromTextParam
            ? decodeURIComponent(fromTextParam)
            : 'Loading origin...'
        );
      }
    }

    if (hasValidTo) {
      const [toLat, toLng] = to!.split(',').map(parseFloat);
      if (!isNaN(toLat) && !isNaN(toLng)) {
        setToLocation({ lat: toLat, lng: toLng });
        setToText(
          toTextParam
            ? decodeURIComponent(toTextParam)
            : 'Loading destination...'
        );
      }
    }

    // Set initial states
    setIsInitialized(true);
    setShouldSearch(true);
  }, [searchParams, setFromLocation, setToLocation]);

  // Fetch place names if needed - run only after initial render
  useEffect(() => {
    if (isInitialized && shouldSearch && fromLocation && toLocation) {
      const fromTextParam = searchParams?.get('fromText');
      const toTextParam = searchParams?.get('toText');

      if (!fromTextParam || !toTextParam) {
        fetchMissingPlaceNames(
          fromLocation.lat,
          fromLocation.lng,
          toLocation.lat,
          toLocation.lng
        );
      }
    }
  }, [
    isInitialized,
    shouldSearch,
    fromLocation,
    toLocation,
    searchParams,
    fetchMissingPlaceNames,
  ]);

  // Handle route searching
  useEffect(() => {
    if (shouldSearch && fromLocation && toLocation && isInitialized) {
      setShouldSearch(false);
      const progressInterval = simulateLoadingProgress();

      // Small delay to allow UI to update before heavy processing
      const timer = setTimeout(async () => {
        try {
          await searchRoutes();
          setLoadingProgress(100);
          clearInterval(progressInterval);
        } catch (err) {
          console.error('Error searching routes:', err);
          clearInterval(progressInterval);
        }
      }, 10);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [
    shouldSearch,
    fromLocation,
    toLocation,
    searchRoutes,
    isInitialized,
    simulateLoadingProgress,
  ]);

  // Handle errors
  useEffect(() => {
    if (error && error instanceof Error) {
      showError(
        error.message || 'An error occurred while searching for routes'
      );
    }
  }, [error]);

  // Loading skeleton with consistent design - shouldn't be needed anymore
  if (isDeterminingMode) {
    return (
      <>
        <JourneyHeader isSearchMode={true} />
        <main className="relative z-10">
          <div className="px-4 sm:px-6 py-2 md:py-6">
            <div className="max-w-[1200px] mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
                <div className="h-48 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header renders instantly, even before rest of content loads */}
      <JourneyHeader isSearchMode={isSearchMode} />

      <main className="relative z-10">
        <div className="px-4 sm:px-6 py-2 md:py-6">
          <PageLayout
            showSidebar={false}
            content={
              <div>
                {/* Simplified SearchSection placement */}
                <SearchSection
                  fromText={fromText || ''}
                  toText={toText || ''}
                  isResultsPage={!isSearchMode}
                  isSearchMode={isSearchMode}
                  isLoading={isLoading || isLoadingPlaceNames}
                />

                {/* Results view with consistent styling */}
                {isInitialized && !isSearchMode && (
                  <div className="animate-fade-in mt-6">
                    <RouteResultsView
                      isLoading={isLoading}
                      loadingProgress={loadingProgress}
                      routes={routes}
                      error={error}
                      fromText={fromText}
                      toText={toText}
                    />
                  </div>
                )}

                {/* Popular destinations and tips in grid layout */}
                {isSearchMode && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <PopularDestinations />
                    <JourneyTips />
                  </div>
                )}
              </div>
            }
          />
        </div>
      </main>
    </>
  );
}

export function JourneyContainer() {
  return (
    <ErrorBoundary fallback={<JourneyErrorFallback />}>
      <JourneyContent />
    </ErrorBoundary>
  );
}
