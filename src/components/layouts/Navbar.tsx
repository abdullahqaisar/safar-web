'use client';

import Link from 'next/link';
import { useState } from 'react';

const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/routes', label: 'Routes' },
  { href: '/maps', label: 'Maps' },
  { href: '/contribute', label: 'Contribute' },
  { href: '/help', label: 'Help' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[color:var(--color-primary)] sticky top-0 z-50 border-b border-[color:var(--color-primary-light)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[color:var(--color-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span
                className="italic text-white font-bold text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Safar
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-100 hover:text-[color:var(--color-accent-light)] transition-colors py-1 text-sm font-medium border-b-2 border-transparent hover:border-[color:var(--color-accent)]"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/route-request"
              className="ml-2 px-4 py-2 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-md text-sm font-medium transition-colors"
            >
              Request Route
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <i
              className={`fas ${
                isMobileMenuOpen ? 'fa-times' : 'fa-bars'
              } text-xl`}
            ></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-[color:var(--color-primary-light)] mt-3">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-gray-100 hover:text-[color:var(--color-accent-light)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/route-request"
              className="block mt-3 py-2 px-4 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white rounded-md text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Request Route
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
