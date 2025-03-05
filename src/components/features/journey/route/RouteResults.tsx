import { Route } from '@/types/route';
import { RouteCard } from './RouteCard';

interface RouteResultsProps {
  route: Route;
}

export function RouteResults({ route }: RouteResultsProps) {
  return (
    <div className="route-results bg-white rounded-b-2xl">
      <div className="results-header">
        <div>
          <h3 className="font-bold text-lg">Suggested Routes</h3>
          <p className="text-sm text-gray-500">1 route found</p>
        </div>
      </div>

      <RouteCard route={route} />
    </div>
  );
}
