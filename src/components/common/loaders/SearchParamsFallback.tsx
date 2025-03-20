import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils/formatters';
import { Route as RouteIcon } from 'lucide-react';

export function SearchParamsFallback() {
  return (
    <Card
      className={cn(
        'search-form-container relative',
        'bg-gradient-to-br from-[#012620]/90 via-[#012620]/90 to-[#023428]/90',
        'backdrop-blur-lg',
        'border-white/10 shadow-xl mb-4 sm:mb-6 mt-1 sm:mt-2',
        'transition-all duration-300'
      )}
      allowOverflow={true}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <div className="py-5 sm:py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10 overflow-visible">
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
  );
}
