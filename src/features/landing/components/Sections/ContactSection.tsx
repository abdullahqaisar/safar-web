'use client';

import { Container } from '@/components/common/Container';
import { Loader2, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { SectionBadge } from '@/components/common/SectionBadge';
import { FormEvent, useState } from 'react';
import { sendContactEmail } from '@/features/contribute/services/contactEmailService';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFocused(e.target.name);
  };

  const handleBlur = () => {
    setFocused(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send the email using the Resend-based contactEmailService
      const result = await sendContactEmail(formData);

      if (result.success) {
        setIsSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(
          result.message ||
            'Failed to send your message. Please try again later.'
        );
      }
    } catch (err) {
      console.error('Email sending failed:', err);
      setError('Failed to send your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (name: string) => `
    w-full px-4 py-2 bg-white border border-gray-300 rounded-lg 
    ${focused === name ? 'ring-2 ring-[color:var(--color-accent)]/30 border-[color:var(--color-accent)]' : ''}
    focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]
  `;

  return (
    <section id="contact">
      <div className="bg-[color:var(--color-bg-cream)] relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <Container className="relative z-10">
          {/* Changed to grid layout with two columns */}
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
                      <a
                        href="mailto:info@safar.fyi"
                        className="hover:text-[color:var(--color-accent)]"
                      >
                        info@safar.fyi
                      </a>
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
                      <a
                        href="https://instagram.com/safar.fyi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[color:var(--color-accent)]"
                      >
                        Instagram: @safar.fyi
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg border border-[color:var(--color-accent)]/10">
                  <h3 className="font-medium text-gray-800 mb-2">
                    Response Time
                  </h3>
                  <p className="text-sm text-[color:var(--color-gray-600)]">
                    We typically respond to inquiries within 24-48 hours during
                    business days. Thank you for your patience.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="flex justify-center md:justify-end">
              {isSuccess ? (
                <div className="bg-white/50 border border-green-100 rounded-lg p-6 text-center w-full max-w-md">
                  <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-[color:var(--color-gray-600)] mb-4">
                    Thank you for reaching out. We&apos;ve received your message
                    and will get back to you soon.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white/50 p-6 rounded-lg shadow-sm space-y-4 w-full max-w-md"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className={inputClasses('name')}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className={inputClasses('email')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className={inputClasses('subject')}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="feedback">Feedback</option>
                      <option value="bug">Bug Report</option>
                      <option value="suggestion">Feature Suggestion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className={inputClasses('message')}
                      required
                    ></textarea>
                  </div>

                  {error && <div className="text-red-600 text-sm">{error}</div>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="inline animate-spin mr-2"
                          size={16}
                        />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-2">
                    We respect your privacy and will never share your
                    information.
                  </p>
                </form>
              )}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
