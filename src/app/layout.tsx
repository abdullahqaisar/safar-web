import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';

import { Navbar } from '@/components/layouts/Navbar';
import './globals.css';
import { QueryProvider } from '@/client/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <Navbar />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
