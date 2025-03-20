import React from 'react';
import { MapPin } from 'lucide-react';

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
};

export function SectionBadge({
  children,
  className = '',
  icon = true,
}: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] text-xs font-medium animate-fade-in ${className}`}
      style={{ animationDelay: '0.2s' }}
    >
      {icon && <MapPin className="w-3 h-3" />}
      <span>{children}</span>
    </div>
  );
}
