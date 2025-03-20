'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import { googleMapsApiKey, googleMapsLibraries } from '@/lib/utils/googleMaps';

export default function GoogleMapsScript({ lazy = true }: { lazy?: boolean }) {
  const [scriptId] = useState(
    `google-maps-script-${Math.random().toString(36).substring(2, 9)}`
  );
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  useEffect(() => {
    if (lazy && !shouldLoad) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' }
      );

      const mapElements = document.querySelectorAll(
        '.map-search-container, .map-container'
      );
      if (mapElements.length > 0) {
        mapElements.forEach((el) => observer.observe(el));
      } else {
        const timer = setTimeout(() => setShouldLoad(true), 1500);
        return () => clearTimeout(timer);
      }

      return () => observer.disconnect();
    }
  }, [lazy, shouldLoad]);

  if (!shouldLoad) return null;

  const librariesParam = googleMapsLibraries.join(',');
  const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=${librariesParam}`;

  return (
    <Script
      id={scriptId}
      src={scriptSrc}
      strategy="lazyOnload"
      onLoad={() => {
        window.dispatchEvent(new Event('google-maps-loaded'));
        console.log('Google Maps script loaded successfully');
      }}
      onError={() => {
        console.error('Failed to load Google Maps script');
        window.dispatchEvent(new Event('google-maps-error'));
      }}
    />
  );
}
