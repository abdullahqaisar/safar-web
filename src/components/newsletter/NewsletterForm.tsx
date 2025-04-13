'use client';

import React, { useState } from 'react';
import { Bell, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { subscribe } from '@/app/actions/subscribeActions';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus('loading');

    const formData = new FormData();
    formData.append('email', email);

    const result = await subscribe(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.message || 'Something went wrong. Please try again.');
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      if (status !== 'idle') {
        setStatus('idle');
      }
    }, 5000);
  };

  return (
    <div className="w-full">
      <h5 className="font-medium mb-3 text-gray-200">Stay Updated</h5>
      <p className="text-gray-300 text-sm mb-4">
        Subscribe to receive transit route updates and service announcements.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            name="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full py-2.5 px-4 pr-12 rounded-lg bg-white/10 border border-white/20 
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-white 
              placeholder:text-gray-400 text-sm transition-all ${
                status === 'error' ? 'border-red-400 focus:ring-red-400' : ''
              }`}
            disabled={status === 'loading' || status === 'success'}
            required
          />
          <span className="absolute right-3 top-2.5 text-gray-400">
            <Bell className="h-5 w-5" />
          </span>
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`w-full py-2.5 px-4 rounded-lg transition-all font-medium text-sm
            ${
              status === 'loading'
                ? 'bg-[var(--color-accent)]/80 text-white cursor-wait'
                : status === 'success'
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white'
            }`}
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Subscribing...
            </span>
          ) : status === 'success' ? (
            <span className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Subscribed!
            </span>
          ) : (
            'Subscribe Now'
          )}
        </button>

        {status === 'error' && (
          <div className="flex items-center text-red-400 text-xs mt-1.5">
            <XCircle className="h-4 w-4 mr-1.5" />
            <span>{message}</span>
          </div>
        )}

        <p className="text-gray-400 text-xs">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
}
