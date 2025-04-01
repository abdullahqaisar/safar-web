'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      pathname
    );
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-16 flex items-center justify-center bg-[color:var(--color-bg-cream)]">
        <div className="max-w-md mx-auto text-center px-4 py-16 animate-fade-in">
          <h1 className="text-8xl font-bold text-[color:var(--color-accent)] mb-4">
            404
          </h1>
          <p className="text-2xl font-medium mb-4">Destination Not Found</p>
          <p className="text-gray-600 mb-8">
            It seems you&#39;ve taken a route that doesn&#39;t exist. Let&#39;s
            get you back on track.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
