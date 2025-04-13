'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useJourneySearch } from '@/features/search/hooks/useJourneySearch';
import JourneySearchForm from '../../../search/components/JourneySearchForm';
import { X, AlertCircle, ArrowDown, Search, MapPin, Edit } from 'lucide-react';

interface SearchSectionProps {
  fromText?: string;
  toText?: string;
  isResultsPage: boolean;
  isSearchMode?: boolean;
  isLoading: boolean;
}

export function SearchSection({
  fromText,
  toText,
  isResultsPage,
  isSearchMode = false,
  isLoading,
}: SearchSectionProps) {
  const pathname = usePathname();
  const { isFormValid } = useJourney();
  const [isModifying, setIsModifying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const prevLoadingRef = useRef(isLoading);
  const userInitiatedSearchRef = useRef(false);

  const {
    fromValue,
    toValue,
    setFromValue,
    setToValue,
    formError,
    isNavigating: isSearching,
    setIsNavigating,
    submitSearch,
  } = useJourneySearch({
    redirectPath: pathname,
  });

  // Update form values when props change
  useEffect(() => {
    if (fromText !== undefined) setFromValue(fromText);
    if (toText !== undefined) setToValue(toText);
  }, [fromText, toText, setFromValue, setToValue]);

  // Handle loading state changes
  useEffect(() => {
    if (
      userInitiatedSearchRef.current &&
      prevLoadingRef.current &&
      !isLoading
    ) {
      setIsNavigating(false);

      if (isModifying) {
        setIsModifying(false);
      }

      userInitiatedSearchRef.current = false;
    }

    prevLoadingRef.current = isLoading;
  }, [isLoading, isModifying, setIsNavigating]);

  // Form submission handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    userInitiatedSearchRef.current = true;
    submitSearch(e);
  };

  // Handle overflow for form elements
  useEffect(() => {
    if (isModifying) {
      const setOverflowVisible = (element: HTMLElement | null) => {
        while (element && element !== document.body) {
          if (getComputedStyle(element).overflow !== 'visible') {
            element.style.overflow = 'visible';
          }
          element = element.parentElement;
        }
      };

      if (formRef.current) {
        setOverflowVisible(formRef.current);
      }
    }
  }, [isModifying]);

  // Handle edit mode
  const handleStartModifying = () => {
    setIsModifying(true);
    document.body.classList.add('search-section-editing');
  };

  // Clean up body class
  useEffect(() => {
    if (!isModifying) {
      document.body.classList.remove('search-section-editing');
    }
  }, [isModifying]);

  // If we're in search mode, always show the search form
  if (isSearchMode) {
    return (
      <Card
        className="relative bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-visible transition-all duration-300"
        style={{ overflow: 'visible' }}
      >
        <motion.div
          key="search-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 sm:p-6"
          style={{ overflow: 'visible' }}
        >
          <form
            ref={formRef}
            onSubmit={handleSearchSubmit}
            style={{ overflow: 'visible' }}
            className="relative"
          >
            <div className="mb-5">
              <h2 className="text-base sm:text-lg font-medium text-gray-800 flex items-center">
                <Search size={18} className="mr-2 text-emerald-500" />
                Find Routes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter your starting point and destination to discover available
                routes
              </p>
            </div>

            <div
              className="space-y-4"
              style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}
            >
              <div className="relative z-50" style={{ overflow: 'visible' }}>
                <JourneySearchForm
                  initialFromText={fromValue}
                  initialToText={toValue}
                  onFromValueChange={setFromValue}
                  onToValueChange={setToValue}
                  lightMode={true}
                />
              </div>
            </div>

            {formError && (
              <div
                className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-5">
              <Button
                size="lg"
                variant="primary"
                isLoading={isLoading || isSearching}
                disabled={!isFormValid || isLoading || isSearching}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
                leftIcon={<Search size={16} />}
                type="submit"
              >
                {isLoading || isSearching ? 'Searching...' : 'Search Routes'}
              </Button>
            </div>
          </form>
        </motion.div>
      </Card>
    );
  }

  // Don't render anything if not in results page mode
  if (!isResultsPage) {
    return null;
  }

  const buttonIsLoading =
    userInitiatedSearchRef.current && (isLoading || isSearching);

  // Results page view with improved edit button - simplified animation
  return (
    <Card
      className="relative bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-visible transition-all duration-300"
      style={{ overflow: 'visible' }}
    >
      {!isModifying && (
        <div className="absolute right-5 top-5 z-10">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 py-2 px-3 text-xs bg-white border-emerald-500 text-emerald-600 hover:bg-gray-50"
            onClick={handleStartModifying}
            disabled={isLoading}
            aria-label="Edit journey"
          >
            <Edit size={13} />
            <span className="pl-1">Edit Journey</span>
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isModifying ? (
          // Edit form view - simplified animation
          <div className="p-5 sm:p-6" style={{ overflow: 'visible' }}>
            <form
              ref={formRef}
              onSubmit={handleSearchSubmit}
              style={{ overflow: 'visible' }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base sm:text-lg font-medium text-gray-800 flex items-center">
                  <Search size={18} className="mr-2 text-emerald-500" />
                  Edit Journey
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2"
                  onClick={() => setIsModifying(false)}
                  aria-label="Cancel"
                >
                  <X size={16} />
                </Button>
              </div>

              <div
                className="space-y-4"
                style={{
                  overflow: 'visible',
                  position: 'relative',
                  zIndex: 50,
                }}
              >
                <div className="relative z-50" style={{ overflow: 'visible' }}>
                  <JourneySearchForm
                    initialFromText={fromValue}
                    initialToText={toValue}
                    onFromValueChange={setFromValue}
                    onToValueChange={setToValue}
                    lightMode={true}
                  />
                </div>
              </div>

              {formError && (
                <div
                  className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle
                    size={16}
                    className="mt-0.5 mr-2 flex-shrink-0"
                  />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button
                  size="md"
                  variant="ghost"
                  className="px-4 justify-center"
                  onClick={() => setIsModifying(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  isLoading={buttonIsLoading}
                  disabled={!isFormValid || buttonIsLoading}
                  className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700"
                  leftIcon={<Search size={16} />}
                  type="submit"
                >
                  {buttonIsLoading ? 'Searching...' : 'Search Routes'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // Journey details view - better styling to match map page
          <div className="p-5 sm:p-6 group">
            <div className="mb-3 flex items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                <Search size={18} className="mr-2 text-emerald-500" />
                Journey Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-x-6 mt-4 mb-3 pr-16 sm:pr-0">
              {/* From location */}
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                  <MapPin className="text-green-600 w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide font-medium">
                    From
                  </p>
                  <p className="font-medium truncate text-gray-800">
                    {fromText || 'Selected location'}
                  </p>
                </div>
              </div>

              <div className="sm:hidden flex justify-center my-1 text-gray-300">
                <div className="w-8 h-8 flex items-center justify-center">
                  <ArrowDown size={14} />
                </div>
              </div>

              {/* To location */}
              <div className="flex items-center py-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                  <MapPin className="text-red-600 w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide font-medium">
                    To
                  </p>
                  <p className="font-medium truncate text-gray-800">
                    {toText || 'Selected location'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
