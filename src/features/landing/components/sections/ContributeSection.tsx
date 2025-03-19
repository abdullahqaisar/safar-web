import Link from 'next/link';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Container } from '@/components/common/Container';

interface BenefitProps {
  text: string;
}

function Benefit({ text }: BenefitProps) {
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
        <i className="fas fa-check text-sm" aria-hidden="true"></i>
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

export function ContributeSection() {
  const benefits = [
    'Earn community points and badges',
    'Help improve routes for everyone',
    'Simple submission process',
  ];

  return (
    <section
      id="contribute"
      className="py-20 bg-[#f8f7f4]" // Light cream solid color
    >
      <Container className="relative z-10">
        <SectionHeading
          tag="Community"
          title="We Need Your Help"
          description="Help us improve Safar by contributing station data from your area. Together we can build the most comprehensive public transportation guide in Pakistan."
        />

        <div className="bg-white rounded-[var(--radius)] shadow-md overflow-hidden border border-gray-200/80 transition-all duration-300 hover:shadow-lg max-w-4xl mx-auto">
          <div className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200/40">
                <i
                  className="fas fa-map-marked-alt text-2xl"
                  aria-hidden="true"
                ></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Add Missing Stations
              </h3>
              <p className="text-gray-600 mb-8">
                Our database grows stronger with every contribution. Add
                stations, routes, and schedule information from your local area
                to help fellow travelers.
              </p>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <Benefit key={index} text={benefit} />
                ))}
              </div>
              <Link
                href="/contribute"
                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <i className="fas fa-plus-circle mr-2" aria-hidden="true"></i>
                Add Station Data
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
