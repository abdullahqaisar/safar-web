import { HeroSection } from '@/features/landing/components/hero/HeroSection';
import { FeaturesSection } from '@/features/landing/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/features/landing/components/sections/HowItWorksSection';
import { ContributeSection } from '@/features/landing/components/sections/ContributeSection';
import { NewsletterSection } from '@/features/landing/components/sections/NewsletterSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ContributeSection />
      <NewsletterSection />
    </main>
  );
}
