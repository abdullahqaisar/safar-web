import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  lightMode?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lightMode = false,
}) => {
  // Single animation definition for better performance
  const shimmerVariants = {
    initial: { backgroundPosition: '-500px 0' },
    animate: {
      backgroundPosition: ['500px 0', '-500px 0'],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      },
    },
  };

  // Themed colors based on lightMode
  const bgClass = lightMode ? 'bg-gray-100' : 'bg-green-700/10';
  const labelClass = lightMode ? 'bg-gray-300' : 'bg-green-700/20';
  const iconClass = lightMode ? 'bg-gray-300' : 'bg-green-700/30';

  // Shimmer effect styling
  const shimmerClass =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

  return (
    <div
      className="w-full space-y-3"
      role="status"
      aria-label="Loading search form"
    >
      <div className="space-y-1">
        <div className={`h-4 w-12 ${labelClass} rounded`} aria-hidden="true" />

        <div className="relative">
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full ${iconClass}`}
            aria-hidden="true"
          />
          <motion.div
            className={`w-full h-10 ${bgClass} rounded-lg ${shimmerClass}`}
            aria-hidden="true"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className={`h-4 w-8 ${labelClass} rounded`} aria-hidden="true" />

        <div className="relative">
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full ${iconClass}`}
            aria-hidden="true"
          />
          <motion.div
            className={`w-full h-10 ${bgClass} rounded-lg ${shimmerClass}`}
            aria-hidden="true"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>

      <span className="sr-only">Loading search form...</span>
    </div>
  );
};

export default LoadingSkeleton;
