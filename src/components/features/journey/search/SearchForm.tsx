'use client';

import { memo, useCallback, useEffect } from 'react';
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
  onError?: (message: string) => void; // Making onError optional
  errorMessage?: string;
  isSearching?: boolean;
}

export const SearchForm = memo(function SearchForm({
  onSearch,
  onError,
  errorMessage = '',
  isSearching = false,
}: SearchFormProps) {
  const {
    fromLocation,
    toLocation,
    fromStation,
    toStation,
    isLoading,
    error: formError,
    isFormValid,
    setFromLocation,
    setToLocation,
  } = useSearchForm();

  useEffect(() => {
    if (onError && formError !== null) {
      onError(formError);
    }
  }, [formError, onError]);

  const handleLocationSelect = useCallback(
    ({ pickup, destination }: LocationSelectProps) => {
      if (isSearching) return;

      if (pickup !== undefined) {
        setFromLocation(pickup);
      }

      if (destination !== undefined) {
        setToLocation(destination);
      }
    },
    [setFromLocation, setToLocation, isSearching]
  );

  const handleFindRoute = useCallback(() => {
    if (!fromStation || !toStation || !fromLocation || !toLocation) {
      return;
    }
    onSearch(fromStation, toStation, fromLocation, toLocation);
  }, [fromStation, toStation, fromLocation, toLocation, onSearch]);

  const hasBothLocations = fromLocation !== null && toLocation !== null;

  const displayError = formError || errorMessage;

  const isSearchDisabled = !isFormValid || isSearching;

  const showLoading = (isLoading && hasBothLocations) || isSearching;

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

      {displayError && <Alert message={displayError} aria-live="polite" />}

      <Button
        onClick={handleFindRoute}
        disabled={isSearchDisabled}
        isLoading={showLoading}
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
        leftIcon={
          !hasBothLocations ? (
            <i className="fas fa-map-marker-alt" />
          ) : (
            <i className="fas fa-search" />
          )
        }
      >
        {isLoading && hasBothLocations
          ? 'Finding Stations Nearby...'
          : isSearching
          ? 'Searching Routes...'
          : !hasBothLocations
          ? 'Select Both Locations'
          : 'Find Routes'}
      </Button>
    </form>
  );
});
