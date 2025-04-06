'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [focused, setFocused] = useState<string | null>(null);

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

  // Topics for the dropdown
  const topics = [
    { value: 'general', label: 'General Question' },
    { value: 'feedback', label: 'App Feedback' },
    { value: 'bug', label: 'Report an Issue' },
    { value: 'suggestion', label: 'Feature Request' },
    { value: 'other', label: 'Other' },
  ];

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center transform transition-all duration-500 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-5">
            <CheckCircle size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Message Sent Successfully!
          </h3>
          <p className="text-gray-600 mb-6">
            Thank you for reaching out. Your message has been received and
            we&apos;ll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="px-6 py-2.5 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  const inputClasses = (name: string) => `
    w-full px-4 py-3 border rounded-lg transition-all duration-200
    ${
      focused === name
        ? 'border-[color:var(--color-accent)] ring-2 ring-[color:var(--color-accent)]/20'
        : 'border-gray-300 hover:border-gray-400'
    }
    focus:outline-none focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent)]/20
  `;

  return (
    <div className="max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Left column - Contact form fields */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Your name"
              className={inputClasses('name')}
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Your email address"
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClasses('email')}
              required
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Topic
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`${inputClasses(
                'subject'
              )} cursor-pointer appearance-none bg-white`}
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <div className="absolute inset-y-0 right-3 -top-9 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Message and submit */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              placeholder="How can we help you?"
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`${inputClasses('message')} resize-none`}
              required
            ></textarea>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3 animate-fade-in-up">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Sending...
                </span>
              ) : (
                'Send Message'
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
              We typically respond within 24-48 hours on business days
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
