'use client';

import { Suspense } from 'react';
import { JourneyContainer } from '@/features/journey/components/JourneyContainer';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

export default function JourneyPage() {
  return (
    <>
      <main>
        <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-white to-[#FEF6EC] pb-16 pt-10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <Suspense fallback={<SearchParamsFallback />}>
              <JourneyContainer />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
