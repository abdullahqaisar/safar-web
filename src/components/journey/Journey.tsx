'use client';

import { useEffect } from 'react';
import { SearchForm } from './search/SearchForm';
import { RouteResults } from './route/RouteResults';
import { RouteLoadingSkeleton } from './route/RouteLoadingSkeleton';
import { JourneyProvider, useJourney } from '@/context/JourneyContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { JourneyErrorFallback } from './errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';

function JourneyContent() {
  const { routes, isRoutesLoading, routesError } = useJourney();

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
        <SearchForm />

        {isRoutesLoading && <RouteLoadingSkeleton />}

        {!isRoutesLoading && !routesError && routes && routes.length > 0 && (
          <RouteResults routes={routes} />
        )}
      </div>
    </div>
  );
}

export function Journey() {
  return (
    <ErrorBoundary fallback={<JourneyErrorFallback />}>
      <JourneyProvider>
        <JourneyContent />
      </JourneyProvider>
    </ErrorBoundary>
  );
}
