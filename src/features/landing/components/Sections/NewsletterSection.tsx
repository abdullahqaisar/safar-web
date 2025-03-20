'use client';

import { FormEvent, useState } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Container } from '@/components/common/Container';
import { Loader2 } from 'lucide-react';

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
    <section
      className="py-16 bg-white border-t border-gray-100"
      id="newsletter"
    >
      <Container className="relative z-10">
        <SectionHeading
          tag="Updates"
          title="Stay Updated"
          description="Subscribe to our newsletter for the latest transit updates, route changes, and Safar improvements."
        />

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
            } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500`}
            aria-label="Email address for newsletter"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="whitespace-nowrap px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
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
              message.isError ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </Container>
    </section>
  );
}
