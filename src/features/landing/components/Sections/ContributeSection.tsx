import Link from 'next/link';
import { Container } from '@/components/common/Container';
import { Check, Map } from 'lucide-react';
import { SectionBadge } from '@/components/common/SectionBadge';

interface BenefitProps {
  text: string;
}

function Benefit({ text }: BenefitProps) {
  return (
    <div className="flex items-center group">
      <div className="w-8 h-8 bg-[color:var(--color-accent)] text-white rounded-full flex items-center justify-center flex-shrink-0 mr-4 shadow-md shadow-[color:var(--color-accent)]/15 border-2 border-white group-hover:bg-[color:var(--color-accent-dark)] transition-colors duration-300">
        <Check size={14} />
      </div>
      <span className="text-gray-700 group-hover:text-[color:var(--color-accent-dark)] transition-colors duration-200">
        {text}
      </span>
    </div>
  );
}

export function ContributeSection() {
  const benefits = [
    'Earn community points and badges',
    'Help improve routes for everyone',
    'Simple submission process',
    'Build better transportation for Islamabad',
  ];

  return (
    <section className="relative pb-20 sm:pb-24 lg:pb-32" id="contribute">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)]/5 to-transparent opacity-70"></div>

      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            <SectionBadge className="mb-6 sm:mb-8" icon={false}>
              Community
            </SectionBadge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6 sm:mb-8">
              We Need Your{' '}
              <span className="text-[color:var(--color-accent)]">Help</span>
            </h2>

            <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] max-w-2xl mx-auto leading-relaxed mb-10">
              Help us improve Safar by contributing station data from your area.
              Together we can build the most comprehensive public transportation
              guide in Islamabad.
            </p>

            <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg p-8 md:p-10 hover:border-[color:var(--color-accent)]/20">
              <div className="w-16 h-16 bg-[color:var(--color-accent)] text-white rounded-full flex items-center justify-center mb-8 mx-auto shadow-lg shadow-[color:var(--color-accent)]/20 border-2 border-white">
                <Map size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Add Missing Stations
              </h3>
              <p className="text-gray-600 mb-8 text-center">
                Our database grows stronger with every contribution. Add
                stations, routes, and schedule information from your local area
                to help fellow travelers.
              </p>
              <div className="space-y-5 mb-10 max-w-md mx-auto">
                {benefits.map((benefit, index) => (
                  <Benefit key={index} text={benefit} />
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/contribute"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-lg shadow-md hover:shadow-lg shadow-[color:var(--color-accent)]/15 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Add Station Data
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
