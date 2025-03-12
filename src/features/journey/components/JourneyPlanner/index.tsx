'use client';

import { useEffect } from 'react';
import { JourneyForm } from './JourneyForm';
import { RouteLoadingSkeleton } from '../LoadingSkeleton';
import {
  JourneyProvider,
  useJourney,
} from '@/features/journey/context/JourneyContext';

import { JourneyErrorFallback } from '../../../../components/common/errors/JourneyErrorFallback';
import { showError } from '@/lib/utils/toast';
import { ErrorBoundary } from '@/components/layouts/ErrorBoundary';
import { RouteResults } from '../RouteResults';

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
        <JourneyForm />

        {isRoutesLoading && <RouteLoadingSkeleton />}

        {!isRoutesLoading && !routesError && routes && routes.length > 0 && (
          <RouteResults routes={routes} />
        )}
      </div>
    </div>
  );
}

export function JourneyPlanner() {
  return (
    <ErrorBoundary fallback={<JourneyErrorFallback />}>
      <JourneyProvider>
        <JourneyContent />
      </JourneyProvider>
    </ErrorBoundary>
  );
}
