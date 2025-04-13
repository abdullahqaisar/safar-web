import { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
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
    <Suspense fallback={<SearchParamsFallback />}>
      <ContributePage />
    </Suspense>
  );
}
