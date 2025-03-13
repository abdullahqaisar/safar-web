'use client';

import { memo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/formatters';
import { useJourney } from '@/features/journey/context/JourneyContext';
import { showError } from '@/lib/utils/toast';
import { Card } from '@/components/common/Card';
import LocationSearchInput from '../../../location/components/LocationSearchInput';

export const JourneyForm = memo(function JourneyForm() {
  const router = useRouter();
  const {
    fromLocation,
    toLocation,
    isFormValid,
    isLoading,
    errorMessage,
    isRoutesLoading,
    handleSearch,
  } = useJourney();
  const [isNavigating, setIsNavigating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasBothLocations = Boolean(fromLocation && toLocation);
  const isSearchDisabled = !isFormValid || isRoutesLoading || isNavigating;
  const showLoading =
    (isLoading && hasBothLocations) || isRoutesLoading || isNavigating;

  useEffect(() => {
    if (errorMessage) {
      showError(errorMessage);
      setFormError(errorMessage);

      // Clear form error after 5 seconds
      const timer = setTimeout(() => {
        setFormError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Clear form error when locations change
  useEffect(() => {
    setFormError(null);
  }, [fromLocation, toLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromLocation || !toLocation) {
      setFormError('Please select both origin and destination locations');
      return;
    }

    if (!isSearchDisabled) {
      try {
        setFormError(null);

        // Create query parameters from the locations
        const params = new URLSearchParams();

        // Add coordinates as separate parameters
        if (fromLocation) {
          params.set('fromLat', fromLocation.lat.toString());
          params.set('fromLng', fromLocation.lng.toString());
        }

        if (toLocation) {
          params.set('toLat', toLocation.lat.toString());
          params.set('toLng', toLocation.lng.toString());
        }

        // Get the input values from DOM with more robust selectors
        const fromInput = document.getElementById(
          'from-location'
        ) as HTMLInputElement;
        const toInput = document.getElementById(
          'to-location'
        ) as HTMLInputElement;

        // Add text input values to URL params
        if (fromInput && fromInput.value) {
          params.set('fromText', encodeURIComponent(fromInput.value));
        }
        if (toInput && toInput.value) {
          params.set('toText', encodeURIComponent(toInput.value));
        }

        const url = `/search-results?${params.toString()}`;

        // Always update the URL, whether navigating for the first time or updating
        if (window.location.pathname !== '/search-results') {
          // If we're not on the results page, show navigating state and navigate
          setIsNavigating(true);
          router.push(url);
        } else {
          // If already on results page, use router.replace to update URL without adding history entry
          setIsNavigating(true);
          await router.replace(url);
          // Only after the URL is updated, trigger the search
          await handleSearch();
          setIsNavigating(false);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setFormError('An error occurred. Please try again.');
        setIsNavigating(false);
      }
    }
  };

  return (
    <Card
      className={cn(
        'search-form-container relative', // Removed 'overflow-hidden'
        'bg-gradient-to-br from-[#012620] via-[#012620] to-[#023428]',
        'border-none shadow-xl mb-4 sm:mb-6 mt-1 sm:mt-2',
        'transition-all duration-300'
      )}
      allowOverflow={true} // This prop should allow overflow
    >
      <motion.div
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
        initial={{ scaleX: 0.5, opacity: 0.5 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      ></motion.div>

      <form
        className="py-5 sm:py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10 overflow-visible"
        onSubmit={handleSubmit}
        aria-label="JourneyPlanner search form"
      >
        <motion.h2
          className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <i className="fas fa-route mr-2 sm:mr-3 text-emerald-400"></i>
          Find Your Route
        </motion.h2>

        <div className="relative overflow-visible">
          <LocationSearchInput />
        </div>

        <AnimatePresence>
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
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={isSearchDisabled}
          isLoading={showLoading}
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className={cn(
            'mt-6 sm:mt-8 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30',
            'transition-all duration-300',
            hasBothLocations
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-700'
          )}
          leftIcon={
            !hasBothLocations ? (
              <i className="fas fa-map-marker-alt" />
            ) : isNavigating ? (
              <i className="fas fa-location-arrow animate-pulse" />
            ) : (
              <i className="fas fa-search" />
            )
          }
        >
          {isLoading && hasBothLocations
            ? 'Finding Stations Nearby...'
            : isRoutesLoading
            ? 'Searching Routes...'
            : isNavigating
            ? 'Finding Your Routes...'
            : !hasBothLocations
            ? 'Select Both Locations'
            : 'Find Routes'}
        </Button>
      </form>

      {/* Visual effects for loading states */}
      {showLoading && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </Card>
  );
});
