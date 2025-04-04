'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Loader2, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import {
  initEmailJS,
  sendContactEmail,
} from '@/features/help/services/emailService';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize EmailJS when the component mounts
  useEffect(() => {
    initEmailJS();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill out all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      // Send the email using EmailJS
      await sendContactEmail(formData);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Email sending failed:', err);
      setError('Failed to send your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Contact Us</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-[color:var(--color-gray-600)] mb-6">
            Have a question or feedback? We&apos;d love to hear from you. Fill
            out the form and our team will get back to you as soon as possible.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-[color:var(--color-accent)]" />
              </div>
              <div>
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
              <div>
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
          </div>

          <div className="bg-[color:var(--color-accent)]/5 p-4 rounded-lg border border-[color:var(--color-accent)]/10">
            <h3 className="font-medium text-gray-800 mb-2">Response Time</h3>
            <p className="text-sm text-[color:var(--color-gray-600)]">
              We typically respond to inquiries within 24-48 hours during
              business days. Thank you for your patience.
            </p>
          </div>
        </div>

        <div>
          {isSuccess ? (
            <div className="bg-green-50 border border-green-100 rounded-lg p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Message Sent!
              </h3>
              <p className="text-[color:var(--color-gray-600)] mb-4">
                Thank you for reaching out. We&apos;ve received your message and
                will get back to you soon.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]"
                  required
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]"
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
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)]"
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
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
