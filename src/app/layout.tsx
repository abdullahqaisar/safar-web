import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';
import Script from 'next/script';

import { Navbar } from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { JourneyProvider } from '@/features/journey/context/JourneyContext';

// Initialize Ubuntu font with all weights needed
const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap', // Use 'swap' to ensure text remains visible during font loading
  variable: '--font-ubuntu',
});

export const metadata: Metadata = {
  title: 'Safar | Find Islamabad Metro and Feeder Bus Routes',
  description:
    'Find the best metro routes in Islamabad and Rawalpindi. Plan your journey with Metro Bus, Red Line, Orange Line, Blue Line, Green Line, E bus, and Feeder routes.',
  keywords:
    'islamabad metro, rawalpindi metro, islamabad bus routes, metro bus routes, rawalpindi bus service, green line, orange line, blue line, red line, metro feeder routes',
  authors: [{ name: 'Safar' }],
  openGraph: {
    title: 'Islamabad Metro and Feeder Bus Route Finder',
    description:
      'Find the best metro and feeder E Bus routes in Islamabad and Rawalpindi',
    type: 'website',
    locale: 'en_US',
    siteName: 'Safar',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ubuntu.variable}>
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
      <body className="font-sans">
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
