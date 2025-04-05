'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      pathname
    );
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <main className="flex-grow flex items-center justify-center bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="max-w-md mx-auto text-center px-8 py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 relative z-10 m-4 animate-fade-in">
          <div className="w-24 h-24 mx-auto bg-[color:var(--color-accent)]/10 rounded-full flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-[color:var(--color-accent)]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[color:var(--color-accent)] mb-4">
            404
          </h1>
          <p className="text-2xl font-medium text-gray-800 mb-3">
            Destination Not Found
          </p>
          <p className="text-[color:var(--color-gray-600)] mb-8">
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
