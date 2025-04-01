import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';
import Script from 'next/script';

import { Navbar } from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { JourneyProvider } from '@/features/journey/context/JourneyContext';

// Initialize Ubuntu font
const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-ubuntu',
});

export const metadata: Metadata = {
  title:
    'Safar.fyi | Islamabad Metro Route Finder | Rawalpindi Metro Bus Routes',
  description:
    'Find the best metro and bus routes in Islamabad and Rawalpindi. Plan your journey with our route finder for Metro Bus, Orange Line, Blue Line, Green Line and Feeder routes.',
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
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BT2M4S0YH2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BT2M4S0YH2');
          `}
        </Script>
      </head>
      <body className={`${ubuntu.variable} font-sans`}>
        <QueryProvider>
          <JourneyProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster />
          </JourneyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
