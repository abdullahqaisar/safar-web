import { Route } from '@/types/route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRoutes, RouteError } from '../services/route.service';
import { useJourneyContext } from '../context/JourneyContext';

// Query keys for React Query cache management
export const routeQueryKeys = {
  all: ['routes'] as const,
  byLocations: (
    fromLat?: number,
    fromLng?: number,
    toLat?: number,
    toLng?: number
  ) => [...routeQueryKeys.all, fromLat, fromLng, toLat, toLng] as const,
};

/**
 * Hook to handle route data fetching with React Query
 * @internal Use useJourney instead for components
 */
export const useRoutes = (enabled = false) => {
  const { fromLocation, toLocation, isFormValid } = useJourneyContext();
  const queryClient = useQueryClient();

  // Generate query key based on current locations
  const currentQueryKey = routeQueryKeys.byLocations(
    fromLocation?.lat,
    fromLocation?.lng,
    toLocation?.lat,
    toLocation?.lng
  );

  // Query for automatic fetching when enabled
  const routesQuery = useQuery({
    queryKey: currentQueryKey,
    queryFn: () => {
      if (!fromLocation || !toLocation) {
        throw new Error('Missing required parameters');
      }
      return fetchRoutes(fromLocation, toLocation);
    },
    enabled: enabled && isFormValid,
  });

  // Mutation for manual fetching
  const searchRoutesMutation = useMutation({
    mutationFn: async () => {
      if (!fromLocation || !toLocation) {
        throw new Error('Both origin and destination locations are required');
      }
      return await fetchRoutes(fromLocation, toLocation);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(currentQueryKey, data);
    },
  });

  return {
    routes: routesQuery.data,
    isLoading: routesQuery.isLoading,
    isSearching: searchRoutesMutation.isPending,
    error: routesQuery.error || null,
    searchError: searchRoutesMutation.error || null,
    searchRoutes: searchRoutesMutation.mutateAsync,
    refetch: routesQuery.refetch,
    reset: () => queryClient.removeQueries({ queryKey: routeQueryKeys.all }),
  };
};
