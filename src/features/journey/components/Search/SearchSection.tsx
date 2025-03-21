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
  isLoading: boolean;
}

export function SearchSection({
  fromText,
  toText,
  isResultsPage,
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

  useEffect(() => {
    if (fromText !== undefined) setFromValue(fromText);
    if (toText !== undefined) setToValue(toText);
  }, [fromText, toText, setFromValue, setToValue]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    userInitiatedSearchRef.current = true;
    submitSearch(e);
  };

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

  const handleStartModifying = () => {
    setIsModifying(true);
    document.body.classList.add('search-section-editing');
  };

  useEffect(() => {
    if (!isModifying) {
      document.body.classList.remove('search-section-editing');
    }
  }, [isModifying]);

  if (!isResultsPage) {
    return null;
  }

  const buttonIsLoading =
    userInitiatedSearchRef.current && (isLoading || isSearching);

  return (
    <Card
      className="relative bg-white border border-gray-200  rounded-xl mb-6 overflow-visible transition-all duration-300"
      style={{ overflow: 'visible' }}
    >
      {!isModifying && (
        <div className="absolute right-3 top-3 z-10">
          <Button
            size="sm"
            variant="primary"
            className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs bg-emerald-500 text-white  hover:bg-emerald-600 "
            onClick={handleStartModifying}
            disabled={isLoading}
            aria-label="Modify search"
          >
            <Edit size={12} />
            <span className="pl-2">Edit</span>
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isModifying ? (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 sm:p-6"
            style={{ overflow: 'visible' }}
          >
            <form
              ref={formRef}
              onSubmit={handleSearchSubmit}
              style={{ overflow: 'visible' }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base sm:text-lg font-medium text-gray-800 flex items-center">
                  <Search size={18} className="mr-2 text-emerald-500" />
                  Modify Journey
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle
                    size={16}
                    className="mt-0.5 mr-2 flex-shrink-0"
                  />
                  <span>{formError}</span>
                </motion.div>
              )}

              <div className="mt-5 grid gap-3">
                <Button
                  size="md"
                  variant="primary"
                  isLoading={buttonIsLoading}
                  disabled={!isFormValid || buttonIsLoading}
                  className="justify-center bg-emerald-500 hover:bg-emerald-600 sm:order-2"
                  leftIcon={<Search size={16} />}
                  type="submit"
                >
                  {buttonIsLoading ? 'Searching...' : 'Search Routes'}
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
            className="p-4 sm:p-5 group"
          >
            <div className="mb-4 flex items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                Journey Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-x-4">
              {/* From location */}
              <div className="flex items-center py-1">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                  <MapPin className="text-green-600 w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">From</p>
                  <p className="font-medium truncate text-base">
                    {fromText || 'Selected location'}
                  </p>
                </div>
              </div>

              <div className="sm:hidden flex justify-center text-gray-300">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <ArrowDown size={14} />
                </div>
              </div>

              <div className="flex items-center py-1">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3">
                  <MapPin className="text-red-600 w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">To</p>
                  <p className="font-medium truncate text-base">
                    {toText || 'Selected location'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
