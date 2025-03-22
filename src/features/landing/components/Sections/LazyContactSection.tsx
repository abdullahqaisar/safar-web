'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionBadge } from '@/components/common/SectionBadge';

// Dynamically import the ContactSection with lazy loading
const ContactSection = dynamic(
  () =>
    import('./ContactSection').then((mod) => ({ default: mod.ContactSection })),
  {
    loading: () => <ContactSectionSkeleton />,
    ssr: false, // Disable server-side rendering for EmailJS dependencies
  }
);

// Loading skeleton to show while the ContactSection is being loaded
function ContactSectionSkeleton() {
  return (
    <section id="contact">
      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-8">
            <SectionBadge className="mb-6 sm:mb-8" icon={false}>
              Contact
            </SectionBadge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6 sm:mb-8">
              Get in Touch
            </h2>

            <div className="w-full flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[color:var(--color-accent)]" />
                <p className="text-[color:var(--color-gray-600)]">
                  Loading contact form...
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

export function LazyContactSection() {
  return (
    <Suspense fallback={<ContactSectionSkeleton />}>
      <ContactSection />
    </Suspense>
  );
}
