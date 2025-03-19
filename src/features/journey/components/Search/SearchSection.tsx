'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { motion, AnimatePresence } from 'framer-motion';
import MapSearch from '../LocationSearchInput/MapSearch';
import { useRouter, usePathname } from 'next/navigation';
import { Coordinates } from '@/types/station';

interface SearchSectionProps {
  fromText?: string;
  toText?: string;
  isResultsPage: boolean;
  isLoading: boolean;
}

export function SearchSection({
  fromText,
  toText,
  isResultsPage,
  isLoading,
}: SearchSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    fromLocation,
    toLocation,
    setFromLocation,
    setToLocation,
    isFormValid,
  } = useJourney();

  const [isModifying, setIsModifying] = useState(false);
  const [pickupValue, setPickupValue] = useState(fromText || '');
  const [destinationValue, setDestinationValue] = useState(toText || '');
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    if (fromText !== undefined) setPickupValue(fromText);
    if (toText !== undefined) setDestinationValue(toText);
  }, [fromText, toText]);

  const handleFromLocationSelect = (location: Coordinates | null) => {
    setFromLocation(location);
    if (formError) setFormError(null);
  };

  const handleToLocationSelect = (location: Coordinates | null) => {
    setToLocation(location);
    if (formError) setFormError(null);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fromLocation || !toLocation) {
      setFormError('Please select both origin and destination locations');
      return;
    }

    try {
      setIsSearching(true);
      setFormError(null);

      const params = new URLSearchParams();

      params.set('fromLat', fromLocation.lat.toString());
      params.set('fromLng', fromLocation.lng.toString());
      params.set('toLat', toLocation.lat.toString());
      params.set('toLng', toLocation.lng.toString());

      if (pickupValue) {
        params.set('fromText', encodeURIComponent(pickupValue));
      }
      if (destinationValue) {
        params.set('toText', encodeURIComponent(destinationValue));
      }

      params.set('ts', Date.now().toString());

      if (!isResultsPage) {
        const url = `/journey?${params.toString()}`;
        router.push(url);
      } else {
        const url = `${pathname}?${params.toString()}`;
        router.replace(url);
        setIsSearching(false);
        setIsModifying(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError('An error occurred. Please try again.');
      setIsSearching(false);
    }
  };

  // If we're not on results page, don't show this component
  if (!isResultsPage) {
    return null;
  }

  return (
    <Card className="bg-white/95 shadow-sm border border-gray-100 p-4 sm:p-6 rounded-xl mb-8">
      <AnimatePresence mode="wait">
        {isModifying ? (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Modify Your Journey</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-[color:var(--color-accent)]"
                  onClick={() => setIsModifying(false)}
                  leftIcon={<i className="fas fa-times" />}
                  type="button"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="from-location"
                    className="block mb-1 text-xs text-gray-500 font-medium"
                  >
                    From
                  </label>
                  <MapSearch
                    id="from-location"
                    onSelectPlace={handleFromLocationSelect}
                    placeholder="From (e.g., Khanna Pul)"
                    value={pickupValue}
                    onValueChange={setPickupValue}
                    icon="far fa-circle"
                    lightMode
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 h-full flex items-center justify-center z-10">
                    <div className="h-full border-l border-dashed border-gray-300 ml-[1px]"></div>
                  </div>
                </div>

                <div className="relative">
                  <label
                    htmlFor="to-location"
                    className="block mb-1 text-xs text-gray-500 font-medium"
                  >
                    To
                  </label>
                  <MapSearch
                    id="to-location"
                    onSelectPlace={handleToLocationSelect}
                    placeholder="To (e.g., Air University)"
                    value={destinationValue}
                    onValueChange={setDestinationValue}
                    icon="fas fa-map-marker-alt"
                    lightMode
                  />
                </div>
              </div>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600"
                >
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {formError}
                </motion.div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isLoading || isSearching}
                  disabled={!isFormValid || isLoading || isSearching}
                  className="bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)]"
                  leftIcon={<i className="fas fa-search" />}
                  type="submit"
                >
                  {isLoading || isSearching ? 'Searching...' : 'Find Routes'}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="view-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Your Journey</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">From</p>
                <p className="font-medium">{fromText || 'Selected location'}</p>
              </div>
              <div className="hidden md:flex items-center text-gray-400">
                <i className="fas fa-arrow-right text-sm"></i>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">To</p>
                <p className="font-medium">{toText || 'Selected location'}</p>
              </div>
            </div>

            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsModifying(true)}
                className="border-[color:var(--color-accent)]/50 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10"
                leftIcon={<i className="fas fa-search" />}
                disabled={isLoading}
              >
                Modify Search
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
