'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useJourney } from '../../journey/hooks/useJourney';

interface UseJourneySearchOptions {
  redirectPath?: string;
}

export function useJourneySearch(options: UseJourneySearchOptions = {}) {
  const { redirectPath = '/journey' } = options;
  const router = useRouter();
  const { fromLocation, toLocation, isFormValid } = useJourney();

  const [isNavigating, setIsNavigating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const hasBothLocations = Boolean(fromLocation && toLocation);

  const buildUrlParams = useCallback(() => {
    if (!fromLocation || !toLocation) return null;

    const params = new URLSearchParams();

    // Add coordinates
    params.set('fromLat', fromLocation.lat.toString());
    params.set('fromLng', fromLocation.lng.toString());
    params.set('toLat', toLocation.lat.toString());
    params.set('toLng', toLocation.lng.toString());

    // Add text labels if available
    if (fromValue) {
      params.set('fromText', encodeURIComponent(fromValue));
    }
    if (toValue) {
      params.set('toText', encodeURIComponent(toValue));
    }

    params.set('ts', Date.now().toString());
    return params;
  }, [fromLocation, toLocation, fromValue, toValue]);

  const submitSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!fromLocation || !toLocation) {
        setFormError('Please select both origin and destination locations');
        return;
      }

      if (!isFormValid || isNavigating) return;

      try {
        setIsNavigating(true);
        setFormError(null);

        const params = buildUrlParams();
        if (!params) return;

        const url = `${redirectPath}?${params.toString()}`;
        router.push(url);
      } catch (error) {
        console.error('Form submission error:', error);
        setFormError('An error occurred. Please try again.');
        setIsNavigating(false);
      }
    },
    [
      fromLocation,
      toLocation,
      isFormValid,
      isNavigating,
      buildUrlParams,
      redirectPath,
      router,
    ]
  );

  return {
    fromValue,
    toValue,
    setFromValue,
    setToValue,
    formError,
    setFormError,
    isNavigating,
    hasBothLocations,
    submitSearch,
    buildUrlParams,
  };
}
