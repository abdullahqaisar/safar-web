'use client';

import { useState, useEffect } from 'react';
import { getAllStations } from '@/lib/metro-data';
import { findBestRoute, Route } from '@/lib/route-finder';
import { metroLines } from '@/lib/metro-data';

export const MetroRouter = () => {
  const [fromStation, setFromStation] = useState<string>('');
  const [toStation, setToStation] = useState<string>('');
  const [stations, setStations] = useState<string[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setStations(getAllStations());
  }, []);

  const handleFindRoute = () => {
    setErrorMessage('');

    if (!fromStation || !toStation) {
      setErrorMessage('Please select both start and destination stations');
      setShowResults(false);
      return;
    }

    if (fromStation === toStation) {
      setErrorMessage('Start and destination stations are the same');
      setShowResults(false);
      return;
    }

    const bestRoute = findBestRoute(fromStation, toStation);

    if (bestRoute) {
      setRoute(bestRoute);
      setShowResults(true);
    } else {
      setErrorMessage('No route found between these stations');
      setShowResults(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
        Islamabad Metro Router
      </h1>

      <div className="mb-6">
        <label htmlFor="from" className="block font-semibold mb-2">
          From:
        </label>
        <select
          id="from"
          className="w-full p-3 border border-gray-300 rounded-md"
          value={fromStation}
          onChange={(e) => setFromStation(e.target.value)}
        >
          <option value="">-- Select starting station --</option>
          {stations.map((station) => (
            <option key={`from-${station}`} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="to" className="block font-semibold mb-2">
          To:
        </label>
        <select
          id="to"
          className="w-full p-3 border border-gray-300 rounded-md"
          value={toStation}
          onChange={(e) => setToStation(e.target.value)}
        >
          <option value="">-- Select destination station --</option>
          {stations.map((station) => (
            <option key={`to-${station}`} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>

      <button
        className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition duration-200"
        onClick={handleFindRoute}
      >
        Find Route
      </button>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {showResults && route && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">Recommended Route</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="font-bold">
              {route.segments.length > 1
                ? `${route.segments.length - 1} transfer${
                    route.segments.length > 2 ? 's' : ''
                  } required`
                : 'Direct route'}
            </div>
            <div>
              Total journey: {route.totalStops} stop
              {route.totalStops !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-6">
            {route.segments.map((segment, index) => {
              const lineColor = segment.line;
              const lineInfo = metroLines[lineColor];
              const borderColor =
                lineColor === 'red'
                  ? 'border-red-500'
                  : lineColor === 'blue'
                  ? 'border-blue-500'
                  : lineColor === 'green'
                  ? 'border-green-500'
                  : 'border-orange-500';
              const bgColor =
                lineColor === 'red'
                  ? 'bg-red-50'
                  : lineColor === 'blue'
                  ? 'bg-blue-50'
                  : lineColor === 'green'
                  ? 'bg-green-50'
                  : 'bg-orange-50';

              return (
                <div
                  key={`segment-${index}`}
                  className={`p-4 border-l-4 ${borderColor} ${bgColor} rounded-md relative`}
                >
                  <h3 className="font-bold text-lg">
                    {index === 0
                      ? `Board ${lineInfo.name} at ${segment.from}`
                      : `Transfer to ${lineInfo.name} at ${segment.from}`}
                  </h3>
                  <p className="mt-2">
                    Travel {segment.stations.length - 1} stop
                    {segment.stations.length - 1 !== 1 ? 's' : ''} to{' '}
                    {segment.stations[segment.stations.length - 1]}
                  </p>

                  {segment.stations.length > 2 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Passing through:{' '}
                      {segment.stations.slice(1, -1).join(', ')}
                    </p>
                  )}

                  {index < route.segments.length - 1 && (
                    <div
                      className="absolute left-4 h-8 w-0.5 bg-gray-300"
                      style={{ top: '100%' }}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
