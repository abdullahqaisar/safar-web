import { fetchRoutes } from '@/services/route.service';
import { Coordinates, Station } from '@/types/station';
import { useQuery } from '@tanstack/react-query';

interface UseRoutesParams {
  fromStation?: Station;
  toStation?: Station;
  fromLocation?: Coordinates;
  toLocation?: Coordinates;
  enabled?: boolean;
}

export const useRoutes = ({
  fromStation,
  toStation,
  fromLocation,
  toLocation,
  enabled = false,
}: UseRoutesParams = {}) => {
  return useQuery({
    queryKey: [
      'routes',
      fromStation?.id,
      toStation?.id,
      fromLocation,
      toLocation,
    ],
    queryFn: async () => {
      if (!fromStation || !toStation || !fromLocation || !toLocation) {
        throw new Error('Missing required parameters');
      }

      const routes = await fetchRoutes(
        fromStation.id,
        toStation.id,
        fromLocation,
        toLocation
      );

      if (!routes || routes.length === 0) {
        throw new Error('No route found between these stations');
      }

      return routes;
    },
    enabled:
      enabled && !!fromStation && !!toStation && !!fromLocation && !!toLocation,
    retry: 1,
    staleTime: 300000, // 5 minute
    refetchOnWindowFocus: false,
  });
};
