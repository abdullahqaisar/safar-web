'use client';

import { useCallback, useMemo } from 'react';
import { Alert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import LocationSearch from './LocationSearch';
import { Coordinates, Station } from '@/types/station';
import { useSearchForm } from '@/hooks/useSearchForm';
import React from 'react';

interface LocationSelectProps {
  pickup: Coordinates | null;
  destination: Coordinates | null;
}

interface SearchFormProps {
  onSearch: (
    from: Station,
    to: Station,
    fromLocation: Coordinates,
    toLocation: Coordinates
  ) => void;
  onError: (message: string) => void;
  errorMessage: string;
}

export const SearchForm = React.memo(function SearchForm({
  onSearch,
  onError,
  errorMessage,
}: SearchFormProps) {
  const {
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
  } = useSearchForm(onError);

  const handleLocationSelect = useCallback(
    (locations: LocationSelectProps) => {
      if (locations.pickup !== undefined) {
        setFromLocation(locations.pickup);
      }

      if (locations.destination !== undefined) {
        setToLocation(locations.destination);
      }
    },
    [setFromLocation, setToLocation]
  );

  const handleFindRoute = useCallback(() => {
    if (!fromStation || !toStation || !fromLocation || !toLocation) {
      onError('Please select both pickup and destination locations');
      return;
    }

    onSearch(fromStation, toStation, fromLocation, toLocation);
  }, [fromStation, toStation, fromLocation, toLocation, onError, onSearch]);

  const isSearchDisabled = useMemo(
    () =>
      fromLocationError ||
      toLocationError ||
      !fromStation ||
      !toStation ||
      isSameStation,
    [fromLocationError, toLocationError, fromStation, toStation, isSameStation]
  );

  const hasBothLocations = fromLocation !== null && toLocation !== null;

  return (
    <form
      className="py-8 px-4 sm:py-14 sm:px-24 bg-[#0d442b] rounded-xl mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isSearchDisabled) handleFindRoute();
      }}
      aria-label="Journey search form"
    >
      <LocationSearch onLocationSelect={handleLocationSelect} />

      {errorMessage && <Alert message={errorMessage} aria-live="assertive" />}

      <Button
        onClick={handleFindRoute}
        disabled={isSearchDisabled}
        isLoading={isLoading && hasBothLocations}
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
        leftIcon={
          !fromLocation || !toLocation ? (
            <i className="fas fa-map-marker-alt" />
          ) : (
            <i className="fas fa-search" />
          )
        }
      >
        {isLoading && hasBothLocations
          ? 'Finding Stations Nearby...'
          : !fromLocation || !toLocation
          ? 'Select Both Locations'
          : 'Find Routes'}
      </Button>
    </form>
  );
});
