import { motion } from 'framer-motion';

export default function LoadingSkeleton() {
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

  return (
    <div className="space-y-4">
      <motion.div
        className="relative"
        initial="initial"
        animate="animate"
        variants={pulseVariants}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-700/30"></div>
        <div className="w-full h-[52px] bg-green-700/20 rounded-lg"></div>
      </motion.div>

      <div className="relative flex justify-center">
        <div className="h-4 border-l border-dashed border-gray-300"></div>
      </div>

      <motion.div
        className="relative"
        initial="initial"
        animate="animate"
        variants={pulseVariants}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-700/30"></div>
        <div className="w-full h-[52px] bg-green-700/20 rounded-lg"></div>
      </motion.div>
    </div>
  );
}
