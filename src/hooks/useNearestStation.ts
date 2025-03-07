import { fetchNearestStation } from '@/services/station.service';
import { Coordinates } from '@/types/station';
import { useQuery } from '@tanstack/react-query';

export const useNearestStation = (location: Coordinates | null) => {
  return useQuery({
    queryKey: ['nearestStation', location],
    queryFn: () => (location ? fetchNearestStation(location) : null),
    enabled: !!location,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
