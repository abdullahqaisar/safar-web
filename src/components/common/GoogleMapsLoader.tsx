'use client';

import { useGoogleMapsScript } from '@/features/search/hooks/useGoogleMapsScript';
import { useEffect, useState } from 'react';

interface GoogleMapsLoaderProps {
  lazy?: boolean;
}

export function GoogleMapsLoader({ lazy = true }: GoogleMapsLoaderProps) {
  const { isError } = useGoogleMapsScript({ lazy });
  const [showError, setShowError] = useState(false);

  // Only show errors after a delay to avoid flickering during normal loading
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [isError]);

  if (showError) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-md text-sm text-red-600 max-w-[300px] z-50">
        Failed to load Google Maps. Some features may not work correctly.
      </div>
    );
  }

  // This component doesn't render anything by default
  return null;
}
