import React from 'react';
import { ZoomIn } from 'lucide-react';

interface ZoomHintButtonProps {
  onClick: () => void;
}

const ZoomHintButton: React.FC<ZoomHintButtonProps> = ({ onClick }) => {
  return (
    <div className="absolute bottom-16 right-3 z-[999]">
      <button
        className="bg-white rounded-md shadow-md px-3 py-2 flex items-center gap-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100"
        onClick={onClick}
        aria-label="Zoom in for more details"
      >
        <ZoomIn size={14} className="text-emerald-500" />
        Zoom for details
      </button>
    </div>
  );
};

export default ZoomHintButton;
