'use client';

import { SearchForm } from './search/SearchForm';
import { RouteResults } from './route/RouteResults';
import { RouteLoadingSkeleton } from './route/RouteLoadingSkeleton';
import { JourneyProvider, useJourney } from '@/context/JourneyContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Alert } from '@/components/ui/Alert';
import { JourneyErrorFallback } from './errors/JourneyErrorFallback';

function JourneyContent() {
  const { routes, isRoutesLoading, routesError } = useJourney();

  const displayError = routesError
    ? routesError.message || 'An error occurred while searching for routes'
    : null;

  return (
    <div className="w-full max-w-[1200px] mx-auto rounded-lg relative -mt-20 z-10">
      <div className="px-2 sm:mx-6">
        <SearchForm />

        {displayError && (
          <div className="mt-4">
            <Alert message={displayError} />
          </div>
        )}

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
