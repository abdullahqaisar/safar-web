import React from 'react';

interface BadgeProps {
  text: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ text, color, className = '' }: BadgeProps) {
  const baseClasses =
    'hidden sm:inline-flex items-center rounded-full font-medium';

  return (
    <span
      className={`
        bus-badge
        ${baseClasses}
        ${color}
        ${className}
      `}
    >
      {text}
    </span>
  );
}
