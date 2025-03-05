'use client';

import { useState } from 'react';
import { findBestRoute } from '@/lib/route-finder/route-finder';
import { Route } from '@/types/route';
import { Header } from '../../layouts/Header';
import { RouteResults } from './route/RouteResults';
import { SearchForm } from './search/SearchForm';
import { Station } from '@/types/station';

export function Journey() {
  const [route, setRoute] = useState<Route | null>(null);
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
      setRoute(null);
      return;
    }

    try {
      const bestRoute = await findBestRoute(
        fromStation.id,
        toStation.id,
        fromLocation,
        toLocation
      );
      if (bestRoute) {
        setRoute(bestRoute);
        setShowResults(true);
        setErrorMessage('');
      } else {
        setErrorMessage('No route found between these stations');
        setShowResults(false);
        setRoute(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Error finding route');
      setShowResults(false);
      setRoute(null);
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowResults(false);
    setRoute(null);
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
        {!errorMessage && showResults && route && (
          <RouteResults route={route} />
        )}
      </div>
    </div>
  );
}
