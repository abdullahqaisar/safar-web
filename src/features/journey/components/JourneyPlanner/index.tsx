'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { JourneyForm } from './JourneyForm';
import { RouteLoadingSkeleton } from '../LoadingSkeleton';
import {
  JourneyProvider,
  useJourney,
} from '@/features/journey/context/JourneyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { JourneyErrorFallback } from '../../../../components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { RouteResults } from '../RouteResults';
import { Button } from '@/components/common/Button';

interface JourneyContentProps {
  showResults?: boolean;
}

function JourneyContent({ showResults = false }: JourneyContentProps) {
  const searchParams = useSearchParams();
  const {
    routes,
    isRoutesLoading,
    routesError,
    setFromLocation,
    setToLocation,
    handleSearch,
  } = useJourney();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load search params on initial render
  const initFromParams = useCallback(() => {
    if (searchParams) {
      // Parse coordinates from individual parameters instead of JSON objects
      const fromLat = searchParams.get('fromLat');
      const fromLng = searchParams.get('fromLng');
      const toLat = searchParams.get('toLat');
      const toLng = searchParams.get('toLng');

      let hasLocationData = false;

      // Only set locations if we have both coordinates
      if (fromLat && fromLng) {
        const fromLocation = {
          lat: parseFloat(fromLat),
          lng: parseFloat(fromLng),
        };
        setFromLocation(fromLocation);
        hasLocationData = true;
      }

      if (toLat && toLng) {
        const toLocation = {
          lat: parseFloat(toLat),
          lng: parseFloat(toLng),
        };
        setToLocation(toLocation);
        hasLocationData = true;
      }

      // If both locations are present in URL, trigger search
      if (fromLat && fromLng && toLat && toLng && showResults) {
        // Delay search slightly to allow state updates to complete
        setTimeout(handleSearch, 100);
      }

      setIsInitialized(true);
      return hasLocationData;
    }

    setIsInitialized(true);
    return false;
  }, [searchParams, setFromLocation, setToLocation, handleSearch, showResults]);

  useEffect(() => {
    initFromParams();
  }, [initFromParams]);

  // Show toast when routes error occurs
  useEffect(() => {
    if (routesError) {
      const errorMessage =
        routesError.message || 'An error occurred while searching for routes';
      showError(errorMessage);
    }
  }, [routesError]);

  return (
    <div className="w-full max-w-[1200px] mx-auto rounded-lg relative -mt-20 z-10">
      <div className="px-2 sm:mx-6">
        <JourneyForm />

        {showResults && isInitialized && (
          <AnimatePresence mode="wait">
            {isRoutesLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RouteLoadingSkeleton />
              </motion.div>
            )}

            {!isRoutesLoading &&
              !routesError &&
              routes &&
              routes.length > 0 && (
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

            {!isRoutesLoading &&
              !routesError &&
              routes &&
              routes.length === 0 && (
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
                      onClick={() => {
                        // Focus on the first input to help user start a new search
                        const fromInput =
                          document.getElementById('from-location');
                        if (fromInput) fromInput.focus();
                      }}
                      size="sm"
                    >
                      <i className="fas fa-search mr-2"></i>
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
      <JourneyProvider>
        <JourneyContent showResults={showResults} />
      </JourneyProvider>
    </ErrorBoundary>
  );
}
