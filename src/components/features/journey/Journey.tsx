'use client';

import { useState } from 'react';
import { Route } from '@/types/route';
import { RouteResults } from './route/RouteResults';
import { SearchForm } from './search/SearchForm';
import { Coordinates, Station } from '@/types/station';
import { getBestRoute } from '@/services/route.service';

export function Journey() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = async (
    fromStation: Station,
    toStation: Station,
    fromLocation: Coordinates,
    toLocation: Coordinates
  ) => {
    if (fromStation.id === toStation.id) {
      setErrorMessage('Start and destination stations are the same');
      setShowResults(false);
      setRoutes(null);
      return;
    }

    try {
      const bestRoute = await getBestRoute(
        fromStation.id,
        toStation.id,
        fromLocation,
        toLocation
      );
      if (bestRoute) {
        setRoutes(bestRoute);
        setShowResults(true);
        setErrorMessage('');
      } else {
        setErrorMessage('No route found between these stations');
        setShowResults(false);
        setRoutes(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Error finding route');
      setShowResults(false);
      setRoutes(null);
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowResults(false);
    setRoutes(null);
  };

  return (
    <div>
      <div className="w-full max-w-[1200px] mx-auto rounded-lg relative -mt-20 z-10">
        <div className="px-2 sm:mx-6">
          <SearchForm
            onSearch={handleSearch}
            onError={handleError}
            errorMessage={errorMessage}
          />
          {!errorMessage && showResults && routes && (
            <RouteResults routes={routes} />
          )}
        </div>
      </div>
    </div>
  );
}
