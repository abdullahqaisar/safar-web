import React from 'react';
import { GoogleMapsLoader } from '@/components/common/GoogleMapsLoader';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan Your Journey | Find Transit Routes and Directions',
  description:
    'Use our journey planner to find the best routes in Islamabad and Rawalpindi, schedules, and transit options to get you where you need to go quickly and easily.',
};

export default function JourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GoogleMapsLoader lazy={false} />
      {children}
    </>
  );
}
