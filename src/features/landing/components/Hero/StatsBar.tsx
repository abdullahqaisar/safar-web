import React from 'react';

export function StatsBarSection() {
  return (
    <div className="glass-effect py-4 md:py-6 px-4 border-t border-white/10 relative stats-bar-section mb-0">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            150+
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Metro Stations
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            2
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Cities Mapped
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            15+
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">
            Transit Routes
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-accent)]">
            95%
          </p>
          <p className="text-sm text-[color:var(--color-gray-600)]">Accuracy</p>
        </div>
      </div>
    </div>
  );
}
