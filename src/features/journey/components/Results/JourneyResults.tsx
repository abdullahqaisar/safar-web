import { useState } from 'react';
import { Route } from '@/types/route';
import { JourneyCard } from './JourneyCard';
import { JourneyDetails } from './JourneyDetails';
import { AnimatePresence, motion } from 'framer-motion';

interface JourneyResultsProps {
  routes: Route[];
}

export function JourneyResults({ routes }: JourneyResultsProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const selectedRoute = selectedRouteId
    ? routes.find((route) => route.id === selectedRouteId)
    : null;

  return (
    <section className="animate-fade-in mt-2" aria-label="Route Results">
      <AnimatePresence mode="wait">
        {!selectedRoute ? (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Recommended Routes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {routes.map((route, index) => (
                <motion.div
                  key={`route-${route.id || route.totalDuration}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.05, duration: 0.3 },
                  }}
                >
                  <JourneyCard
                    route={route}
                    onSelect={() =>
                      setSelectedRouteId(route.id || `route-${index}`)
                    }
                    isRecommended={index === 0}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <JourneyDetails
              route={selectedRoute}
              onBack={() => setSelectedRouteId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
