'use client';

import { useState } from 'react';
import { findBestRoute } from '@/lib/route-finder/route-finder';
import { Route, Station } from '@/types/metro';
import { Header } from '../../layouts/Header';
import { RouteResults } from './route/RouteResults';
import { SearchForm } from './search/SearchForm';

export function Journey() {
  const [route, setRoute] = useState<Route | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = (fromStation: Station, toStation: Station) => {
    if (fromStation.id === toStation.id) {
      setErrorMessage('Start and destination stations are the same');
      setShowResults(false);
      setRoute(null);
      return;
    }

    const bestRoute = findBestRoute(fromStation.id, toStation.id);
    if (bestRoute) {
      setRoute(bestRoute);
      setShowResults(true);
      setErrorMessage('');
    } else {
      setErrorMessage('No route found between these stations');
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
    <div className="w-full max-w-[1200px] mx-auto  my-8 rounded-lg">
      <Header />
      <SearchForm
        onSearch={handleSearch}
        onError={handleError}
        errorMessage={errorMessage}
      />
      {!errorMessage && showResults && route && <RouteResults route={route} />}
    </div>
  );
}
