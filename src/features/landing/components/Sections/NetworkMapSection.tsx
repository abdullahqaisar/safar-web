import { ArrowRight, Bus, Clock, MapIcon, Ticket } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Container } from '@/components/common/Container';
import { SectionBadge } from '@/components/common/SectionBadge';
import { FeatureCard } from '../common/FeatureCard';
import { NetworkMapPreview } from '../NetworkMap/NetworkMapPreview';

const NetworkMapSection = () => {
  const features = [
    {
      icon: MapIcon,
      title: 'Visualize Routes',
      description: 'See all transit lines color-coded on an interactive map',
    },
    {
      icon: Bus,
      title: 'Bus Connections',
      description: 'View bus routes that connect with metro stations',
    },
    {
      icon: Clock,
      title: 'Schedules & Frequency',
      description: 'Check operating hours and service frequency',
    },
    {
      icon: Ticket,
      title: 'Ticket Information',
      description: 'Access fare details for all transit options',
    },
  ];

  return (
    <section id="network-map" className="relative">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)] to-transparent opacity-70"></div>

      <div className="bg-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          {/* For mobile, display the map first as a separate element */}
          <div className="md:hidden mb-10 flex justify-center">
            <NetworkMapPreview
              imageSrc="/images/placeholder.svg"
              alt="Safar Network Map"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-left">
              <div className="mb-6">
                <SectionBadge icon={false}>Network Map</SectionBadge>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Interactive Routes{' '}
                <span className="text-[color:var(--color-accent)]">Map</span>{' '}
              </h2>

              <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] leading-relaxed mb-8">
                Explore the entire public transit network with our interactive
                map. View all metro lines, bus connections, and transfer points
                in one place.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>

              <Link href="/map" className="inline-block">
                <button className="inline-flex items-center px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-lg shadow-md hover:shadow-lg shadow-[color:var(--color-accent)]/15 transition-all duration-300 hover:-translate-y-0.5">
                  Explore Routes Map
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </div>

            {/* Right Column - Map View (hidden on mobile since we show it separately above) */}
            <div className="hidden md:flex justify-center md:justify-end">
              <NetworkMapPreview
                imageSrc="/images/placeholder.svg"
                alt="Safar Network Map"
              />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
};

export default NetworkMapSection;
