import React from 'react';

interface ResetViewButtonProps {
  onClick: () => void;
}

const ResetViewButton: React.FC<ResetViewButtonProps> = ({ onClick }) => {
  return (
    <button
      className="absolute bottom-16 right-4 z-[999] bg-white rounded-md shadow-md px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
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
        <path d="M3 2v6h6"></path>
        <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
      </svg>
      Reset View
    </button>
  );
};

export default ResetViewButton;
