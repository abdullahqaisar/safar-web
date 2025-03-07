import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useNearestStation } from './useNearestStation';
import { Coordinates } from '@/types/station';
import { MAX_STATION_DISTANCE } from '@/constants/config';

export function useSearchForm(onError: (message: string) => void) {
  const [fromLocation, setFromLocation] = useState<Coordinates | null>(null);
  const [toLocation, setToLocation] = useState<Coordinates | null>(null);

  const debouncedFromLocation = useDebounce(fromLocation, 300);
  const debouncedToLocation = useDebounce(toLocation, 300);

  const { data: fromStation, isLoading: isLoadingFromStation } =
    useNearestStation(debouncedFromLocation);
  const { data: toStation, isLoading: isLoadingToStation } =
    useNearestStation(debouncedToLocation);

  const isLoading = isLoadingFromStation || isLoadingToStation;
  const fromLocationError =
    fromLocation !== null && !isLoadingFromStation && !fromStation;
  const toLocationError =
    toLocation !== null && !isLoadingToStation && !toStation;
  const isSameStation = useMemo(
    () => fromStation && toStation && fromStation.id === toStation.id,
    [fromStation, toStation]
  );

  useEffect(() => {
    if (isSameStation) {
      onError('Start and destination stations are the same');
    }
  }, [isSameStation, onError]);

  useEffect(() => {
    if (fromLocationError) {
      onError(
        `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`
      );
    }
  }, [fromLocationError, onError]);

  useEffect(() => {
    if (toLocationError) {
      onError(
        `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`
      );
    }
  }, [toLocationError, onError]);

  return {
    fromLocation,
    toLocation,
    fromStation,
    toStation,
    isLoading,
    fromLocationError,
    toLocationError,
    isSameStation,
    setFromLocation,
    setToLocation,
  };
}
