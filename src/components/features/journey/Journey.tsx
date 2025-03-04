'use client';

import { useState } from 'react';
import { Route } from '@/types/route';
import { Header } from '../../layouts/Header';
import { RouteResults } from './route/RouteResults';
import { SearchForm } from './search/SearchForm';
import { Station } from '@/types/station';
import { getBestRoute } from '@/lib/services/route.service';

export function Journey() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = async (
    fromStation: Station,
    toStation: Station,
    fromLocation: google.maps.LatLngLiteral,
    toLocation: google.maps.LatLngLiteral
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
    <div className="w-full max-w-[1200px] mx-auto mt-20 sm:mt-8 rounded-lg">
      <Header />
      <div className="px-4 sm:px-0">
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
  );
}
