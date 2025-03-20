'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useJourneySearch } from '@/features/search/hooks/useJourneySearch';
import JourneySearchForm from '../../../search/components/JourneySearchForm';
import { X, AlertCircle, ArrowRight, Search } from 'lucide-react';

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
      className="bg-white/95 shadow-sm border border-gray-100 p-4 sm:p-6 rounded-xl mb-8"
      style={{ overflow: 'visible' }}
    >
      <AnimatePresence mode="wait">
        {isModifying ? (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ overflow: 'visible' }}
          >
            <form
              ref={formRef}
              onSubmit={handleSearchSubmit}
              style={{ overflow: 'visible' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Modify Your Journey</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-[color:var(--color-accent)]"
                  onClick={() => setIsModifying(false)}
                  leftIcon={<X size={16} />}
                  type="button"
                >
                  Cancel
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
                  <div
                    className="relative z-50"
                    style={{ overflow: 'visible' }}
                  >
                    <JourneySearchForm
                      initialFromText={fromValue}
                      initialToText={toValue}
                      onFromValueChange={setFromValue}
                      onToValueChange={setToValue}
                      lightMode={true}
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle size={16} className="inline mr-2" />
                  {formError}
                </motion.div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={buttonIsLoading}
                  disabled={!isFormValid || buttonIsLoading}
                  className="bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)]"
                  leftIcon={<Search size={16} />}
                  type="submit"
                >
                  {buttonIsLoading ? 'Searching...' : 'Find Routes'}
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
                <ArrowRight size={16} />
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
                onClick={handleStartModifying}
                className="border-[color:var(--color-accent)]/50 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10"
                leftIcon={<Search size={16} />}
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
