'use client';

import { useMapLoader } from '@/features/search/hooks/useMapLoader';

export function useGoogleMapsScript({ lazy = true }: { lazy?: boolean } = {}) {
  const mapLoader = useMapLoader({ lazy });

  return mapLoader;
}
