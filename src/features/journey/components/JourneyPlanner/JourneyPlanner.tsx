'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { motion, AnimatePresence } from 'framer-motion';
import { JourneyErrorFallback } from '@/components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { RouteResults } from '../RouteResults/RouteResults';
import { Button } from '@/components/common/Button';
import { SearchSection } from '../Search/SearchSection';
import { useRouter } from 'next/navigation';
import { LoadingState } from '../RouteResults/LoadingState';

interface JourneyContentProps {
  showResults?: boolean;
}

function JourneyContent({ showResults = false }: JourneyContentProps) {
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
  const [isModifyingSearch, setIsModifyingSearch] = useState(false);
  const [fromText, setFromText] = useState<string | null>(null);
  const [toText, setToText] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const toggleModifySearch = () => {
    setIsModifyingSearch(!isModifyingSearch);
  };

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

  useEffect(() => {
    if (!searchParams) {
      setIsInitialized(true);
      return;
    }

    const paramsString = searchParams.toString();

    if (currentUrlParams !== paramsString) {
      setCurrentUrlParams(paramsString);

      const fromLat = searchParams.get('fromLat');
      const fromLng = searchParams.get('fromLng');
      const toLat = searchParams.get('toLat');
      const toLng = searchParams.get('toLng');

      // Get location text if available
      const fromTextParam = searchParams.get('fromText');
      const toTextParam = searchParams.get('toText');

      if (fromTextParam) setFromText(decodeURIComponent(fromTextParam));
      if (toTextParam) setToText(decodeURIComponent(toTextParam));

      let hasValidLocations = false;

      if (
        fromLat &&
        fromLng &&
        !isNaN(parseFloat(fromLat)) &&
        !isNaN(parseFloat(fromLng))
      ) {
        setFromLocation({
          lat: parseFloat(fromLat),
          lng: parseFloat(fromLng),
        });
        hasValidLocations = true;
      }

      if (
        toLat &&
        toLng &&
        !isNaN(parseFloat(toLat)) &&
        !isNaN(parseFloat(toLng))
      ) {
        setToLocation({
          lat: parseFloat(toLat),
          lng: parseFloat(toLng),
        });
        hasValidLocations = true;
      }

      if (hasValidLocations && showResults) {
        setShouldSearch(true);
      }
    }

    setIsInitialized(true);
  }, [
    searchParams,
    currentUrlParams,
    setFromLocation,
    setToLocation,
    showResults,
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
        {showResults && (
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-[color:var(--color-primary)] hover:bg-transparent hover:text-[color:var(--color-accent)]"
              onClick={() => router.push('/')}
              leftIcon={<i className="fas fa-arrow-left" />}
            >
              Back
            </Button>
            {/* <h1 className="text-xl sm:text-2xl font-semibold ml-2">
              Route Results
            </h1> */}
          </div>
        )}

        <SearchSection
          fromText={fromText || ''}
          toText={toText || ''}
          isResultsPage={showResults}
          isModifyingSearch={isModifyingSearch}
          toggleModifySearch={toggleModifySearch}
          isLoading={isLoading}
        />

        {showResults && isInitialized && (
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingState
                  fromText={fromText || 'selected location'}
                  toText={toText || 'destination'}
                  loadingProgress={loadingProgress}
                />
              </motion.div>
            )}

            {!isLoading && !error && routes && routes.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RouteResults routes={routes} />
              </motion.div>
            )}

            {!isLoading && !error && routes && routes.length === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-route text-amber-500 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Routes Found
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    We couldn&apos;t find any routes between these locations.
                    Try different locations or check back later.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={toggleModifySearch}
                    size="sm"
                    leftIcon={<i className="fas fa-search" />}
                  >
                    Try Different Locations
                  </Button>
                </div>
              </motion.div>
            )}

            {!isLoading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Error Finding Routes
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    {error instanceof Error
                      ? error.message
                      : "We couldn't find routes for your selected locations. No public transit station was found nearby or the service is temporarily unavailable."}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={toggleModifySearch}
                    size="sm"
                    leftIcon={<i className="fas fa-search" />}
                  >
                    Try Different Locations
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface JourneyPlannerProps {
  showResults?: boolean;
}

export function JourneyPlanner({ showResults = false }: JourneyPlannerProps) {
  return (
    <ErrorBoundary fallback={<JourneyErrorFallback />}>
      <JourneyContent showResults={showResults} />
    </ErrorBoundary>
  );
}
