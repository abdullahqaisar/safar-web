'use client';

import { memo, useCallback, useEffect } from 'react';
import { Alert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import LocationSearch from './LocationSearch';
import { Coordinates, Station } from '@/types/station';
import { useSearchForm } from '@/hooks/useSearchForm';
import React from 'react';

import { cn } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';

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
    <Card
      className={cn(
        'search-form-container relative',
        'bg-gradient-to-br from-[#0d4e2e] via-[#0d442b] to-[#073622]',
        "before:content-[''] before:absolute before:inset-0 before:bg-[url('/patterns/subtle-dots.png')] before:opacity-5",
        'border-none shadow-xl mb-8'
      )}
      allowOverflow={true}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
      <form
        className="py-8 px-5 sm:py-12 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSearchDisabled) handleFindRoute();
        }}
        aria-label="Journey search form"
      >
        <h2 className="text-white text-xl font-semibold mb-6 flex items-center">
          <i className="fas fa-route mr-3 text-emerald-400"></i>
          Find Your Route
        </h2>

        <LocationSearch onLocationSelect={handleLocationSelect} />

        {displayError && (
          <div className="mt-4">
            <Alert message={displayError} aria-live="polite" />
          </div>
        )}

        <Button
          onClick={handleFindRoute}
          disabled={isSearchDisabled}
          isLoading={showLoading}
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-8 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all duration-300"
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
    </Card>
  );
});
