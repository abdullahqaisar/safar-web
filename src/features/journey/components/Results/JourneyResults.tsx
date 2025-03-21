import { Route } from '@/types/route';
import { JourneyCard } from './JourneyCard';

interface JourneyResultsProps {
  routes: Route[];
}

export function JourneyResults({ routes }: JourneyResultsProps) {
  if (!routes.length) {
    return null;
  }

  return (
    <section className="animate-fade-in  mt-2" aria-label="Route Results">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-medium">Recommended Routes</h2>
      </div>

      <div className=" space-y-6">
        {routes.map((route, index) => (
          <JourneyCard
            key={`route-${route.totalDuration}-${index}`}
            route={route}
          />
        ))}
      </div>
    </section>
  );
}
