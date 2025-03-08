import { Journey } from '@/components/journey/Journey';
import { Hero } from '@/components/common/Hero';
import Script from 'next/script';

export default function Home() {
  return (
    <main className="min-h-screen">
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
      <Hero />
      <div className="py-8">
        <Journey />
      </div>
    </main>
  );
}
