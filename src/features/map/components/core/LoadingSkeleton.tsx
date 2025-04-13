import React from 'react';
import { MapPin, Navigation, Map as MapIcon } from 'lucide-react';

interface LoadingSkeletonProps {
  loadingPhase?: 'initial' | 'loading' | 'ready';
  loadingProgress?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  loadingPhase = 'initial',
  loadingProgress = 0,
}) => {
  // Use a smooth progress value to avoid jumps
  const smoothProgress = Math.max(5, Math.min(99, loadingProgress));

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
      {/* Simple map background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="gray"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Loading card */}
      <div className="relative bg-white/95 backdrop-blur-sm px-8 py-6 rounded-xl shadow-lg w-[85%] max-w-[320px] z-10 border border-gray-100">
        {/* Loading icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {loadingPhase === 'initial' && (
                <MapIcon className="w-6 h-6 text-emerald-500" />
              )}
              {loadingPhase === 'loading' && (
                <Navigation className="w-6 h-6 text-blue-500" />
              )}
              {loadingPhase === 'ready' && (
                <MapPin className="w-6 h-6 text-emerald-500" />
              )}
            </div>
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(var(--color-accent-rgb), 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(var(--color-accent-rgb), 1)"
                strokeWidth="8"
                fill="none"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * smoothProgress) / 100}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Loading state message */}
        <h3 className="text-sm font-medium text-gray-800 text-center mb-5">
          {loadingPhase === 'initial' && 'Preparing Your Transit Map'}
          {loadingPhase === 'loading' && 'Loading Transit Data'}
          {loadingPhase === 'ready' && 'Finalizing Map View'}
        </h3>

        {/* Progress indicator */}
        <div className="w-full mb-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
              style={{
                width: `${smoothProgress}%`,
              }}
            />
          </div>
        </div>

        {/* Info text */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {loadingPhase === 'initial' && 'Initializing...'}
            {loadingPhase === 'loading' && 'Loading transit network...'}
            {loadingPhase === 'ready' && 'Almost there...'}
          </span>
          <span className="font-mono">{Math.round(smoothProgress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
