'use client';

import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils/formatters';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { useJourneySearch } from '@/features/search/hooks/useJourneySearch';
import JourneySearchForm from '@/features/search/components/JourneySearchForm';
import {
  Route as RouteIcon,
  AlertCircle,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';

export function HeroSearchForm() {
  const { isFormValid } = useJourney();
  const {
    setFromValue,
    setToValue,
    formError,
    isNavigating,
    hasBothLocations,
    submitSearch,
  } = useJourneySearch();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    submitSearch();
  };

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
          <RouteIcon className="mr-2 sm:mr-3 text-emerald-400" size={20} />
          Find Your Route
        </motion.h2>

        <div className="relative overflow-visible">
          <JourneySearchForm
            onFromValueChange={setFromValue}
            onToValueChange={setToValue}
          />
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="inline mr-2" size={16} />
              {formError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isNavigating || isLoading}
          isLoading={isNavigating || isLoading}
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className={cn(
            'mt-6 sm:mt-8 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30',
            'transition-all duration-300',
            hasBothLocations
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-gray-600 hover:bg-gray-700'
          )}
          leftIcon={
            !hasBothLocations ? (
              <MapPin size={16} />
            ) : isNavigating || isLoading ? (
              <Navigation size={16} className="animate-pulse" />
            ) : (
              <Search size={16} />
            )
          }
        >
          {isNavigating || isLoading
            ? 'Finding Your Routes...'
            : !hasBothLocations
            ? 'Select Both Locations'
            : 'Find Routes'}
        </Button>
      </form>

      {isNavigating && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-emerald-600"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          aria-hidden="true"
        />
      )}
    </Card>
  );
}
