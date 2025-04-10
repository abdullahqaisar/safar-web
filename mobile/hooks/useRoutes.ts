import { useJourneyContext } from '../context/JourneyContext';
import { useState } from 'react';

interface Route {
  id: number;
  name: string;
}

const fetchRoutes = async (from: any, to: any): Promise<Route[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [{ id: 1, name: 'Route 1' }, { id: 2, name: 'Route 2' }];
};

export const useRoutes = (enabled: boolean = false) => {
  const { fromLocation, toLocation } = useJourneyContext();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [searchError, setSearchError] = useState<any>(null);

  const searchRoutes = async (): Promise<Route[]> => {
    setIsLoading(true);
    setIsSearching(true);
    if (!fromLocation || !toLocation) {
      setIsLoading(false);
      setIsSearching(false);
      return [];
    }
    try {
      const fetchedRoutes = await fetchRoutes(fromLocation, toLocation);
      setRoutes(fetchedRoutes);
      setIsLoading(false);
      setIsSearching(false);
      return fetchedRoutes;
    } catch (err) {
      setSearchError(err);
      setIsLoading(false);
      setIsSearching(false);
      return [];
    }
  };

  const refetch = () => {};
  const reset = () => {};

  return {
    routes,
    isLoading,
    isSearching,
    error,
    searchError,
    searchRoutes,
    refetch,
    reset,
  };
};