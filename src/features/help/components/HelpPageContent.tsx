'use client';

import { Container } from '@/components/common/Container';
import { Mail, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';
import ContactSection from './sections/ContactSection';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';

export default function HelpPageContent() {
  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10">
          {/* Header Section */}
          <PageHeader
            title="Help & Support"
            description="Find answers to common questions, learn how to use Safar, and get in touch with our support team"
          />

          <Container>
            {/* Support options cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              {/* Email Support Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <Mail className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Email Support
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Get in touch with our support team directly via email
                </p>
                <a
                  href="mailto:info@safar.fyi"
                  className="mt-auto text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] font-medium inline-flex items-center relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[color:var(--color-accent)] hover:after:w-full after:transition-all after:duration-300"
                >
                  info@safar.fyi
                </a>
              </div>

              {/* Social Support Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <MessageSquare className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Social Support
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Connect with us on Instagram for quick responses
                </p>
                <a
                  href="https://instagram.com/safar.fyi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] font-medium inline-flex items-center relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[color:var(--color-accent)] hover:after:w-full after:transition-all after:duration-300"
                >
                  @safar.fyi
                  <ExternalLink size={14} className="ml-1.5" />
                </a>
              </div>

              {/* Report Issue Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md sm:col-span-2 md:col-span-1">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <AlertCircle className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Report an Issue
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Found a bug or having problems with the app?
                </p>
                <Link
                  href="/help#contact-form"
                  className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] font-medium hover:bg-[color:var(--color-accent)]/15 transition-colors duration-300"
                >
                  Submit a report
                </Link>
              </div>
            </div>

            {/* Contact form section */}
            <div
              id="contact-form"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Contact Us
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Fill out the form below and we&apos;ll get back to you within
                  24-48 hours on business days
                </p>
              </div>
              <ContactSection />
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
