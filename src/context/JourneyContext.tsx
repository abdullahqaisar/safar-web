'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Coordinates, Station } from '@/types/station';
import { useNearestStation } from '@/hooks/useNearestStation';
import { useRoutes } from '@/hooks/useRoutes';
import { useDebounce } from '@/hooks/useDebounce';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Route } from '@/types/route';

interface JourneyContextType {
  // Location state
  fromLocation: Coordinates | null;
  toLocation: Coordinates | null;
  setFromLocation: (location: Coordinates | null) => void;
  setToLocation: (location: Coordinates | null) => void;

  // Station data
  fromStation: Station | null | undefined;
  toStation: Station | null | undefined;

  // Form state
  isFormValid: boolean;
  isLoading: boolean;
  errorMessage: string | null;

  // Route state
  routes: Route[] | undefined;
  isRoutesLoading: boolean;
  routesError: Error | null;

  // Actions
  handleSearch: () => void;
  clearJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [fromLocation, setFromLocationState] = useState<Coordinates | null>(
    null
  );
  const [toLocation, setToLocationState] = useState<Coordinates | null>(null);

  const [searchButtonClicked, setSearchButtonClicked] = useState(false);

  const setFromLocation = useCallback((location: Coordinates | null) => {
    setFromLocationState(location);
    setSearchButtonClicked(false); // Reset search state when location changes
  }, []);

  const setToLocation = useCallback((location: Coordinates | null) => {
    setToLocationState(location);
    setSearchButtonClicked(false); // Reset search state when location changes
  }, []);

  const debouncedFromLocation = useDebounce(fromLocation, 300);
  const debouncedToLocation = useDebounce(toLocation, 300);

  // Station queries
  const {
    data: fromStation,
    isLoading: isLoadingFromStation,
    isError: isFromStationError,
    isFetching: isFetchingFromStation,
  } = useNearestStation(debouncedFromLocation);

  const {
    data: toStation,
    isLoading: isLoadingToStation,
    isError: isToStationError,
    isFetching: isFetchingToStation,
  } = useNearestStation(debouncedToLocation);

  // Form validation
  const { isFormValid, getErrorMessage } = useFormValidation({
    fromLocation: debouncedFromLocation,
    toLocation: debouncedToLocation,
    fromStation,
    toStation,
    isLoading: isLoadingFromStation || isLoadingToStation,
    isLoadingFromStation,
    isLoadingToStation,
    isFetchingFromStation,
    isFetchingToStation,
    isFromStationError,
    isToStationError,
  });

  const {
    data: routes,
    isLoading: isRoutesLoading,
    error: routesError,
  } = useRoutes({
    fromStation,
    toStation,
    fromLocation: debouncedFromLocation,
    toLocation: debouncedToLocation,
    enabled: searchButtonClicked,
  });

  const handleSearch = useCallback(() => {
    if (isFormValid) {
      setSearchButtonClicked(true);
    }
  }, [isFormValid]);

  const clearJourney = useCallback(() => {
    setFromLocationState(null);
    setToLocationState(null);
    setSearchButtonClicked(false);
  }, []);

  // Overall loading state
  const isLoading =
    isLoadingFromStation ||
    isLoadingToStation ||
    isFetchingFromStation ||
    isFetchingToStation;

  // Error handling
  const errorMessage = getErrorMessage();

  const value = {
    fromLocation,
    toLocation,
    setFromLocation,
    setToLocation,
    fromStation,
    toStation,
    isFormValid,
    isLoading,
    errorMessage,
    routes,
    isRoutesLoading,
    routesError,
    handleSearch,
    clearJourney,
  };

  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  );
}

export const useJourney = () => {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
