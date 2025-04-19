import { Suspense } from 'react';
import { Metadata } from 'next';
import ContributePage from '@/features/contribute/components/ContributePage';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Contribute | Safar',
  description:
    'Contribute to Islamabad and Rawalpindi transit mapping. Share information about routes, stations, and services to improve the transit network.',
  keywords: [
    'contribute',
    'transit mapping',
    'Islamabad transportation',
    'public transit',
    'Safar',
    'volunteer',
    'community data',
  ],
};

/**
 * Contribute page that allows users to submit transit data and information
 */
export default function ContributePageContainer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC]">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 mx-auto bg-[color:var(--color-accent)]/10 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-accent)]/40"></div>
          </div>
          <div className="h-6 w-48 bg-gray-200 rounded-md mx-auto mb-3"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-md mx-auto"></div>
        </div>
      </div>
    }>
      <ContributePage />
    </Suspense>
  );
}
