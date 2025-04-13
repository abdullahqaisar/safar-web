import { useJourneyContext } from '../context/JourneyContext';
import { useRoutes } from './useRoutes';
import { Route } from '@/core/types/route';

export const useJourney = (enableAutoFetch = false) => {
  const journeyContext = useJourneyContext();
  const routesQuery = useRoutes(enableAutoFetch);

  const searchRoutes = async (): Promise<boolean> => {
    if (!journeyContext.isFormValid) {
      return false;
    }

    try {
      await routesQuery.searchRoutes();
      return true;
    } catch (error) {
      console.error('Error searching routes:', error);
      return false;
    }
  };

  const resetJourney = () => {
    journeyContext.resetJourney();
    routesQuery.reset();
  };

  return {
    fromLocation: journeyContext.fromLocation,
    toLocation: journeyContext.toLocation,
    setFromLocation: journeyContext.setFromLocation,
    setToLocation: journeyContext.setToLocation,

    isFormValid: journeyContext.isFormValid,

    routes: routesQuery.routes as Route[] | undefined,
    origin: routesQuery.origin,
    destination: routesQuery.destination,
    accessRecommendations: routesQuery.accessRecommendations,
    userCoordinates: routesQuery.userCoordinates,

    isLoading: routesQuery.isLoading || routesQuery.isSearching,
    error: routesQuery.error || routesQuery.searchError,

    searchRoutes,
    resetJourney,
  };
};
