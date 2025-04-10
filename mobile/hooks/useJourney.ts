import { useJourneyContext } from '../context/JourneyContext';

export const useJourney = () => {
  const journeyContext = useJourneyContext();

  const searchRoutes = async (): Promise<boolean> => {
    return true;
  };

  return {
    fromLocation: journeyContext.fromLocation,
    toLocation: journeyContext.toLocation,
    setFromLocation: journeyContext.setFromLocation,
    setToLocation: journeyContext.setToLocation,
    isFormValid: journeyContext.isFormValid,
    resetJourney: journeyContext.resetJourney,
    searchRoutes,
    isLoading: false,
    error: null,
  };
};