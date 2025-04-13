'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useJourney } from '../../journey/hooks/useJourney';

interface UseJourneySearchOptions {
  redirectPath?: string;
  includeTextInUrl?: boolean;
}

export function useJourneySearch(options: UseJourneySearchOptions = {}) {
  // Default to NOT including text in URLs for shorter, cleaner URLs
  const { redirectPath = '/route', includeTextInUrl = false } = options;
  const router = useRouter();
  const { fromLocation, toLocation, isFormValid } = useJourney();

  const [isNavigating, setIsNavigating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const explicitSearchTriggeredRef = useRef(false);

  const hasBothLocations = Boolean(fromLocation && toLocation);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
  }, []);

  // Reset navigation state after timeout
  useEffect(() => {
    if (isNavigating) {
      const timeout = setTimeout(() => {
        setIsNavigating(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isNavigating]);

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const buildUrlParams = useCallback(() => {
    if (!fromLocation || !toLocation) return null;

    const params = new URLSearchParams();

    // Use the new URL format with comma-separated coordinates
    params.set('from', `${fromLocation.lat},${fromLocation.lng}`);
    params.set('to', `${toLocation.lat},${toLocation.lng}`);

    if (includeTextInUrl) {
      if (fromValue) {
        params.set('fromText', encodeURIComponent(fromValue));
      }
      if (toValue) {
        params.set('toText', encodeURIComponent(toValue));
      }

      params.set('ts', Date.now().toString());
    }

    return params;
  }, [fromLocation, toLocation, fromValue, toValue, includeTextInUrl]);

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
        explicitSearchTriggeredRef.current = true;
        setFormError(null);

        const params = buildUrlParams();
        if (!params) return;

        if (navTimeoutRef.current) {
          clearTimeout(navTimeoutRef.current);
        }

        navTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
        }, 5000);

        const url = `${redirectPath}?${params.toString()}`;
        router.push(url);
      } catch (error) {
        console.error('Form submission error:', error);
        setFormError('An error occurred. Please try again.');
        setIsNavigating(false);
        if (navTimeoutRef.current) {
          clearTimeout(navTimeoutRef.current);
        }
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
    setIsNavigating,
    hasBothLocations,
    submitSearch,
    buildUrlParams,
  };
}
