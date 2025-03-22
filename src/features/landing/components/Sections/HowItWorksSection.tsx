import { SectionBadge } from '@/components/common/SectionBadge';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="relative text-center group px-4 py-6 sm:px-6 sm:py-8 rounded-xl transition-colors duration-300">
      <div
        className="w-16 h-16 bg-[color:var(--color-accent)] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 
     hover:shadow-lg shadow-[color:var(--color-accent)]/15 
      z-10 relative border-2 border-white 
      transition-all duration-300 
      group-hover:scale-110 group-hover:bg-[color:var(--color-accent-dark)]"
      >
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 group-hover:text-[color:var(--color-accent)] transition-colors duration-200">
        {title}
      </h3>
      <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
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
    <section className="relative" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-radial from-[color:var(--color-accent)] to-transparent opacity-70"></div>

      <div className="bg-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 ">
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 sm:mb-20 lg:mb-24">
            <SectionBadge className="mb-6 sm:mb-8" icon={false}>
              Simple Process
            </SectionBadge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6 sm:mb-8">
              How{' '}
              <span className="text-[color:var(--color-accent)]">Safar</span>{' '}
              Works
            </h2>

            <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] max-w-2xl mx-auto leading-relaxed">
              Using Safar is simple and intuitive. Follow these steps to get to
              your destination quickly and efficiently.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Connecting line between steps */}
            <div className="hidden md:block absolute top-16 left-[5%] right-[5%] h-[1px] bg-[color:var(--color-accent)] opacity-15 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-8">
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
