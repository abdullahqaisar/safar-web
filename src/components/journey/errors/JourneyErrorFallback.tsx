'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/formatters';

export function JourneyErrorFallback() {
  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    window.location.reload();
  };

  return (
    <Card
      className={cn(
        'relative',
        'bg-gradient-to-br from-red-600/95 via-red-700/95 to-red-800/95',
        'border-none shadow-xl mb-8'
      )}
      allowOverflow={true}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400/30 to-transparent"></div>
      <div className="py-8 px-5 sm:py-12 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white/10 p-4 rounded-full mb-6 backdrop-blur-sm">
            <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            We hit a roadblock
          </h3>
          <p className="text-white/80 mb-6 max-w-md">
            Something went wrong with the journey planner. Please try refreshing
            the page.
          </p>
          <button
            onClick={handleRefresh}
            className="bg-white text-red-700 px-6 py-2.5 rounded-md 
            hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium"
            type="button"
            aria-label="Refresh page"
          >
            <i className="fas fa-redo-alt" aria-hidden="true"></i>
            Refresh Page
          </button>
        </div>
      </div>
    </Card>
  );
}
