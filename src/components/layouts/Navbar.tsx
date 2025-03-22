'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Map, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

const navigationLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/journey', label: 'Find Routes', icon: Map },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Check if the current path matches the nav item's path
  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-[color:var(--color-primary)] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
                className={cn(
                  'text-sm font-medium py-1 border-b-2 flex items-center gap-2 transition-colors',
                  isActivePath(link.href)
                    ? 'text-white border-[color:var(--color-accent)]'
                    : 'text-white/80 hover:text-white border-transparent hover:border-[color:var(--color-accent-light)]'
                )}
                aria-current={isActivePath(link.href) ? 'page' : undefined}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-[color:var(--color-primary-light)] mt-3">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block py-2 flex items-center gap-2',
                  isActivePath(link.href)
                    ? 'text-white font-medium'
                    : 'text-white/80 hover:text-white'
                )}
                aria-current={isActivePath(link.href) ? 'page' : undefined}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
