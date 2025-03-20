import { Suspense } from 'react';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
import { SectionBadge } from '@/components/common/SectionBadge';
import { StatsBarSection } from './StatsBar';
import { HeroSearchForm } from './HomeSearchForm';

export function HeroSection() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)]/5 to-transparent opacity-70 animate-pulse-slow"></div>

      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[#FEF6EC] relative py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <SectionBadge className="mb-4 sm:mb-5 md:mb-6">
              Public Transportation Made Easy
            </SectionBadge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[color:var(--color-gray-700)] tracking-tight mb-3 sm:mb-4 md:mb-5 lg:mb-6 animate-fade-in">
              Your Journey,{' '}
              <span className="text-[color:var(--color-accent)]">
                Simplified
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] max-w-2xl mx-auto mb-4 sm:mb-6 animate-fade-in">
              Find the fastest metro routes optimized for your journey and enjoy
              a stress-free commute with our smart navigation system.
            </p>
          </div>

          {/* Search Form Container - Now using the dedicated HeroSearchForm */}
          <div className="max-w-[1000px] mx-auto relative z-20 px-0 sm:px-2 mt-6 sm:mt-8 md:mt-10 mb-8 sm:mb-10">
            <Suspense fallback={<SearchParamsFallback />}>
              <HeroSearchForm />
            </Suspense>
          </div>
        </div>
      </div>
      {/* Stats Bar */}
      <StatsBarSection />
    </section>
  );
}
