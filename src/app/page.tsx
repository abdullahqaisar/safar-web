import { HomeHero } from '@/features/landing/components/HomeHero';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner';
import { ContributeSection } from '@/features/landing/components/ContributeSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';

export default function Home() {
  return (
    <main>
      <HomeHero />
      <div className="min-h-screen bg-gray-50 pb-16">
        <JourneyPlanner showResults={false} />
      </div>

      <HowItWorksSection />
      <ContributeSection />
    </main>
  );
}
