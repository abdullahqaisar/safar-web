import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRoutes } from '../services/route.service';
import { useJourneyContext } from '../context/JourneyContext';

// Query keys for React Query cache management
export const routeQueryKeys = {
  all: ['routes'] as const,
  byLocations: (
    from?: { lat: number; lng: number } | null,
    to?: { lat: number; lng: number } | null
  ) =>
    [
      ...routeQueryKeys.all,
      from ? `${from.lat},${from.lng}` : null,
      to ? `${to.lat},${to.lng}` : null,
    ] as const,
};

/**
 * Hook to handle route data fetching with React Query
 * @internal Use useJourney instead for components
 */
export const useRoutes = (enabled = false) => {
  const { fromLocation, toLocation, isFormValid } = useJourneyContext();
  const queryClient = useQueryClient();

  // Generate query key based on current locations
  const currentQueryKey = routeQueryKeys.byLocations(fromLocation, toLocation);

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

  // Extract relevant data from the response
  const routeData = routesQuery.data;

  return {
    routes: routeData?.routes,
    origin: routeData?.origin,
    destination: routeData?.destination,
    accessRecommendations: routeData?.accessRecommendations,
    userCoordinates: routeData?.userCoordinates,
    isLoading: routesQuery.isLoading,
    isSearching: searchRoutesMutation.isPending,
    error: routesQuery.error || null,
    searchError: searchRoutesMutation.error || null,
    searchRoutes: searchRoutesMutation.mutateAsync,
    refetch: routesQuery.refetch,
    reset: () => queryClient.removeQueries({ queryKey: routeQueryKeys.all }),
  };
};
