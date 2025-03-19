'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchForm } from './SearchForm';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { motion } from 'framer-motion';

interface SearchSectionProps {
  fromText?: string;
  toText?: string;
  isResultsPage: boolean;
  isModifyingSearch: boolean;
  toggleModifySearch: () => void;
  isLoading: boolean;
}

export function SearchSection({
  fromText,
  toText,
  isResultsPage,
  isModifyingSearch,
  toggleModifySearch,
  isLoading,
}: SearchSectionProps) {
  const { fromLocation, toLocation } = useJourney();

  if (!isResultsPage || (!fromLocation && !toLocation)) {
    return <SearchForm isResultsPage={isResultsPage} />;
  }

  return (
    <div className="mb-8">
      {isModifyingSearch ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="animate-fade-in"
        >
          <Card className="bg-white/95 shadow-md border border-gray-100 p-4 sm:p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Modify Your Search</h2>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-[color:var(--color-accent)]"
                onClick={toggleModifySearch}
                leftIcon={<i className="fas fa-times" />}
              >
                Cancel
              </Button>
            </div>
            <SearchForm isResultsPage={isResultsPage} isLoading={isLoading} />
          </Card>
        </motion.div>
      ) : (
        <Card className="bg-white/95 shadow-sm border border-gray-100 p-4 sm:p-6 rounded-xl">
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
              onClick={toggleModifySearch}
              className="border-[color:var(--color-accent)]/50 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10"
              leftIcon={<i className="fas fa-search" />}
            >
              Modify Search
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
