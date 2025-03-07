import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { Navbar } from '@/components/layouts/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:
    'Safar.fyi | Islamabad Metro Route Finder | Rawalpindi Metro Bus Routes',
  description:
    'Find the best metro and bus routes in Islamabad and Rawalpindi. Plan your journey with our route finder for Metro Bus, Orange Line, Blue Line and Green Line routes.',
  keywords:
    'islamabad metro, rawalpindi metro, islamabad bus routes, metro bus routes, islamabad public transport, rawalpindi bus service, islamabad green line, islamabad orange line, metro feeder routes',
  authors: [{ name: 'Safar' }],
  openGraph: {
    title: 'Islamabad Metro Route Finder | Rawalpindi Metro Bus Routes',
    description:
      'Find the best metro and bus routes in Islamabad and Rawalpindi',
    type: 'website',
    locale: 'en_US',
    siteName: 'Safar - Islamabad Metro Routes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
