import { SectionHeading } from '@/components/common/SectionHeading';
import { Container } from '@/components/common/Container';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="relative text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-200/40 z-10 relative border border-white/20">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
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
    <section className="py-16 sm:py-20 bg-gray-50" id="how-it-works">
      <Container className="relative z-10">
        <SectionHeading
          tag="Process"
          title="How Safar Works"
          description="Using Safar is simple and intuitive. Follow these steps to get to your destination quickly and efficiently."
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-emerald-100 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
      </Container>
    </section>
  );
}
