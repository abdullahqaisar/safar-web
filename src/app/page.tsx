import { HeroSection } from '@/features/landing/components/Hero/HeroSection';
import LazyContactSection from '@/features/landing/components/Sections/LazyContactSection';
import { HowItWorksSection } from '@/features/landing/components/Sections/HowItWorksSection';
import NetworkMapSection from '@/features/landing/components/Sections/NetworkMapSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <NetworkMapSection />
      <HowItWorksSection />
      <LazyContactSection />
    </main>
  );
}
