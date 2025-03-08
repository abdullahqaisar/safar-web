'use client';

import { memo, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import LocationSearch from './LocationSearch';
import { cn } from '@/lib/utils/formatters';
import { useJourney } from '@/context/JourneyContext';
import { showError } from '@/lib/utils/toast';
import { Card } from '@/components/common/Card';

export const SearchForm = memo(function SearchForm() {
  const {
    fromLocation,
    toLocation,
    isFormValid,
    isLoading,
    errorMessage,
    isRoutesLoading,
    handleSearch,
  } = useJourney();

  const hasBothLocations = Boolean(fromLocation && toLocation);
  const isSearchDisabled = !isFormValid || isRoutesLoading;
  const showLoading = (isLoading && hasBothLocations) || isRoutesLoading;

  useEffect(() => {
    if (errorMessage) {
      showError(errorMessage);
    }
  }, [errorMessage]);

  return (
    <Card
      className={cn(
        'search-form-container relative',
        'bg-gradient-to-br from-[#0d4e2e] via-[#0d442b] to-[#073622]',
        'border-none shadow-xl mb-4 sm:mb-6 mt-1 sm:mt-2'
      )}
      allowOverflow={true}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
      <form
        className="py-5 sm:py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSearchDisabled) handleSearch();
        }}
        aria-label="Journey search form"
      >
        <h2 className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
          <i className="fas fa-route mr-2 sm:mr-3 text-emerald-400"></i>
          Find Your Route
        </h2>

        <LocationSearch />

        <Button
          onClick={handleSearch}
          disabled={isSearchDisabled}
          isLoading={showLoading}
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-6 sm:mt-8 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all duration-300"
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
            : isRoutesLoading
            ? 'Searching Routes...'
            : !hasBothLocations
            ? 'Select Both Locations'
            : 'Find Routes'}
        </Button>
      </form>
    </Card>
  );
});
