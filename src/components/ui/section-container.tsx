import { cn } from '@/lib/utils/formatters';
import React from 'react';

interface SectionContainerProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionContainer = ({
  title,
  icon,
  children,
  className,
}: SectionContainerProps) => (
  <div
    className={cn(
      'bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden',
      className
    )}
  >
    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h3 className="font-medium flex items-center text-safar-dark-green dark:text-white">
        <span className="text-safar-light-green mr-2">{icon}</span>
        {title}
      </h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default SectionContainer;
