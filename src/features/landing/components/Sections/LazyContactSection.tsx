'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2, Mail, MessageSquare } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionBadge } from '@/components/common/SectionBadge';

// Lazy load the ContactSection component
const ContactSection = dynamic(
  () =>
    import('./ContactSection').then((mod) => ({ default: mod.ContactSection })),
  {
    loading: () => <ContactSectionSkeleton />,
    ssr: true, // We can enable SSR now that we're using server actions with Resend
  }
);

// Loading skeleton to show while the ContactSection is being loaded
function ContactSectionSkeleton() {
  return (
    <section id="contact">
      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          {/* Update skeleton to match the two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-left">
              <div className="mb-6">
                <SectionBadge icon={false}>Contact</SectionBadge>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Get in{' '}
                <span className="text-[color:var(--color-accent)]">Touch</span>
              </h2>

              <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] leading-relaxed mb-8">
                Have questions or feedback? We&apos;d love to hear from you.
                Fill out the form and our team will get back to you as soon as
                possible.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                    <Mail
                      size={18}
                      className="text-[color:var(--color-accent)]"
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-800">Email</h3>
                    <p className="text-[color:var(--color-gray-600)]">
                      info@safar.fyi
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare
                      size={18}
                      className="text-[color:var(--color-accent)]"
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-800">Social Media</h3>
                    <p className="text-[color:var(--color-gray-600)]">
                      Instagram: @safar.fyi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Loading Form */}
            <div className="flex justify-center md:justify-end">
              <div className="bg-white/50 p-6 rounded-lg shadow-sm w-full max-w-md h-80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[color:var(--color-accent)]" />
                  <p className="text-[color:var(--color-gray-600)]">
                    Loading contact form...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

export default function LazyContactSection() {
  return (
    <Suspense fallback={<ContactSectionSkeleton />}>
      <ContactSection />
    </Suspense>
  );
}
