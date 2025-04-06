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
      title: 'Interactive Routes',
      description: 'Navigate through color-coded transit lines with ease',
    },
    {
      icon: Bus,
      title: 'Multimodal Transit',
      description: 'Seamlessly connect between metro, bus and feeder routes',
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get live schedule information for all transit options',
    },
    {
      icon: Ticket,
      title: 'Fare Calculator',
      description: 'Plan your journey with accurate fare estimation',
    },
  ];

  return (
    <section
      id="network-map"
      className="py-12 md:py-20 bg-[color:var(--color-bg-cream)] overflow-hidden"
    >
      <Container>
        {/* Mobile-optimized layout with proper stacking */}
        <div className="space-y-8 md:space-y-12">
          {/* Section heading - optimized for all screen sizes */}
          <div className="text-center max-w-3xl mx-auto px-4">
            <SectionBadge icon={false} className="mx-auto mb-3">
              Transit Map
            </SectionBadge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Explore Islamabad&apos;s Transit Network
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Navigate the city with ease using our interactive map system
            </p>
          </div>

          {/* Content area with optimized columns for mobile */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Map preview - fully responsive, centered on mobile */}
            <div className="order-1 md:order-1 mx-auto md:mx-0">
              <div className="transform md:-rotate-1 max-w-[320px] sm:max-w-md w-full">
                <NetworkMapPreview />
              </div>
            </div>

            {/* Content - optimized for mobile readability */}
            <div className="order-2 md:order-2 px-4 md:px-0">
              <div className="md:pl-6 lg:pl-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  Plan Your Journey With Ease
                </h3>

                <p className="text-gray-600 mb-6">
                  Our transit map makes navigating the city intuitive and
                  stress-free, whether you&apos;re commuting daily or exploring
                  the city.
                </p>

                {/* Feature grid - adjusts to single column on mobile */}
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

                {/* Action buttons - stacked on mobile, side by side on larger screens */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Link href="/map" className="w-full sm:w-auto">
                    <button
                      className="w-full sm:w-auto py-3 px-6 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                      aria-label="Explore the interactive transit map"
                    >
                      <span>View Interactive Map</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </Link>

                  <Link href="/map" className="w-full sm:w-auto">
                    <button
                      className="w-full sm:w-auto py-3 px-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center"
                      aria-label="View transit schedules"
                    >
                      View Route Schedules
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default NetworkMapSection;
