import React, {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface JourneyContextProps {
  fromLocation: Coordinates | null;
  toLocation: Coordinates | null;
  setFromLocation: Dispatch<SetStateAction<Coordinates | null>>;
  setToLocation: Dispatch<SetStateAction<Coordinates | null>>;
  isFormValid: boolean;
  resetJourney: () => void;
}

const JourneyContext = createContext<JourneyContextProps>({
  fromLocation: null,
  toLocation: null,
  setFromLocation: () => {},
  setToLocation: () => {},
  isFormValid: false,
  resetJourney: () => {},
});

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fromLocation, setFromLocation] = useState<Coordinates | null>(null);
  const [toLocation, setToLocation] = useState<Coordinates | null>(null);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const resetJourney = () => {
    setFromLocation(null);
    setToLocation(null);
    setIsFormValid(false);
  };

  return (
    <JourneyContext.Provider
      value={{
        fromLocation,
        toLocation,
        setFromLocation,
        setToLocation,
        isFormValid,
        resetJourney
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourneyContext = () => useContext(JourneyContext);