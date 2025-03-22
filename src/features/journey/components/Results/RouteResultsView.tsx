'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { JourneyResults } from './JourneyResults';
import { RouteResultsLoader } from './RouteResultsLoader';
import { Button } from '@/components/common/Button';
import { Route } from '@/types/route';
import { Route as RouteIcon, AlertTriangle, Search } from 'lucide-react';

export interface RouteResultsViewProps {
  isLoading: boolean;
  loadingProgress: number;
  routes: Route[] | undefined;
  error: Error | null;
  fromText: string | null;
  toText: string | null;
}

export function RouteResultsView({
  isLoading,
  loadingProgress,
  routes,
  error,
  fromText,
  toText,
}: RouteResultsViewProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <RouteResultsLoader
            fromText={fromText || 'selected location'}
            toText={toText || 'destination'}
            loadingProgress={loadingProgress}
          />
        </motion.div>
      )}

      {!isLoading && !error && routes && routes.length > 0 && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <JourneyResults routes={routes} />
        </motion.div>
      )}

      {!isLoading && !error && routes && routes.length === 0 && (
        <motion.div
          key="no-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[rgba(var(--color-warning-rgb),0.1)] rounded-full flex items-center justify-center mb-4">
              <RouteIcon className="text-[var(--color-warning)]" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Routes Found
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              We couldn&apos;t find any routes between these locations. Try
              different locations or check back later.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Search size={16} />}
              data-variant="secondary"
            >
              Try Different Locations
            </Button>
          </div>
        </motion.div>
      )}

      {!isLoading && error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-[rgba(var(--color-error-rgb),0.2)] text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[rgba(var(--color-error-rgb),0.1)] rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-[var(--color-error)]" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Error Finding Routes
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              {error instanceof Error
                ? error.message
                : "We couldn't find routes for your selected locations. No public transit station was found nearby or the service is temporarily unavailable."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Search size={16} />}
              data-variant="secondary"
            >
              Try Different Locations
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
