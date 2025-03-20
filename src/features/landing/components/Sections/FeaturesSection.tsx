import { ReactNode } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Container } from '@/components/common/Container';
import { Clock, Route as RouteIcon, Ticket } from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="transition-all duration-300 rounded-[var(--radius)] bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 p-6 md:p-8 h-full flex flex-col">
      {/* Restoring the lighter emerald color for icons */}
      <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-emerald-600 text-white mb-6 shadow-md shadow-emerald-200/50 border border-emerald-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Clock size={24} />,
      title: 'Real-Time Updates',
      description:
        'Get live updates on transit schedules, delays, and service changes to plan your trip better.',
    },
    {
      icon: <RouteIcon size={24} />,
      title: 'Smart Route Planning',
      description:
        'Our algorithm finds the fastest routes with the fewest transfers to save you time and hassle.',
    },
    {
      icon: <Ticket size={24} />,
      title: 'Fare Estimates',
      description:
        'Know exactly how much your journey will cost with accurate fare calculations for all routes.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white" id="features">
      <Container className="relative z-10">
        <SectionHeading
          tag="Benefits"
          title="Why Choose Safar?"
          description="Experience the smarter way to navigate public transportation in Pakistan with features designed to make your journey smooth and stress-free."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
