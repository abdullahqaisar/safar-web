import { cn } from '@/lib/utils/formatters';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  allowOverflow?: boolean;
}

export function Card({
  children,
  className,
  variant = 'default',
  allowOverflow = false,
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
        !allowOverflow && 'overflow-hidden',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
