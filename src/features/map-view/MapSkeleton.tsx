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
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
      {/* Map skeleton with grid lines */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-30">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border border-gray-200"></div>
        ))}
      </div>

      {/* Fake road patterns */}
      <div className="absolute left-[10%] right-[10%] top-[30%] h-[3px] bg-gray-300 animate-pulse"></div>
      <div className="absolute left-[20%] right-[20%] top-[50%] h-[3px] bg-gray-300 animate-pulse"></div>
      <div className="absolute left-[25%] bottom-[20%] w-[3px] h-[40%] bg-gray-300 animate-pulse"></div>
      <div className="absolute right-[35%] top-[20%] w-[3px] h-[60%] bg-gray-300 animate-pulse"></div>

      {/* Create metro-like lines that pulse */}
      <div className="absolute left-[5%] right-[30%] top-[20%] h-[5px] bg-red-400 opacity-40 animate-pulse"></div>
      <div className="absolute left-[15%] right-[10%] top-[70%] h-[5px] bg-green-400 opacity-40 animate-pulse"></div>
      <div className="absolute left-[60%] top-[10%] bottom-[30%] w-[5px] bg-blue-400 opacity-40 animate-pulse"></div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white bg-opacity-90 px-6 py-4 rounded-lg shadow-md flex items-center">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-sm font-medium text-gray-700">
            {loadingMessage}
          </span>
        </div>
      </div>

      {/* Map features placeholder */}
      <div className="absolute bottom-4 right-4 w-32 h-8 bg-white rounded-md shadow-sm opacity-50"></div>
      <div className="absolute top-4 right-4 w-20 h-10 bg-white rounded-md shadow-sm opacity-50"></div>
    </div>
  );
};

export default MapSkeleton;
