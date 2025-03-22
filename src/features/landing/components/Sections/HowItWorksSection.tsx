import { SectionBadge } from '@/components/common/SectionBadge';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="relative text-center group">
      <div className="w-16 h-16 bg-gradient-to-br from-[color:var(--color-accent-dark)] to-[color:var(--color-accent)] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-[color:var(--color-accent)]/20 z-10 relative border border-white/20 transition-transform duration-300 group-hover:scale-110">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-[color:var(--color-accent-dark)] transition-colors duration-200">
        {title}
      </h3>
      <p className="text-gray-600 max-w-xs mx-auto">{description}</p>
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: 'Enter Locations',
      description:
        'Provide your starting point and destination in the search form.',
    },
    {
      number: 2,
      title: 'Choose a Route',
      description:
        'Select from multiple route options based on your preferences.',
    },
    {
      number: 3,
      title: 'Get Directions',
      description:
        'View step-by-step navigation with detailed transit information.',
    },
    {
      number: 4,
      title: 'Enjoy Your Journey',
      description:
        'Travel confidently with real-time updates throughout your trip.',
    },
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)]/5 to-transparent opacity-70"></div>

      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[#F8FBF9] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 sm:mb-16 lg:mb-20">
            <SectionBadge className="mb-4 sm:mb-5" icon={false}>
              Simple Process
            </SectionBadge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 sm:mb-5">
              How{' '}
              <span className="text-[color:var(--color-accent)]">Safar</span>{' '}
              Works
            </h2>

            <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] max-w-2xl mx-auto">
              Using Safar is simple and intuitive. Follow these steps to get to
              your destination quickly and efficiently.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Connecting line between steps */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-[color:var(--color-accent)]/10 via-[color:var(--color-accent)]/30 to-[color:var(--color-accent)]/10 z-0 rounded-full"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 lg:gap-12">
              {steps.map((step) => (
                <Step
                  key={step.number}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
