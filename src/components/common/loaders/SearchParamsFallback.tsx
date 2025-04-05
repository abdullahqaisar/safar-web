import { Card } from '@/components/common/Card';
import { Star, Info } from 'lucide-react';

/**
 * SearchParamsFallback component
 *
 * Provides a loading skeleton that closely resembles the actual content
 * for a smoother transition when used with Suspense.
 * Designed to match the exact dimensions and layout of the real content
 * to prevent layout shifts during loading.
 */
export function SearchParamsFallback() {
  return (
    <div className="animate-fade-in">
      {/* Search form skeleton */}
      <div className="py-4">
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-center mb-5">
              <div className="w-5 h-5 bg-emerald-100 rounded-full mr-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 w-32 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 bg-emerald-100 rounded-lg animate-pulse mt-5"></div>
            </div>
          </div>
        </Card>

        {/* Results area skeleton */}
        <div className="mt-6">
          {/* Section header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-full animate-pulse mr-3"></div>
              <div className="h-8 bg-gray-200 w-48 rounded-md animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-100 w-64 mx-auto rounded-md animate-pulse mt-2"></div>
          </div>

          {/* Route cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[260px]"
              >
                <div className="p-4 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full mr-3"></div>
                    <div>
                      <div className="h-5 bg-gray-200 w-24 rounded-md"></div>
                      <div className="h-3 bg-gray-100 w-16 rounded-md mt-1"></div>
                    </div>
                  </div>

                  <div className="h-20 bg-gray-50 border-t border-b border-gray-100 rounded-md mb-4"></div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="h-5 bg-blue-100 w-20 rounded-full"></div>
                    <div className="h-5 bg-green-100 w-24 rounded-full"></div>
                  </div>

                  <div className="h-10 bg-emerald-100 rounded-md w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Tips area skeleton that matches the PopularDestinations and JourneyTips layout */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 hidden md:grid">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-64 animate-pulse">
          <div className="flex items-center mb-4">
            <Star size={18} className="text-emerald-200 mr-2" />
            <div className="h-5 bg-gray-200 w-48 rounded-md"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-64 animate-pulse">
          <div className="flex items-center mb-4">
            <Info size={18} className="text-emerald-200 mr-2" />
            <div className="h-5 bg-gray-200 w-40 rounded-md"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex">
                <div className="w-5 h-5 bg-emerald-100 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 w-24 rounded-md mb-1"></div>
                  <div className="h-3 bg-gray-100 w-full rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
