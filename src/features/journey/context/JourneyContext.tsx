'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Coordinates } from '@/types/station';

interface JourneyContextType {
  fromLocation: Coordinates | null;
  toLocation: Coordinates | null;
  isFormValid: boolean;
  setFromLocation: (location: Coordinates | null) => void;
  setToLocation: (location: Coordinates | null) => void;
  resetJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [fromLocation, setFromLocationState] = useState<Coordinates | null>(
    null
  );
  const [toLocation, setToLocationState] = useState<Coordinates | null>(null);

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

  function resetJourney() {
    setFromLocationState(null);
    setToLocationState(null);
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
    isFormValid,
    setFromLocation,
    setToLocation,
    resetJourney,
  };

  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
}

export const useJourneyContext = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourneyContext must be used within a JourneyProvider');
  }
  return context;
};
