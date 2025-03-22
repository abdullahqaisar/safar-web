import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
import { SectionBadge } from '@/components/common/SectionBadge';
import { HeroSearchForm } from './HomeSearchForm';

const StatsBarSection = dynamic(
  () =>
    import('./StatsBar').then((mod) => ({
      default: mod.StatsBarSection,
    })),
  {
    ssr: true,
    loading: () => (
      <div className="h-24 animate-pulse bg-gray-100 rounded-lg"></div>
    ),
  }
);

export function HeroSection() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)]/5 to-transparent opacity-70"></div>

      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[#FEF6EC] relative py-18 sm:py-24 md:py-28 lg:py-36 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-14 lg:mb-16">
            <SectionBadge className="mb-5 sm:mb-6 md:mb-8">
              Public Transportation Made Easy
            </SectionBadge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-bold text-gray-700 mb-5 sm:mb-6 md:mb-8">
              Find Your{' '}
              <span className="text-[color:var(--color-accent)]">Safar</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[color:var(--color-gray-600)] max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10">
              Navigate Islamabad&apos;s public transportation with ease. Find
              the fastest metro routes optimized for your journey and enjoy a
              stress-free commute.
            </p>
          </div>

          <div className="max-w-[1000px] mx-auto relative search-form-container px-0 sm:px-2 mt-8 sm:mt-10 md:mt-12 mb-10 sm:mb-12 md:mb-16">
            <Suspense fallback={<SearchParamsFallback />}>
              <HeroSearchForm />
            </Suspense>
          </div>
        </div>
      </div>

      <StatsBarSection />
    </section>
  );
}
