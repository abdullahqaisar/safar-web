import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQSection() {
  const faqs = [
    {
      question: 'What is Safar?',
      answer:
        'Safar is a comprehensive public transportation app designed for Pakistan that helps you find the fastest and most convenient routes using various transit options including metro, bus, and walking directions.',
    },
    {
      question: 'Which cities are currently supported?',
      answer:
        'We currently support major metropolitan areas including Islamabad and are rapidly expanding to cover more cities across Pakistan. Stay tuned for updates as we add more locations to our coverage.',
    },
    {
      question: 'Is Safar free to use?',
      answer:
        'Yes, Safar is completely free to use. We believe everyone should have access to reliable public transportation information without barriers.',
    },
    {
      question: 'How accurate is the route information?',
      answer:
        'We strive to maintain 95% accuracy in our route information through regular updates from official transportation authorities and community contributions. Real-time updates are also incorporated when available.',
    },
    {
      question: 'Can I use Safar offline?',
      answer:
        "While the full functionality of Safar requires an internet connection, we offer limited offline capabilities that allow you to view previously searched routes when you're without internet access.",
    },
    {
      question: 'How can I contribute to Safar?',
      answer:
        "You can contribute by adding missing station information, reporting inaccuracies, or suggesting improvements through our 'Contribute' section. Community input is vital to maintaining and improving our service.",
    },
    {
      question: 'Does Safar track my location?',
      answer:
        'Safar only accesses your location when you explicitly grant permission, and solely for the purpose of providing you with accurate route information. We respect your privacy and do not track your movements.',
    },
    {
      question: 'How do I report an issue with the app?',
      answer:
        "You can report issues through the 'Contact Us' section of this help page, or by sending an email directly to support@safarapp.pk. We appreciate your feedback as it helps us improve the app.",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border-b border-gray-200 last:border-0"
          >
            <AccordionTrigger className="text-left font-medium text-gray-800 hover:text-[color:var(--color-accent)] py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-[color:var(--color-gray-600)] pt-1 pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
