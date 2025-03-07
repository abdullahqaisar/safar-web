import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useNearestStation } from './useNearestStation';
import { Coordinates } from '@/types/station';
import { MAX_STATION_DISTANCE } from '@/constants/config';

export function useSearchForm() {
  // Core state
  const [fromLocation, setFromLocation] = useState<Coordinates | null>(null);
  const [toLocation, setToLocation] = useState<Coordinates | null>(null);

  // Manage form input status
  const [status, setStatus] = useState<{
    error: string | null;
    isLoading: boolean;
  }>({
    error: null,
    isLoading: false,
  });

  // Apply debounce to prevent excessive API calls
  const debouncedFromLocation = useDebounce(fromLocation, 300);
  const debouncedToLocation = useDebounce(toLocation, 300);

  // Fetch nearest stations when locations change
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

  const isLoading =
    isLoadingFromStation ||
    isLoadingToStation ||
    isFetchingFromStation ||
    isFetchingToStation;

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      isLoading,
    }));
  }, [isLoading]);

  const isSameStation = useMemo(
    () => fromStation && toStation && fromStation.id === toStation.id,
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

  // Track if we had a same station error that might flicker
  const [hadSameStationError, setHadSameStationError] = useState(false);

  // Immediately evaluate if we need to suppress same station errors
  // when locations change
  useEffect(() => {
    // If either location is null, we can't have same station error
    if (!fromLocation || !toLocation) {
      setHadSameStationError(false);
    }
  }, [fromLocation, toLocation]);

  useEffect(() => {
    // If we display same station error, mark it
    if (isSameStation) {
      setHadSameStationError(true);
    }
  }, [isSameStation]);

  // Main effect for error handling
  useEffect(() => {
    // If we're still loading, don't show errors
    if (isLoading) {
      setStatus((prev) => ({ ...prev, error: null }));
      return;
    }

    // Handle station fetch errors
    if (isFromStationError) {
      setStatus((prev) => ({
        ...prev,
        error: 'Error finding nearest pickup station. Please try again.',
      }));
      return;
    }

    if (isToStationError) {
      setStatus((prev) => ({
        ...prev,
        error: 'Error finding nearest destination station. Please try again.',
      }));
      return;
    }

    // No stations found errors
    if (
      fromLocation &&
      !isLoadingFromStation &&
      !isFetchingFromStation &&
      !isFromStationError &&
      fromStation === null
    ) {
      setStatus((prev) => ({
        ...prev,
        error: `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`,
      }));
      return;
    }

    if (
      toLocation &&
      !isLoadingToStation &&
      !isFetchingToStation &&
      !isToStationError &&
      toStation === null
    ) {
      setStatus((prev) => ({
        ...prev,
        error: `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`,
      }));
      return;
    }

    // Same station error - but only if we have both locations
    if (fromLocation && toLocation && isSameStation) {
      setStatus((prev) => ({
        ...prev,
        error: 'Start and destination stations are the same',
      }));
      return;
    }

    // If we had a same station error and just cleared one of the locations,
    // make sure the error gets cleared
    if (hadSameStationError && (!fromLocation || !toLocation)) {
      setStatus((prev) => ({ ...prev, error: null }));
      setHadSameStationError(false);
      return;
    }

    // No errors
    setStatus((prev) => ({ ...prev, error: null }));
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
    hadSameStationError,
  ]);

  const handleSetFromLocation = (location: Coordinates | null) => {
    // Immediate logic to clear same-station error when changing input
    if (status.error === 'Start and destination stations are the same') {
      setStatus((prev) => ({ ...prev, error: null }));
    }

    setFromLocation(location);
  };

  const handleSetToLocation = (location: Coordinates | null) => {
    // Immediate logic to clear same-station error when changing input
    if (status.error === 'Start and destination stations are the same') {
      setStatus((prev) => ({ ...prev, error: null }));
    }

    setToLocation(location);
  };

  // Reset the entire form
  const clearLocations = () => {
    setFromLocation(null);
    setToLocation(null);
    setStatus({
      error: null,
      isLoading: false,
    });
    setHadSameStationError(false);
  };

  return {
    // Locations
    fromLocation,
    toLocation,

    // Station data
    fromStation,
    toStation,

    // Status
    isLoading: status.isLoading,
    error: status.error,
    isFormValid,
    isSameStation,

    // Actions
    setFromLocation: handleSetFromLocation,
    setToLocation: handleSetToLocation,
    clearLocations,
  };
}
