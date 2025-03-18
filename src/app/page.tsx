import { HeroSection } from '@/features/landing/components/HeroSection';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { ContributeSection } from '@/features/landing/components/ContributeSection';
import { NewsletterSection } from '@/features/landing/components/NewsletterSection';

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
