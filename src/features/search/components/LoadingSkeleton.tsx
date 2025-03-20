import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  lightMode?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lightMode = false,
}) => {
  const pulseVariants = {
    initial: { opacity: 0.6 },
    animate: {
      opacity: [0.6, 0.8, 0.6],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      },
    },
  };

  const bgColor = lightMode ? 'bg-gray-200/60' : 'bg-green-700/20';
  const iconColor = lightMode ? 'bg-gray-300/80' : 'bg-green-700/30';
  const textColor = lightMode ? 'bg-gray-300/80' : 'bg-green-700/30';

  return (
    <div className="w-full space-y-4 relative">
      <motion.div
        className={`h-4 w-8 ${textColor} rounded mb-1`}
        initial="initial"
        animate="animate"
        variants={pulseVariants}
      ></motion.div>
      {/* From input skeleton */}
      <motion.div
        className="relative"
        initial="initial"
        animate="animate"
        variants={pulseVariants}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-10 flex items-center justify-center">
          <div className={`w-4 h-4 rounded-full ${iconColor}`}></div>
        </div>
        <div className={`w-full h-12 ${bgColor} rounded-lg`}></div>
      </motion.div>

      {/* To label skeleton */}
      <div className="space-y-1">
        <motion.div
          className={`h-4 w-8 ${textColor} rounded mb-1`}
          initial="initial"
          animate="animate"
          variants={pulseVariants}
        ></motion.div>

        {/* To input skeleton */}
        <motion.div
          className="relative"
          initial="initial"
          animate="animate"
          variants={pulseVariants}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-10">
            <div className={`w-4 h-4 ${iconColor}`}></div>
          </div>
          <div className={`w-full h-12 ${bgColor} rounded-lg`}></div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
