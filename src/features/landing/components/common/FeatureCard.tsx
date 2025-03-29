import { LucideIcon } from 'lucide-react';
import React from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) => {
  return (
    <div className="bg-white/50 p-4 rounded-lg flex border border-[color:var(--color-accent)]/10 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="mr-3 mt-1">
        <Icon className="h-5 w-5 text-[color:var(--color-accent)]" />
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-[color:var(--color-gray-600)]">
          {description}
        </p>
      </div>
    </div>
  );
};
