import { useJourneyContext } from '../context/JourneyContext';
import { useRoutes } from './useRoutes';
import { Route } from '@/types/route';

/**
 * Primary hook for journey planning functionality.
 * Combines location state management and route fetching in one simple API.
 */
export const useJourney = (enableAutoFetch = false) => {
  const journeyContext = useJourneyContext();
  const routesQuery = useRoutes(enableAutoFetch);

  /**
   * Search for routes between the current from/to locations
   * @returns {Promise<boolean>} Success status of the search operation
   */
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

  /**
   * Reset all journey state (locations and routes)
   */
  const resetJourney = () => {
    journeyContext.resetJourney();
    routesQuery.reset();
  };

  return {
    // Location state
    fromLocation: journeyContext.fromLocation,
    toLocation: journeyContext.toLocation,
    setFromLocation: journeyContext.setFromLocation,
    setToLocation: journeyContext.setToLocation,

    // Form state
    isFormValid: journeyContext.isFormValid,

    // Routes data
    routes: routesQuery.routes as Route[] | undefined,

    // Status indicators
    isLoading: routesQuery.isLoading || routesQuery.isSearching,
    error: routesQuery.error || routesQuery.searchError,

    // Actions
    searchRoutes,
    resetJourney,
  };
};
