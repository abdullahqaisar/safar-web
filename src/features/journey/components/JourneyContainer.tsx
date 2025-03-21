'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUrlParams, setCurrentUrlParams] = useState('');
  const [shouldSearch, setShouldSearch] = useState(false);
  const [fromText, setFromText] = useState<string | null>(null);
  const [toText, setToText] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingPlaceNames, setIsLoadingPlaceNames] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

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

  // New function to fetch missing place names
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

  useEffect(() => {
    if (!searchParams) {
      setIsInitialized(true);
      setIsSearchMode(true);
      return;
    }

    const paramsString = searchParams.toString();
    if (paramsString === '') {
      setIsSearchMode(true);
      setIsInitialized(true);
      return;
    }

    if (currentUrlParams !== paramsString) {
      setCurrentUrlParams(paramsString);

      const fromLat = searchParams.get('fromLat');
      const fromLng = searchParams.get('fromLng');
      const toLat = searchParams.get('toLat');
      const toLng = searchParams.get('toLng');

      // Get location text if available
      const fromTextParam = searchParams.get('fromText');
      const toTextParam = searchParams.get('toText');

      let hasValidLocations = false;
      let needsPlaceNames = false;

      // Check if we have valid coordinates
      const hasValidFrom =
        fromLat &&
        fromLng &&
        !isNaN(parseFloat(fromLat)) &&
        !isNaN(parseFloat(fromLng));

      const hasValidTo =
        toLat &&
        toLng &&
        !isNaN(parseFloat(toLat)) &&
        !isNaN(parseFloat(toLng));

      // Enter search mode if any required params are missing
      if (!hasValidFrom || !hasValidTo) {
        setIsSearchMode(true);
        setIsInitialized(true);
        return;
      }

      // We have valid parameters, exit search mode
      setIsSearchMode(false);

      if (hasValidFrom) {
        const fromLatNum = parseFloat(fromLat!);
        const fromLngNum = parseFloat(fromLng!);

        setFromLocation({
          lat: fromLatNum,
          lng: fromLngNum,
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

      if (hasValidTo) {
        const toLatNum = parseFloat(toLat!);
        const toLngNum = parseFloat(toLng!);

        setToLocation({
          lat: toLatNum,
          lng: toLngNum,
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

      if (hasValidLocations) {
        setShouldSearch(true);

        // If we need to fetch place names, do so after a small delay
        // to ensure Google Maps API is fully loaded
        if (needsPlaceNames) {
          setTimeout(() => {
            fetchMissingPlaceNames(
              fromLat ? parseFloat(fromLat) : undefined,
              fromLng ? parseFloat(fromLng) : undefined,
              toLat ? parseFloat(toLat) : undefined,
              toLng ? parseFloat(toLng) : undefined
            );
          }, 1000);
        }
      }
    }

    setIsInitialized(true);
  }, [
    searchParams,
    currentUrlParams,
    setFromLocation,
    setToLocation,
    fetchMissingPlaceNames,
  ]);

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

  useEffect(() => {
    if (error && error instanceof Error) {
      showError(
        error.message || 'An error occurred while searching for routes'
      );
    }
  }, [error]);

  return (
    <div className="w-full max-w-[1200px] mx-auto rounded-lg relative">
      <div className="px-0 sm:px-2">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-[color:var(--color-primary)] hover:bg-transparent hover:text-[color:var(--color-accent)]"
            onClick={() => router.push('/')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          {isSearchMode && (
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 ml-2">
              Plan Your Journey
            </h1>
          )}
        </div>

        {isSearchMode && (
          <div className="mb-8">
            <p className="text-gray-600 max-w-2xl">
              Find the best transit routes to get you where you need to go.
              Enter your starting point and destination to see available
              options, estimated travel times, and more.
            </p>
          </div>
        )}

        <SearchSection
          fromText={fromText || ''}
          toText={toText || ''}
          isResultsPage={!isSearchMode}
          isSearchMode={isSearchMode}
          isLoading={isLoading || isLoadingPlaceNames}
        />

        {isInitialized && !isSearchMode && (
          <RouteResultsView
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            routes={routes}
            error={error}
            fromText={fromText}
            toText={toText}
          />
        )}

        {isSearchMode && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <PopularDestinations />
            <JourneyTips />
          </div>
        )}
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
