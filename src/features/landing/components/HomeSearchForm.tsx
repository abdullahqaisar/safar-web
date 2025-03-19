'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils/formatters';
import LocationSearchInput from '@/features/journey/components/LocationSearchInput/LocationSearchInput';
import { useJourney } from '@/features/journey/hooks/useJourney';

export function HomeSearchForm() {
  const router = useRouter();
  const { fromLocation, toLocation, isFormValid } = useJourney();

  const [isNavigating, setIsNavigating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasBothLocations = Boolean(fromLocation && toLocation);

  // Clear error when location is selected
  useEffect(() => {
    if (formError && (fromLocation || toLocation)) {
      setFormError(null);
    }
  }, [fromLocation, toLocation, formError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fromLocation || !toLocation) {
      setFormError('Please select both origin and destination locations');
      return;
    }

    if (!isFormValid || isNavigating) return;

    try {
      setIsNavigating(true);
      setFormError(null);

      const params = new URLSearchParams();

      // Add coordinates
      params.set('fromLat', fromLocation.lat.toString());
      params.set('fromLng', fromLocation.lng.toString());
      params.set('toLat', toLocation.lat.toString());
      params.set('toLng', toLocation.lng.toString());

      // Add text labels if available
      const fromInput = document.getElementById(
        'from-location'
      ) as HTMLInputElement;
      const toInput = document.getElementById(
        'to-location'
      ) as HTMLInputElement;

      if (fromInput?.value) {
        params.set('fromText', encodeURIComponent(fromInput.value));
      }
      if (toInput?.value) {
        params.set('toText', encodeURIComponent(toInput.value));
      }

      params.set('ts', Date.now().toString());

      const url = `/journey?${params.toString()}`;
      router.push(url);
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError('An error occurred. Please try again.');
      setIsNavigating(false);
    }
  }

  return (
    <Card
      className={cn(
        'search-form-container relative',
        'bg-gradient-to-br from-[#012620]/90 via-[#012620]/90 to-[#023428]/90',
        'backdrop-blur-lg',
        'border-white/10 shadow-xl mb-4 sm:mb-6 mt-1 sm:mt-2',
        'transition-all duration-300'
      )}
      allowOverflow={true}
    >
      <motion.div
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
        initial={{ scaleX: 0.5, opacity: 0.5 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />

      <form
        className="py-5 sm:py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10 overflow-visible"
        onSubmit={handleSubmit}
        aria-label="Journey search form"
      >
        <motion.h2
          className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <i className="fas fa-route mr-2 sm:mr-3 text-emerald-400" />
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
              <i className="fas fa-exclamation-circle mr-2" />
              {formError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isNavigating}
          isLoading={isNavigating}
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
          {isNavigating
            ? 'Finding Your Routes...'
            : !hasBothLocations
            ? 'Select Both Locations'
            : 'Find Routes'}
        </Button>
      </form>

      {isNavigating && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </Card>
  );
}
