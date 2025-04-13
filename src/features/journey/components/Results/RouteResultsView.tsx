'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { JourneyResults } from './JourneyResults';
import { RouteResultsLoader } from './RouteResultsLoader';
import { Button } from '@/components/common/Button';
import { Route } from '@/types/route';
import {
  Route as RouteIcon,
  AlertTriangle,
  Search,
  Info,
  X,
} from 'lucide-react';
import Link from 'next/link';

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
  // State to track if beta banner has been dismissed
  const [isBetaBannerVisible, setIsBetaBannerVisible] = useState(true);

  // Check local storage for banner dismissal on mount
  useEffect(() => {
    const bannerDismissedTimestamp = localStorage.getItem(
      'safar_beta_banner_dismissed_timestamp'
    );
    if (bannerDismissedTimestamp) {
      const dismissedTime = parseInt(bannerDismissedTimestamp, 10);
      const currentTime = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      // Only hide the banner if less than one day has passed since dismissal
      if (currentTime - dismissedTime < oneDayInMs) {
        setIsBetaBannerVisible(false);
      } else {
        // Clear the old timestamp if more than a day has passed
        localStorage.removeItem('safar_beta_banner_dismissed_timestamp');
      }
    }
  }, []);

  // Handle dismissing the banner
  const dismissBetaBanner = () => {
    setIsBetaBannerVisible(false);
    // Store the current timestamp instead of a boolean
    localStorage.setItem(
      'safar_beta_banner_dismissed_timestamp',
      new Date().getTime().toString()
    );
  };

  return (
    <>
      {/* Beta Notice Banner */}
      <AnimatePresence>
        {isBetaBannerVisible &&
          !isLoading &&
          !error &&
          routes &&
          routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-xl mb-6 overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 flex-shrink-0 mt-0.5">
                    <Info size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <p className="text-sm font-medium text-blue-800">
                        Route Planning Beta
                      </p>
                      <button
                        onClick={dismissBetaBanner}
                        className="text-blue-400 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded-full"
                        aria-label="Dismiss beta notice"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      We&apos;re enhancing our route suggestions. While most
                      work well, some routes may differ from optimal paths. Your
                      feedback helps us improve!
                    </p>
                    <div className="mt-3">
                      <Link href="/contribute" passHref>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 py-1 px-3"
                          leftIcon={<AlertTriangle size={12} />}
                          data-variant="outline"
                        >
                          Share Your Experience
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

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
                <AlertTriangle
                  className="text-[var(--color-error)]"
                  size={24}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Error Finding Routes
              </h3>
              <p className="text-gray-600 mb-4 max-w-md">
                {error instanceof Error
                  ? error.message
                  : "We couldn't find routes for your selected locations. No public transit station was found nearby or the service is temporarily unavailable."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
