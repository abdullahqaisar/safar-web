import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Train, Eye, EyeOff, Map } from 'lucide-react';

interface MetroLine {
  id: string;
  name: string;
  color?: string;
  isVisible?: boolean;
}

interface UnifiedMobileMenuProps {
  metroLines: MetroLine[];
  selectedLine?: string;
  visibleLines: string[];
  onSelectLine: (lineId: string | undefined) => void;
  onToggleLine: (lineId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const UnifiedMobileMenu = ({
  metroLines,
  selectedLine,
  visibleLines,
  onSelectLine,
  onToggleLine,
  onShowAll,
  onHideAll,
}: UnifiedMobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected line data
  const selectedLineData = metroLines.find((line) => line.id === selectedLine);

  // Enhanced metroLines with visibility info
  const enhancedLines = metroLines.map((line) => ({
    ...line,
    isVisible: visibleLines.includes(line.id),
  }));

  // Count visible lines (accurately based on actual visibility)
  const visibleLineCount = visibleLines.length;
  const totalLineCount = metroLines.length;

  // Calculate a more meaningful visibility status for the dropdown header
  const getVisibilityStatus = () => {
    if (selectedLine) {
      return selectedLineData && visibleLines.includes(selectedLine)
        ? 'Selected line visible'
        : 'Selected line hidden';
    } else {
      if (visibleLineCount === 0) return 'All lines hidden';
      if (visibleLineCount === totalLineCount) return 'All lines visible';
      return `${visibleLineCount} of ${totalLineCount} visible`;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectLine = (lineId: string) => {
    onSelectLine(lineId);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onSelectLine(undefined);
    setIsOpen(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div
      className="sticky top-16 md:relative md:top-0 z-30 md:hidden mb-4 bg-[#FEF6EC] px-4 -mx-4 py-2"
      ref={dropdownRef}
    >
      {/* Semi-transparent backdrop when dropdown is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20"
          aria-hidden="true"
          onClick={closeMenu}
        />
      )}

      {/* Dropdown toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full p-3 bg-white shadow-md rounded-lg border ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-gray-200'
        } relative z-30 transition-all`}
        aria-expanded={isOpen}
      >
        {selectedLineData ? (
          <div className="flex items-center">
            <div
              className="w-5 h-5 rounded-full mr-2"
              style={{ backgroundColor: selectedLineData.color || '#888' }}
            />
            <span className="font-medium truncate">
              {selectedLineData.name}
            </span>
            <span className="ml-2 text-xs text-emerald-600">
              {visibleLines.includes(selectedLine || '') ? (
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  Visible
                </span>
              ) : (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                  Hidden
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center">
            <Train size={18} className="mr-2 text-emerald-600" />
            <span className="font-medium text-gray-700">Transit Lines</span>
            <span className="ml-2 text-xs text-emerald-600">
              {visibleLineCount === totalLineCount ? (
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  All visible
                </span>
              ) : visibleLineCount === 0 ? (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                  All hidden
                </span>
              ) : (
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  {visibleLineCount}/{totalLineCount}
                </span>
              )}
            </span>
          </div>
        )}
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            isOpen
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-gray-600'
          } transition-colors`}
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 z-30 ${
          isOpen
            ? 'opacity-100 max-h-[70vh] translate-y-0'
            : 'opacity-0 max-h-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header with visibility info */}
        <div className="sticky top-0 bg-emerald-50 p-3 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <Train size={16} className="mr-2 text-emerald-600" />
            <span className="font-medium text-emerald-800">
              {getVisibilityStatus()}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onHideAll}
              className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Hide All
            </button>
            <button
              onClick={onShowAll}
              className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors"
            >
              Show All
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
        >
          {/* View all lines option */}
          <div className="px-3 pt-3">
            <button
              onClick={handleClearSelection}
              className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
                !selectedLine
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <Map size={18} className="mr-2 text-emerald-600" />
                <span>View all lines</span>
              </div>
            </button>
          </div>

          {/* Line list with selection and visibility */}
          <div className="p-3 space-y-2">
            {enhancedLines.map((line) => (
              <div
                key={line.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  selectedLine === line.id
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Line info and selection */}
                <button
                  onClick={() => handleSelectLine(line.id)}
                  className="flex items-center flex-1 min-w-0 text-left"
                >
                  <div
                    className="w-5 h-5 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: line.color || '#888' }}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      !line.isVisible ? 'text-gray-400' : ''
                    }`}
                  >
                    {line.name}
                  </span>

                  {selectedLine === line.id && (
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      Selected
                    </span>
                  )}
                </button>

                {/* Visibility toggle button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLine(line.id);
                  }}
                  className={`ml-2 p-2 rounded-full ${
                    line.isVisible
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } transition-colors`}
                  aria-label={
                    line.isVisible
                      ? `Hide ${line.name} line`
                      : `Show ${line.name} line`
                  }
                >
                  {line.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMobileMenu;
