import React from 'react';
import { ArrowLeft, Map, Grid3x3, X } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

interface PageHeaderProps {
  title: string;
  activeView: 'map' | 'overview';
  onViewChange: (view: 'map' | 'overview') => void;
  hasSelection?: boolean;
  onClearSelection?: () => void;
  onBack?: () => void;
}

export default function PageHeader({
  title,
  activeView,
  onViewChange,
  hasSelection = false,
  onClearSelection,
  onBack = () => window.history.back(),
}: PageHeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* View switcher */}
        <div className="bg-gray-100 p-1 rounded-full shadow-inner flex">
          <button
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              activeView === 'overview'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-800'
            )}
            onClick={() => onViewChange('overview')}
          >
            <span className="flex items-center gap-1.5">
              <Grid3x3 className="w-4 h-4" />
              <span>Lines</span>
            </span>
          </button>
          <button
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              activeView === 'map'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-800'
            )}
            onClick={() => onViewChange('map')}
          >
            <span className="flex items-center gap-1.5">
              <Map className="w-4 h-4" />
              <span>Map</span>
            </span>
          </button>
        </div>

        {hasSelection && onClearSelection && (
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-700"
            aria-label="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
