import { Route } from '@/types/route';
import { RouteCard } from './RouteCard';

interface RouteResultsProps {
  routes: Route[];
}

export function RouteResults({ routes }: RouteResultsProps) {
  const routeCount = routes.length;
  const routeText = `${routeCount} route${routeCount !== 1 ? 's' : ''} found`;

  return (
    <div className="route-results bg-white rounded-b-2xl">
      <header className="results-header">
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Suggested Routes</h3>
          <p className="text-sm text-gray-500">{routeText}</p>
        </div>
      </header>

      <RouteCard routes={routes} />
    </div>
  );
}
