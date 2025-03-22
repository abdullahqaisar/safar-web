import { useState } from 'react';
import { Route } from '@/types/route';
import { JourneyCard } from './JourneyCard';
import { JourneyDetails } from './JourneyDetails';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

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
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
                Recommended{' '}
                <span className="text-[color:var(--color-accent)]">Routes</span>
              </h2>
              <p className="text-[color:var(--color-gray-600)] mt-2 max-w-2xl mx-auto">
                {routes.length} route
                {routes.length !== 1 ? 's' : ''} found. Select one to view
                details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route, index) => (
                <motion.div
                  key={`route-${route.id || route.totalDuration}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.4 },
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <JourneyCard
                    route={route}
                    onSelect={() =>
                      setSelectedRouteId(route.id || `route-${index}`)
                    }
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
            <div className="mb-6">
              <button
                onClick={() => setSelectedRouteId(null)}
                className="flex items-center text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] transition-colors font-medium"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to routes
              </button>
            </div>
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
