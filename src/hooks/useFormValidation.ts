import { useMemo, useCallback } from 'react';
import { Coordinates, Station } from '@/types/station';
import { MAX_STATION_DISTANCE } from '@/lib/constants/config';

export type ValidationType = {
  fromLocation: Coordinates | null;
  toLocation: Coordinates | null;
  fromStation: Station | null;
  toStation: Station | null;
  isLoading: boolean;
  isLoadingFromStation: boolean;
  isLoadingToStation: boolean;
  isFetchingFromStation: boolean;
  isFetchingToStation: boolean;
  isFromStationError: boolean;
  isToStationError: boolean;
};

/**
 * Hook to handle search form validation and error messages
 */
export function useFormValidation({
  fromLocation,
  toLocation,
  fromStation,
  toStation,
  isLoading,
  isLoadingFromStation,
  isLoadingToStation,
  isFetchingFromStation,
  isFetchingToStation,
  isFromStationError,
  isToStationError,
}: ValidationType) {
  const isSameStation = useMemo(
    () => Boolean(fromStation && toStation && fromStation.id === toStation.id),
    [fromStation, toStation]
  );

  const isFormValid = useMemo(() => {
    if (isLoading) return true;
    if (!fromLocation || !toLocation) return false;
    if (!fromStation || !toStation) return false;
    if (isSameStation) return false;
    return true;
  }, [
    isLoading,
    fromLocation,
    toLocation,
    fromStation,
    toStation,
    isSameStation,
  ]);

  const getErrorMessage = useCallback(() => {
    if (isLoading) return null;

    if (isFromStationError)
      return 'Error finding nearest pickup station. Please try again.';

    if (isToStationError)
      return 'Error finding nearest destination station. Please try again.';

    if (
      fromLocation &&
      !isLoadingFromStation &&
      !isFetchingFromStation &&
      !fromStation
    )
      return `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`;

    if (toLocation && !isLoadingToStation && !isFetchingToStation && !toStation)
      return `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`;

    if (isSameStation) return 'Start and destination stations are the same';

    return null;
  }, [
    isLoading,
    fromLocation,
    toLocation,
    fromStation,
    toStation,
    isFromStationError,
    isToStationError,
    isLoadingFromStation,
    isLoadingToStation,
    isFetchingFromStation,
    isFetchingToStation,
    isSameStation,
  ]);

  return {
    isFormValid,
    isSameStation,
    getErrorMessage,
  };
}
