import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetViewButtonProps {
  onClick: () => void;
}

const ResetViewButton: React.FC<ResetViewButtonProps> = ({ onClick }) => {
  return (
    <button
      className="absolute bottom-16 right-3 z-[999] bg-white rounded-md shadow-md px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100 flex items-center gap-2"
      onClick={onClick}
      aria-label="Reset map view"
    >
      <RotateCcw size={14} className="text-emerald-500" />
      Reset View
    </button>
  );
};

export default ResetViewButton;
