'use client';

import { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { googleMapsApiKey, googleMapsLibraries } from '@/lib/utils/googleMaps';

export const GOOGLE_MAPS_LOADED_EVENT = 'google-maps-loaded';

export function useMapLoader({
  lazy = true,
  observerOptions = { rootMargin: '200px' },
}: {
  lazy?: boolean;
  observerOptions?: IntersectionObserverInit;
} = {}) {
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);
  const [hasEmittedLoadedEvent, setHasEmittedLoadedEvent] = useState(false);

  useEffect(() => {
    if (lazy && !shouldLoad) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      }, observerOptions);

      // Observe map-related elements
      const mapElements = document.querySelectorAll(
        '.map-search-container, .map-container, .search-section'
      );

      if (mapElements.length > 0) {
        mapElements.forEach((el) => observer.observe(el));
      } else {
        const timer = setTimeout(() => setShouldLoad(true), 800);
        return () => clearTimeout(timer);
      }

      return () => observer.disconnect();
    }
  }, [lazy, shouldLoad, observerOptions]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries: googleMapsLibraries,
    preventGoogleFontsLoading: true,
    ...(shouldLoad ? {} : { skip: true }),
  });
  useEffect(() => {
    if (isLoaded && !loadError && !hasEmittedLoadedEvent) {
      const event = new CustomEvent(GOOGLE_MAPS_LOADED_EVENT);
      window.dispatchEvent(event);

      setHasEmittedLoadedEvent(true);
    }
  }, [isLoaded, loadError, hasEmittedLoadedEvent]);

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps script failed to load:', loadError);
      setError('Failed to load maps. Please try refreshing the page.');
    }
  }, [loadError]);

  return {
    isLoaded,
    isError: !!loadError,
    error,
    isReady: isLoaded && !loadError,
  };
}
