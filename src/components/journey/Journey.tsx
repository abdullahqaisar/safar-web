'use client';

import { useState } from 'react';
import { SearchForm } from './search/SearchForm';
import { Coordinates, Station } from '@/types/station';
import { RouteResults } from './route/RouteResults';
import { useRoutes } from '@/hooks/useRoutes';
import { RouteLoadingSkeleton } from './route/RouteLoadingSkeleton';

export function Journey() {
  const [searchParams, setSearchParams] = useState<{
    fromStation?: Station;
    toStation?: Station;
    fromLocation?: Coordinates;
    toLocation?: Coordinates;
    enabled: boolean;
  }>({
    enabled: false,
  });

  const { data: routes, isLoading, error, isError } = useRoutes(searchParams);

  const handleSearch = (
    fromStation: Station,
    toStation: Station,
    fromLocation: Coordinates,
    toLocation: Coordinates
  ) => {
    setSearchParams({
      fromStation,
      toStation,
      fromLocation,
      toLocation,
      enabled: true,
    });
  };

  return (
    <div>
      <div className="w-full max-w-[1200px] mx-auto rounded-lg relative -mt-20 z-10">
        <div className="px-2 sm:mx-6">
          <SearchForm
            onSearch={handleSearch}
            errorMessage={isError ? error?.message : ''}
            isSearching={isLoading}
          />

          {isError && searchParams.enabled && <div className="mt-4"></div>}

          {isLoading && searchParams.enabled && <RouteLoadingSkeleton />}

          {!isLoading && !isError && routes && routes.length > 0 && (
            <RouteResults routes={routes} />
          )}
        </div>
      </div>
    </div>
  );
}
