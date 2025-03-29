'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with a default value for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (client-side only)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);

      // Set the initial value
      setMatches(media.matches);

      // Define a callback function to handle changes
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      // Add the callback as a listener
      media.addEventListener('change', listener);

      // Remove the listener when the component is unmounted
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}
