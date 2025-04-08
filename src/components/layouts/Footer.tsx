'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Facebook, Instagram, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { subscribe } from '@/app/actions/subscribeActions';
import { Loader2, CheckCircle, XCircle, Bell } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
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
    <footer
      className="bg-[var(--color-primary)] text-white relative"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Top divider shape */}
      <div className="absolute top-0 left-0 right-0 w-full h-12 sm:h-16 -translate-y-[99%] overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full"
          aria-hidden="true"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-[#FEF6EC]"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Top section with subscription */}
        <div className="max-w-4xl mx-auto border-b border-white/20 pb-10 mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stay Updated on Transit News
          </h2>
          <p className="mb-6 text-gray-300 max-w-2xl mx-auto">
            Get the latest updates on routes, schedules, and improvements to
            Pakistan&apos;s public transit systems.
          </p>

          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-grow">
              <input
                type="email"
                name="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full py-3 px-4 pr-12 rounded-lg bg-white/10 border border-white/20 
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-white 
                  placeholder:text-gray-400 text-sm transition-all h-12 ${
                    status === 'error'
                      ? 'border-red-400 focus:ring-red-400'
                      : ''
                  }`}
                disabled={status === 'loading' || status === 'success'}
                required
              />
              <span className="absolute right-3 top-3.5 text-gray-400">
                <Bell className="h-5 w-5" />
              </span>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className={`h-12 py-3 px-6 rounded-lg transition-all font-medium text-sm whitespace-nowrap
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
          </form>

          {status === 'error' && (
            <div className="flex items-center justify-center text-red-400 text-xs mt-2">
              <XCircle className="h-4 w-4 mr-1.5" />
              <span>{message}</span>
            </div>
          )}

          <p className="text-gray-400 text-xs mt-3">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: About */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 relative overflow-hidden rounded-lg">
                <Image
                  src="/images/icons/safar-logo.svg"
                  alt="Safar Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-xl tracking-tight">
                Safar
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Making public transportation in Pakistan easier, faster, and
              stress-free.
            </p>
            <div className="flex space-x-3">
              <SocialLink
                href="https://www.facebook.com/safar.fyi"
                icon={<Facebook size={18} />}
              />
              <SocialLink
                href="https://www.instagram.com/safar.fyi"
                icon={<Instagram size={18} />}
              />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-3">
              <FooterLink href="/" label="Home" />
              <FooterLink href="/route" label="Find your Route" />
              <FooterLink href="/map" label="View Routes Map" />
              <FooterLink href="/contribute" label="Help and Support" />
              <FooterLink href="/collaborators" label="Collaborators" />
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <FooterLink href="/contribute?tab=support" label="Contact Us" />
              <FooterLink href="/contribute" label="Contribute" />
              <FooterLink href="/collaborators" label="Communities" />
            </ul>
          </div>

          {/* New Column: Explore Directory (for SEO) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Explore</h3>
            <ul className="space-y-3">
              <FooterLink href="/stations" label="Stations" />
              <FooterLink href="/transit-lines" label="Transit Lines" />
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex">
                <Mail className="h-5 w-5 text-[var(--color-accent)] mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">info@safar.fyi</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {year} Safar. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <span className="text-gray-400 text-sm">
              Made with ❤️ in Pakistan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterLinkProps {
  href: string;
  label: string;
}

const FooterLink = ({ href, label }: FooterLinkProps) => (
  <li>
    <Link
      href={href}
      className="text-gray-300 hover:text-white transition-colors flex items-center group text-sm"
    >
      <ChevronRight className="h-4 w-4 mr-2 text-[var(--color-accent)] transform transition-transform group-hover:translate-x-1" />
      {label}
    </Link>
  </li>
);

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
}

const SocialLink = ({ href, icon }: SocialLinkProps) => (
  <a
    href={href}
    className="bg-white/10 hover:bg-[var(--color-accent)] hover:text-white transition-colors p-2 rounded-full"
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Visit Safar on ${href.split('.')[1]}`}
  >
    {icon}
  </a>
);

export default Footer;
