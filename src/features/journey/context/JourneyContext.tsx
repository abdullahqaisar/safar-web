'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Route } from '@/types/route';
import { fetchRoutes } from '../services/route.service';
import { Coordinates } from '@/types/station';

interface JourneyContextType {
  fromLocation: Coordinates | null;
  toLocation: Coordinates | null;
  routes: Route[] | null;
  isFormValid: boolean;
  isRoutesLoading: boolean;
  setFromLocation: (location: Coordinates | null) => void;
  setToLocation: (location: Coordinates | null) => void;
  handleSearch: () => Promise<void>;
  errorMessage: string | null;
  routesError: Error | null;
  resetError: () => void;
  clearRoutes: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [fromLocation, setFromLocationState] = useState<Coordinates | null>(
    null
  );
  const [toLocation, setToLocationState] = useState<Coordinates | null>(null);
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [isRoutesLoading, setIsRoutesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routesError, setRoutesError] = useState<Error | null>(null);

  const handleSearch = useCallback(async () => {
    if (!fromLocation || !toLocation) {
      setErrorMessage('Both origin and destination locations are required');
      return;
    }

    setErrorMessage(null);
    setRoutesError(null);
    setIsRoutesLoading(true);

    try {
      const routesResult = await fetchRoutes(fromLocation, toLocation);
      setRoutes(routesResult || []);
    } catch (error) {
      console.error('Error searching routes:', error);
      setRoutesError(
        error instanceof Error ? error : new Error('Failed to search routes')
      );
      setRoutes(null);
    } finally {
      setIsRoutesLoading(false);
    }
  }, [fromLocation, toLocation]);

  function resetError() {
    setErrorMessage(null);
    setRoutesError(null);
  }

  function clearRoutes() {
    setRoutes(null);
  }

  function setFromLocation(location: Coordinates | null) {
    if (location === null) {
      setFromLocationState(null);
      return;
    }

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      setFromLocationState({ lat, lng });
    } else {
      console.warn('Invalid coordinates provided for fromLocation:', location);
    }
  }

  function setToLocation(location: Coordinates | null) {
    if (location === null) {
      setToLocationState(null);
      return;
    }

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      setToLocationState({ lat, lng });
    } else {
      console.warn('Invalid coordinates provided for toLocation:', location);
    }
  }

  const isFormValid = Boolean(
    fromLocation &&
      toLocation &&
      typeof fromLocation.lat === 'number' &&
      typeof fromLocation.lng === 'number' &&
      typeof toLocation.lat === 'number' &&
      typeof toLocation.lng === 'number' &&
      (fromLocation.lat !== 0 || fromLocation.lng !== 0) &&
      (toLocation.lat !== 0 || toLocation.lng !== 0)
  );

  const contextValue = {
    fromLocation,
    toLocation,
    routes,
    isFormValid,
    isRoutesLoading,
    setFromLocation,
    setToLocation,
    handleSearch,
    errorMessage,
    routesError,
    resetError,
    clearRoutes,
  };

  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
}

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
