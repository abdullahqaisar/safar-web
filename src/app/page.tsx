import { HeroSection } from '@/features/landing/components/Hero/HeroSection';
import { FeaturesSection } from '@/features/landing/components/Sections/FeaturesSection';
import { HowItWorksSection } from '@/features/landing/components/Sections/HowItWorksSection';
import { ContributeSection } from '@/features/landing/components/Sections/ContributeSection';
import { NewsletterSection } from '@/features/landing/components/Sections/NewsletterSection';

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
