import { Route } from '@/types/route';
import { RouteCard } from './RouteCard';

interface RouteResultsProps {
  routes: Route[];
}

export function RouteResults({ routes }: RouteResultsProps) {
  const routeCount = routes.length;
  const routeText = `${routeCount} route${routeCount !== 1 ? 's' : ''} found`;

  return (
    <div className="route-results rounded-2xl bg-white shadow-lg border border-gray-100">
      <header className="results-header px-6 py-5 border-b border-gray-100">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-gray-800">Suggested Routes</h3>
          <p className="text-sm text-gray-500">{routeText}</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-6">
        <RouteCard routes={routes} />
      </div>
    </div>
  );
}
