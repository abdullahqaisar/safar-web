'use client';

import { Container } from '@/components/common/Container';

import { Mail, LifeBuoy } from 'lucide-react';
import ContactSection from './sections/ContactSection';

export default function HelpPageContent() {
  return (
    <div className="py-10 sm:py-12 md:py-46 bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[#FEF6EC]">
      <Container className="">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Help & Support
          </h1>
          <p className="text-[color:var(--color-gray-600)] max-w-3xl mx-auto">
            Find answers to common questions, learn how to use Safar, and get in
            touch with our support team.
          </p>
        </div>
        <div className="pb-10 sm:pb-12 md:pb-16">
          {' '}
          <ContactSection />
        </div>

        <div className="bg-[color:var(--color-accent)]/10 rounded-lg p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-12 h-12 rounded-full bg-[color:var(--color-accent)] text-white flex items-center justify-center flex-shrink-0">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center sm:text-left">
              Need More Help?
            </h3>
            <p className="text-[color:var(--color-gray-600)] text-center sm:text-left mb-4">
              We&apos;re here to assist you! If you couldn&apos;t find what
              you&apos;re looking for, please reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <a
                href="mailto:info@safar.fyi"
                className="inline-flex items-center justify-center px-4 py-2 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-lg transition-colors duration-300"
              >
                <Mail size={16} className="mr-2" />
                Email Support
              </a>
              <a
                href="https://instagram.com/safar.fyi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 hover:border-[color:var(--color-accent)]/30 hover:bg-[color:var(--color-accent)]/5 text-gray-700 rounded-lg transition-colors duration-300"
              >
                Instagram Support
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
