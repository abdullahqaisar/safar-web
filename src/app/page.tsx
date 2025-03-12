import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner';
import { Hero } from '@/components/common/Hero';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { ContributeSection } from '@/features/landing/components/ContributeSection';
import { NewsletterSection } from '@/features/landing/components/NewsletterSection';
import Script from 'next/script';

export default function Home() {
  return (
    <>
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

      <section
        id="journey-planner"
        className="container mx-auto px-4 -mt-20 mb-12 relative z-10 max-w-5xl"
      >
        <JourneyPlanner />
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <ContributeSection />
      <NewsletterSection />
    </>
  );
}
