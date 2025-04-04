'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { JourneyErrorFallback } from '@/components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { Button } from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import { SearchSection } from '@/features/journey/components/Search/SearchSection';
import { RouteResultsView } from './Results/RouteResultsView';
import { ArrowLeft } from 'lucide-react';
import { getCachedLocationName } from '@/features/search/services/geocoding.service';
import { PopularDestinations } from './Search/PopularDestinations';
import { JourneyTips } from './Search/JourneyTips';

function JourneyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // States
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDeterminingMode, setIsDeterminingMode] = useState(true);
  const [currentUrlParams, setCurrentUrlParams] = useState('');
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
        // Pass the isFromSharedUrl flag to determine if we should prefer user selections
        // When from a shared URL, we'll still check user selections first (in case this user
        // previously selected these points) but will fall back to reverse geocoding
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

  // Initialize component based on URL parameters
  useEffect(() => {
    if (!searchParams) {
      setIsInitialized(true);
      setIsSearchMode(true);
      setIsDeterminingMode(false);
      return;
    }

    const paramsString = searchParams.toString();

    // Handle empty search params case immediately
    if (paramsString === '') {
      setIsInitialized(true);
      setIsSearchMode(true);
      setIsDeterminingMode(false);
      return;
    }

    if (currentUrlParams !== paramsString) {
      setCurrentUrlParams(paramsString);

      const from = searchParams.get('from');
      const to = searchParams.get('to');

      // Get location text if available
      const fromTextParam = searchParams.get('fromText');
      const toTextParam = searchParams.get('toText');

      let hasValidLocations = false;
      let needsPlaceNames = false;

      // Check if we have valid coordinates
      const hasValidFrom = from && from.includes(',');
      const hasValidTo = to && to.includes(',');

      // Enter search mode if any required params are missing
      if (!hasValidFrom || !hasValidTo) {
        setIsSearchMode(true);
        setIsInitialized(true);
        setIsDeterminingMode(false);
        return;
      }

      // We have valid parameters, exit search mode
      setIsSearchMode(false);

      if (hasValidFrom) {
        const [fromLat, fromLng] = from!.split(',').map(parseFloat);

        if (!isNaN(fromLat) && !isNaN(fromLng)) {
          setFromLocation({
            lat: fromLat,
            lng: fromLng,
          });

          if (fromTextParam) {
            // If text is in URL, use it directly
            setFromText(decodeURIComponent(fromTextParam));
          } else {
            // Set a placeholder until we get the real name
            setFromText('Loading origin...');
            needsPlaceNames = true;
          }

          hasValidLocations = true;
        }
      }

      if (hasValidTo) {
        const [toLat, toLng] = to!.split(',').map(parseFloat);

        if (!isNaN(toLat) && !isNaN(toLng)) {
          setToLocation({
            lat: toLat,
            lng: toLng,
          });

          if (toTextParam) {
            // If text is in URL, use it directly
            setToText(decodeURIComponent(toTextParam));
          } else {
            // Set a placeholder until we get the real name
            setToText('Loading destination...');
            needsPlaceNames = true;
          }

          hasValidLocations = true;
        }
      }

      if (hasValidLocations) {
        setShouldSearch(true);

        // If we need to fetch place names, do so after a small delay
        if (needsPlaceNames) {
          setTimeout(() => {
            const [fromLat, fromLng] = from
              ? from.split(',').map(parseFloat)
              : [undefined, undefined];
            const [toLat, toLng] = to
              ? to.split(',').map(parseFloat)
              : [undefined, undefined];

            fetchMissingPlaceNames(fromLat, fromLng, toLat, toLng);
          }, 1000);
        }
      }
    }

    setIsInitialized(true);
    setIsDeterminingMode(false);
  }, [
    searchParams,
    currentUrlParams,
    setFromLocation,
    setToLocation,
    fetchMissingPlaceNames,
  ]);

  // Handle route searching
  useEffect(() => {
    if (shouldSearch && fromLocation && toLocation && isInitialized) {
      setShouldSearch(false);

      const progressInterval = simulateLoadingProgress();

      setTimeout(async () => {
        try {
          await searchRoutes();
          setLoadingProgress(100);

          clearInterval(progressInterval);
        } catch (err) {
          console.error('Error searching routes:', err);
          clearInterval(progressInterval);
        }
      }, 10);
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

  // Show loading state when determining mode to prevent flicker
  if (isDeterminingMode) {
    return (
      <div className="w-full max-w-[1200px] mx-auto rounded-lg relative">
        <div className="px-0 sm:px-2">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-[color:var(--color-primary)] hover:bg-transparent hover:text-[color:var(--color-accent)]"
              disabled
              leftIcon={<ArrowLeft size={16} />}
              data-variant="ghost"
            >
              Back
            </Button>
          </div>
          <div className="animate-pulse">
            <div className="h-[250px] bg-gray-200 rounded-xl mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Page Header with consistent styling */}
        <div className="py-8 mb-4 page-header">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 mr-2"
                onClick={() => router.push('/')}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">
                {isSearchMode ? 'Plan Your Journey' : 'Journey Options'}
              </h1>
            </div>
            <p className="text-sm md:text-base text-gray-600 max-w-3xl leading-relaxed">
              {isSearchMode
                ? 'Find the best transit routes to get you where you need to go. Enter your starting point and destination.'
                : 'Review available transit options for your selected journey.'}
            </p>
          </div>
        </div>

        <main className="relative z-10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 md:py-6">
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
              <div className="animate-fade-in">
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

            {/* Popular destinations and tips in grid layout matching Routes patterns */}
            {isSearchMode && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <PopularDestinations />
                <JourneyTips />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function JourneyContainer() {
  return (
    <ErrorBoundary fallback={<JourneyErrorFallback />}>
      <JourneyContent />
    </ErrorBoundary>
  );
}
