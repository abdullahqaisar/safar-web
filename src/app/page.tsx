import { JourneyPlanner } from '@/components/journey/JourneyPlanner';
import Script from 'next/script';

export default function Home() {
  return (
    <main className="min-h-screen py-8">
      <Script id="structured-data" type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Safar - Islamabad Metro Route Finder",
            "description": "Find the best metro and bus routes in Islamabad and Rawalpindi",
            "applicationCategory": "Transportation",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0"
            }
          }
        `}
      </Script>
      <JourneyPlanner />
    </main>
  );
}
