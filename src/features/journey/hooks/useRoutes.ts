import { Coordinates, Station } from '@/types/station';
import { useQuery } from '@tanstack/react-query';
import { fetchRoutes } from '../services/route.service';

interface UseRoutesParams {
  fromStation?: Station | null | undefined;
  toStation?: Station | null | undefined;
  fromLocation?: Coordinates | null | undefined;
  toLocation?: Coordinates | null | undefined;
  enabled?: boolean;
}

export const useRoutes = ({
  fromStation,
  toStation,
  fromLocation,
  toLocation,
  enabled = false,
}: UseRoutesParams = {}) => {
  const isQueryEnabled =
    enabled && !!fromStation && !!toStation && !!fromLocation && !!toLocation;

  return useQuery({
    queryKey: [
      'routes',
      fromStation?.id,
      toStation?.id,
      fromLocation?.lat,
      fromLocation?.lng,
      toLocation?.lat,
      toLocation?.lng,
    ],
    queryFn: async () => {
      if (!fromStation || !toStation || !fromLocation || !toLocation) {
        throw new Error('Missing required parameters');
      }

      const routes = await fetchRoutes(fromLocation, toLocation);

      if (!routes || routes.length === 0) {
        throw new Error('No route found between these stations');
      }

      return routes;
    },
    enabled: isQueryEnabled,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
