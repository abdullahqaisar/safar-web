import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils/formatters';
import { Route as RouteIcon } from 'lucide-react';

/**
 * SearchParamsFallback component
 *
 * Provides a loading skeleton that closely resembles the actual content
 * for a smoother transition when used with Suspense.
 */
export function SearchParamsFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC]">
      {/* Skeleton header */}
      <div className="py-8 mb-4">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="h-10 bg-gray-200 w-48 rounded-md animate-pulse"></div>
          <div className="h-4 bg-gray-200 w-72 rounded-md animate-pulse mt-2"></div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 md:py-6">
        {/* Search form skeleton */}
        <Card
          className={cn(
            'search-form-container relative',
            'bg-gradient-to-br from-[#012620]/90 via-[#012620]/90 to-[#023428]/90',
            'backdrop-blur-lg',
            'border-white/10 shadow-xl mb-6',
            'transition-all duration-300'
          )}
          allowOverflow={true}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

          <div className="py-5 sm:py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10">
            <div className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <RouteIcon className="mr-2 sm:mr-3 text-emerald-400" size={20} />
              Find Your Route
            </div>

            <div className="space-y-4">
              <div className="h-14 bg-white/10 rounded-lg w-full animate-pulse" />
              <div className="h-14 bg-white/10 rounded-lg w-full animate-pulse" />
              <div className="h-12 bg-gray-600 rounded-lg w-full mt-6 sm:mt-8 animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Results area skeleton */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl shadow-sm h-64 animate-pulse p-5">
            <div className="w-1/3 h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-100 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-100 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm h-64 animate-pulse p-5">
            <div className="w-1/3 h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-100 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-100 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
