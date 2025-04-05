'use client';

import { Container } from '@/components/common/Container';
import PageHeader from '@/components/common/PageHeader';
import { Mail, LifeBuoy } from 'lucide-react';
import ContactSection from './sections/ContactSection';

export default function HelpPageContent() {
  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Page header using the same component as Map page */}
        <PageHeader
          title="Help & Support"
          description="Find answers to common questions, learn how to use Safar, and get in touch with our support team"
        />

        <div className="relative z-10">
          <Container className="py-8 md:py-12">
            {/* Contact Section */}
            <div className="mb-16">
              <ContactSection />
            </div>

            {/* Need More Help Section */}
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
      </div>
    </div>
  );
}
