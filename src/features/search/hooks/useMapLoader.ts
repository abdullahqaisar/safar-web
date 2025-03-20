'use client';

import { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { googleMapsApiKey, googleMapsLibraries } from '@/lib/utils/googleMaps';

export function useMapLoader({
  lazy = true,
  observerOptions = { rootMargin: '200px' },
}: {
  lazy?: boolean;
  observerOptions?: IntersectionObserverInit;
} = {}) {
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);

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
        '.map-search-container, .map-container'
      );

      if (mapElements.length > 0) {
        mapElements.forEach((el) => observer.observe(el));
      } else {
        // If no map elements found, load the script anyway after a delay
        const timer = setTimeout(() => setShouldLoad(true), 1500);
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
