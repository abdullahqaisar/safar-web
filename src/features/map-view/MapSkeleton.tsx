import React, { useEffect } from 'react';

interface MapSkeletonProps {
  loadingPhase?: 'initial' | 'loading' | 'ready';
}

const MapSkeleton: React.FC<MapSkeletonProps> = ({
  loadingPhase = 'initial',
}) => {
  // Different messages based on loading phase
  const loadingMessage =
    loadingPhase === 'initial'
      ? 'Initializing map...'
      : loadingPhase === 'loading'
      ? 'Loading transit data...'
      : 'Preparing map view...';

  // Add a max time for showing skeleton - will help debug timing issues
  useEffect(() => {
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 10000) {
        // 10 seconds elapsed
        console.log(
          `MapSkeleton shown for ${elapsed}ms with phase: ${loadingPhase}`
        );
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadingPhase]);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden relative flex items-center justify-center">
      {/* Map skeleton with grid pattern */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} className="border border-gray-200"></div>
        ))}
      </div>

      {/* Simplified road patterns */}
      <div className="absolute left-[5%] right-[5%] top-[20%] h-[2px] bg-gray-300 opacity-40"></div>
      <div className="absolute left-[10%] right-[10%] top-[40%] h-[2px] bg-gray-300 opacity-40"></div>
      <div className="absolute left-[15%] right-[15%] top-[60%] h-[2px] bg-gray-300 opacity-40"></div>
      <div className="absolute left-[30%] top-[15%] w-[2px] h-[70%] bg-gray-300 opacity-40"></div>
      <div className="absolute right-[40%] top-[10%] w-[2px] h-[80%] bg-gray-300 opacity-40"></div>

      {/* Metro-like lines */}
      <div className="absolute left-[5%] right-[30%] top-[25%] h-[3px] bg-blue-400 opacity-30"></div>
      <div className="absolute left-[15%] right-[10%] top-[45%] h-[3px] bg-green-400 opacity-30"></div>
      <div className="absolute left-[25%] right-[20%] top-[65%] h-[3px] bg-red-400 opacity-30"></div>
      <div className="absolute left-[60%] top-[10%] bottom-[30%] w-[3px] bg-purple-400 opacity-30"></div>

      {/* Loading indicator */}
      <div className="relative z-10 bg-white/95 px-6 py-4 rounded-lg shadow-lg flex items-center">
        <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-sm font-medium text-gray-700">
          {loadingMessage}
        </span>
      </div>

      {/* Map features placeholders */}
      <div className="absolute bottom-4 right-4 w-10 h-20 bg-white rounded-md shadow-sm opacity-50"></div>
      <div className="absolute top-4 left-4 w-40 h-8 bg-white rounded-md shadow-sm opacity-40"></div>
    </div>
  );
};

export default MapSkeleton;
