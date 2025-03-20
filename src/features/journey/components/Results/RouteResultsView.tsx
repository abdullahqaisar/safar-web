'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { JourneyResults } from './JourneyResults';
import { RouteResultsLoader } from './RouteResultsLoader';
import { Button } from '@/components/common/Button';
import { Route } from '@/types/route';

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
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-route text-amber-500 text-xl"></i>
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
              leftIcon={<i className="fas fa-search" />}
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
          className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
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
              leftIcon={<i className="fas fa-search" />}
            >
              Try Different Locations
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
