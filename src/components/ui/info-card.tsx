import { cn } from '@/lib/utils/formatters';
import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const InfoCard = ({ icon, label, value, className }: InfoCardProps) => (
  <div
    className={cn('bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3', className)}
  >
    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1 flex items-center">
      <span className="text-safar-light-green mr-1.5">{icon}</span>
      {label}
    </div>
    <div className="font-medium text-sm">{value}</div>
  </div>
);

export default InfoCard;
