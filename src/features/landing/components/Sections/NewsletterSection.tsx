'use client';

import { Container } from '@/components/common/Container';
import { Loader2 } from 'lucide-react';
import { SectionBadge } from '@/components/common/SectionBadge';
import { FormEvent, useState } from 'react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // TODO: replace with actual API call in production
    try {
      // await subscribeToNewsletter(email);
      // Fake successful response
      await new Promise((resolve) => setTimeout(resolve, 800));

      setEmail('');
      setMessage({
        text: "You've successfully subscribed to our newsletter!",
        isError: false,
      });
    } catch (error) {
      console.error(error);
      setMessage({
        text: 'Something went wrong. Please try again later.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="newsletter">
      <div className="bg-gradient-to-br from-[color:var(--color-accent)]/5 to-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            <SectionBadge className="mb-6 sm:mb-8" icon={false}>
              Updates
            </SectionBadge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6 sm:mb-8">
              Stay Updated
            </h2>

            <p className="text-base sm:text-lg text-[color:var(--color-gray-600)] max-w-2xl mx-auto leading-relaxed mb-10">
              Subscribe to our newsletter for the latest transit updates, route
              changes, and Safar improvements.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className={`flex-1 bg-white border ${
                  message?.isError ? 'border-red-400' : 'border-gray-300'
                } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]`}
                aria-label="Email address for newsletter"
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="whitespace-nowrap px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>

            {message && (
              <div
                className={`mt-4 text-sm text-center ${
                  message.isError
                    ? 'text-red-600'
                    : 'text-[color:var(--color-accent)]'
                }`}
              >
                {message.text}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}
