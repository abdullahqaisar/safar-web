import { fetchRoutes } from '@/services/route.service';
import { Coordinates, Station } from '@/types/station';
import { useQuery } from '@tanstack/react-query';

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
  // Generate query key based on stations and locations
  const queryKey = [
    'routes',
    fromStation?.id,
    toStation?.id,
    fromLocation?.lat,
    fromLocation?.lng,
    toLocation?.lat,
    toLocation?.lng,
  ];

  // The main query
  const query = useQuery({
    queryKey,
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
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    gcTime: 600000, // 10 minutes
  });

  return query;
};
