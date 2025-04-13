'use client';

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { JourneyErrorFallback } from '@/components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { SearchSection } from '@/features/journey/components/Search/SearchSection';
import { RouteResultsView } from './Results/RouteResultsView';
import { getCachedLocationName } from '@/features/search/services/geocoding.service';
import { PopularDestinations } from './Search/PopularDestinations';
import { JourneyTips } from './Search/JourneyTips';

function JourneyContent() {
  const searchParams = useSearchParams();

  // Use React useTransition for smoother UI transitions
  const [isPending, startTransition] = useTransition();

  const {
    routes,
    isLoading,
    error,
    fromLocation,
    toLocation,
    setFromLocation,
    setToLocation,
    searchRoutes,
    accessRecommendations,
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
        const [fromPlaceName, toPlaceName] = await Promise.all([
          getCachedLocationName(fromLat, fromLng, true),
          getCachedLocationName(toLat, toLng, true),
        ]);

        startTransition(() => {
          setFromText(fromPlaceName);
          setToText(toPlaceName);
        });
      } catch (error) {
        console.error('Error fetching place names:', error);
      } finally {
        setIsLoadingPlaceNames(false);
      }
    },
    [startTransition]
  );

  // Initialize component based on URL parameters
  useEffect(() => {
    if (!searchParams) {
      setIsInitialized(true);
      setIsSearchMode(true);
      return;
    }

    const paramsString = searchParams.toString();

    // Handle empty search params case immediately
    if (paramsString === '') {
      setIsInitialized(true);
      setIsSearchMode(true);
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
        startTransition(() => {
          setIsSearchMode(true);
          setIsInitialized(true);
        });
        return;
      }

      // We have valid parameters, exit search mode
      startTransition(() => {
        setIsSearchMode(false);
      });

      if (hasValidFrom) {
        const [fromLat, fromLng] = from!.split(',').map(parseFloat);

        if (!isNaN(fromLat) && !isNaN(fromLng)) {
          setFromLocation({
            lat: fromLat,
            lng: fromLng,
          });

          if (fromTextParam) {
            // If text is in URL, use it directly
            startTransition(() => {
              setFromText(decodeURIComponent(fromTextParam));
            });
          } else {
            // Set a placeholder until we get the real name
            startTransition(() => {
              setFromText('Loading origin...');
            });
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
            startTransition(() => {
              setToText(decodeURIComponent(toTextParam));
            });
          } else {
            // Set a placeholder until we get the real name
            startTransition(() => {
              setToText('Loading destination...');
            });
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
          }, 500);
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
    startTransition,
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

  return (
    <div className="relative z-10 animate-fade-in">
      <div className="py-4">
        <SearchSection
          fromText={fromText || ''}
          toText={toText || ''}
          isResultsPage={!isSearchMode}
          isSearchMode={isSearchMode}
          isLoading={isLoading || isLoadingPlaceNames || isPending}
        />

        {isInitialized && !isSearchMode && (
          <RouteResultsView
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            routes={routes}
            error={error}
            fromText={fromText}
            toText={toText}
            accessRecommendations={accessRecommendations}
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
