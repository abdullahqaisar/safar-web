import React from 'react';

interface BadgeProps {
  text: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, color, className = '' }) => {
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
};

export default Badge;
