import { Coordinates } from '@/types/station';
import { useQuery } from '@tanstack/react-query';
import { fetchNearestStation } from '../services/station.service';

export function useNearestStation(location: Coordinates | null) {
  return useQuery({
    queryKey: ['nearestStation', location?.lat, location?.lng],
    queryFn: () => fetchNearestStation(location),
    enabled: !!location,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry for specific errors
      if (
        error instanceof Error &&
        error.message === 'Failed to fetch nearest station'
      ) {
        return false;
      }
      return failureCount < 2; // Otherwise retry up to 2 times
    },
  });
}
