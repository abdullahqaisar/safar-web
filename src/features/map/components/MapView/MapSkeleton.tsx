import React from 'react';
import { MapPin, Navigation, Map as MapIcon } from 'lucide-react';

interface MapSkeletonProps {
  loadingPhase?: 'initial' | 'loading' | 'ready';
  loadingProgress?: number;
}

const MapSkeleton: React.FC<MapSkeletonProps> = ({
  loadingPhase = 'initial',
  loadingProgress = 0,
}) => {
  // Use a smooth progress value to avoid jumps
  const smoothProgress = Math.max(5, Math.min(99, loadingProgress));

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
      {/* Abstract map background with subtle patterns */}
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
            <linearGradient id="route1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="route2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="route3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Abstract transit lines */}
          <path
            d="M 0,100 Q 250,150 500,50 T 1000,100"
            stroke="url(#route1)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 0,200 Q 400,250 600,150 T 1000,200"
            stroke="url(#route2)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 0,300 Q 300,350 700,250 T 1000,300"
            stroke="url(#route3)"
            strokeWidth="3"
            fill="none"
          />

          {/* Abstract stations */}
          <circle cx="20%" cy="25%" r="4" fill="#3b82f6" />
          <circle cx="40%" cy="15%" r="4" fill="#3b82f6" />
          <circle cx="60%" cy="10%" r="4" fill="#3b82f6" />
          <circle cx="80%" cy="25%" r="4" fill="#3b82f6" />

          <circle cx="30%" cy="45%" r="4" fill="#10b981" />
          <circle cx="50%" cy="35%" r="4" fill="#10b981" />
          <circle cx="70%" cy="30%" r="4" fill="#10b981" />
          <circle cx="90%" cy="45%" r="4" fill="#10b981" />

          <circle cx="15%" cy="65%" r="4" fill="#f43f5e" />
          <circle cx="35%" cy="55%" r="4" fill="#f43f5e" />
          <circle cx="55%" cy="50%" r="4" fill="#f43f5e" />
          <circle cx="75%" cy="65%" r="4" fill="#f43f5e" />
        </svg>
      </div>

      {/* Loading card with smooth animations */}
      <div
        className="relative bg-white/95 backdrop-blur-sm px-8 py-6 rounded-xl shadow-lg w-[85%] max-w-[320px] z-10 border border-gray-100"
        style={{
          animation: 'pulse 2s infinite ease-in-out',
        }}
      >
        {/* Top loading icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {loadingPhase === 'initial' && (
                <MapIcon className="w-6 h-6 text-emerald-500 animate-pulse" />
              )}
              {loadingPhase === 'loading' && (
                <Navigation className="w-6 h-6 text-blue-500 animate-spin" />
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
                style={{
                  transition: 'stroke-dashoffset 0.5s ease-in-out',
                }}
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

        {/* Animated progress indicator */}
        <div className="w-full mb-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
              style={{
                width: `${smoothProgress}%`,
                transition: 'width 0.5s ease-in-out',
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

      {/* Add a subtle pulsing animation to the CSS */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.01);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MapSkeleton;
