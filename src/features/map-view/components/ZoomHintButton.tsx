import React from 'react';

interface ZoomHintButtonProps {
  onClick: () => void;
}

const ZoomHintButton: React.FC<ZoomHintButtonProps> = ({ onClick }) => {
  return (
    <div className="absolute top-14 right-3 z-[999]">
      <div className="bg-white rounded-md shadow-md p-2">
        <button
          className="text-xs font-medium text-gray-700 flex items-center gap-1"
          onClick={onClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          Zoom for details
        </button>
      </div>
    </div>
  );
};

export default ZoomHintButton;
