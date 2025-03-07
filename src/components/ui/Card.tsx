import { cn } from '@/lib/utils/formatters';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  allowOverflow?: boolean; // New prop to control overflow
}

export function Card({
  children,
  className,
  variant = 'default',
  allowOverflow = false, // Default to false to maintain backward compatibility
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-md',
    bordered: 'bg-white border border-gray-200',
  };

  return (
    <div
      className={cn(
        'rounded-xl',
        !allowOverflow && 'overflow-hidden', // Only apply overflow-hidden if allowOverflow is false
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
