'use client';

import { useState, useCallback } from 'react';
import { Route } from '@/types/route';
import { RouteResults } from './route/RouteResults';
import { SearchForm } from './search/SearchForm';
import { Coordinates, Station } from '@/types/station';
import { fetchRoutes } from '@/services/route.service';

export function Journey() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (
      fromStation: Station,
      toStation: Station,
      fromLocation: Coordinates,
      toLocation: Coordinates
    ) => {
      // Reset state before search
      setError('');
      setRoutes(null);
      setShowResults(false);
      setIsSearching(true);

      try {
        const bestRoutes = await fetchRoutes(
          fromStation.id,
          toStation.id,
          fromLocation,
          toLocation
        );

        if (bestRoutes?.length) {
          setRoutes(bestRoutes);
          setShowResults(true);
        } else {
          setError('No routes found between these stations');
        }
      } catch (err) {
        console.error('Route search error:', err);
        setError('Error finding route. Please try again later.');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  return (
    <div>
      <div className="w-full max-w-[1200px] mx-auto rounded-lg relative -mt-20 z-10">
        <div className="px-2 sm:mx-6">
          <SearchForm
            onSearch={handleSearch}
            errorMessage={error}
            isSearching={isSearching}
          />
          {!error && !isSearching && showResults && routes && (
            <RouteResults routes={routes} />
          )}
        </div>
      </div>
    </div>
  );
}
