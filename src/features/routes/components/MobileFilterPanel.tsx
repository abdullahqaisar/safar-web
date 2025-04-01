import { useEffect, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import { cn } from '@/lib/utils/formatters';

interface MobileFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  metroLines: TransitLine[];
  visibleLines: string[];
  onToggleLineVisibility: (lineId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function MobileFilterPanel({
  isOpen,
  onClose,
  metroLines,
  visibleLines,
  onToggleLineVisibility,
  onShowAll,
  onHideAll,
}: MobileFilterPanelProps) {
  const [mounted, setMounted] = useState(false);

  // Control animation timing
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 bg-white rounded-t-xl shadow-lg transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800">Line Visibility</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lines List */}
        <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
          {metroLines.map((line) => {
            const isVisible = visibleLines.includes(line.id);
            return (
              <div key={line.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-sm font-medium">{line.name}</span>
                </div>
                <button
                  onClick={() => onToggleLineVisibility(line.id)}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                    isVisible
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isVisible ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onHideAll}
              className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              Hide All
            </button>
            <button
              onClick={onShowAll}
              className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              Show All
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
