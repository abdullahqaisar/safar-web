import { Suspense } from 'react';
import { JourneyContainer } from '@/features/journey/components/JourneyContainer';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
import { Metadata } from 'next';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Find Routes | Safar',
  description:
    'Plan your journey with Safar. Find the best routes using public transportation in Islamabad and Rawalpindi. Compare different transit options.',
  keywords: [
    'route finder',
    'journey planner',
    'public transportation',
    'Islamabad routes',
    'Rawalpindi transit',
    'Safar',
  ],
};

/**
 * Journey page that allows users to find optimal routes
 * Uses streaming with Suspense for progressive loading
 */
export default function JourneyPage() {
  return (
    <main className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Content is loaded progressively with Suspense */}
        <Suspense fallback={<SearchParamsFallback />}>
          <JourneyContainer />
        </Suspense>
      </div>
    </main>
  );
}
