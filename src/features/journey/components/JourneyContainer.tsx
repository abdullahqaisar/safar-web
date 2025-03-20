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

      if (hasValidLocations) {
        setShouldSearch(true);
      }
    }

    setIsInitialized(true);
  }, [searchParams, currentUrlParams, setFromLocation, setToLocation]);

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
        </div>

        <SearchSection
          fromText={fromText || ''}
          toText={toText || ''}
          isResultsPage={true}
          isLoading={isLoading}
        />

        {isInitialized && (
          <RouteResultsView
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            routes={routes}
            error={error}
            fromText={fromText}
            toText={toText}
          />
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
