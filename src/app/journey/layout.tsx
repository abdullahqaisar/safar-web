import React from 'react';
import { GoogleMapsLoader } from '@/components/common/GoogleMapsLoader';

export default function JourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Load Google Maps early and not lazily for journey pages */}
      <GoogleMapsLoader lazy={false} />
      {children}
    </>
  );
}
