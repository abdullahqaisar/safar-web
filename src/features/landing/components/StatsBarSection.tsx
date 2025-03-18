import React from 'react';

export function StatsBarSection() {
  return (
    <div className="glass-effect py-4 md:py-6 px-4 border-t border-white/10 relative z-10">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            10K+
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Daily Users
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            50+
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Metro Stations
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            98%
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Accuracy Rate
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            4.9
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            App Rating
          </p>
        </div>
      </div>
    </div>
  );
}
