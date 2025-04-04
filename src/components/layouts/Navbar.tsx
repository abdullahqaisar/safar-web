'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Map, Route, Navigation, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import { useOnClickOutside } from '@/hooks/use-click-outside';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

// Navigation links configuration
const navigationLinks = [
  { href: '/', label: 'Home', icon: Map },
  { href: '/route', label: 'Find Routes', icon: Route },
  { href: '/map', label: 'Network Map', icon: Navigation },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // Lock body scroll when mobile menu is open
  useLockBodyScroll(isMobileMenuOpen);

  // Handle scroll effect with throttling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    },
    [isMobileMenuOpen]
  );

  // Click outside to close
  useOnClickOutside(
    menuRef,
    () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    },
    menuButtonRef as React.RefObject<HTMLElement>
  );

  // Handle focus management for accessibility
  useEffect(() => {
    if (isMobileMenuOpen && firstFocusableRef.current) {
      // Small delay to ensure the animation doesn't interfere with focus
      const timer = setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

  // Check if the current path matches
  const isActive = useCallback(
    (path: string) => {
      if (path === '/') {
        return pathname === path;
      }
      return pathname.startsWith(path);
    },
    [pathname]
  );

  // Toggle mobile menu with proper focus management
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 shadow-sm backdrop-blur-md'
          : 'bg-[color:var(--color-accent)]/5'
      )}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 relative group transition-transform hover:scale-105 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 rounded-md"
            aria-label="Safar - Home"
          >
            <div className="h-10 w-10 flex items-center justify-center bg-[color:var(--color-accent)]/10 rounded-lg transition-colors group-hover:bg-[color:var(--color-accent)]/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[color:var(--color-accent)] transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <span className="font-semibold text-xl tracking-tight text-gray-800">
              Safar
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  'hover:text-[color:var(--color-accent)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2',
                  isActive(item.href)
                    ? 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
                    : 'text-gray-700 hover:bg-[color:var(--color-accent)]/5'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span className="mr-2 opacity-80">
                  <item.icon size={18} className="flex-shrink-0" />
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            onClick={toggleMobileMenu}
            className={cn(
              'md:hidden flex items-center justify-center w-10 h-10 rounded-lg',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2',
              isScrolled
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                : 'bg-white/30 text-gray-700 hover:bg-white/50'
            )}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">
              {isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            </span>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={cn(
          'fixed top-16 bottom-0 right-0 w-[280px] z-[1000] md:hidden',
          'bg-white shadow-lg flex flex-col',
          'transition-transform duration-300 ease-out',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        tabIndex={-1}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Mobile menu header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
            <h2
              id="mobile-menu-title"
              className="text-lg font-semibold text-gray-800"
            >
              Menu
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-grow overflow-y-auto relative z-10 bg-white">
            <nav className="p-4">
              <ul className="space-y-1">
                {navigationLinks.map((item, index) => (
                  <li key={item.href}>
                    <Link
                      ref={index === 0 ? firstFocusableRef : null}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-lg text-gray-700 transition-all duration-200',
                        'hover:text-[color:var(--color-accent)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2',
                        isActive(item.href)
                          ? 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span className="mr-3">
                        <item.icon size={20} className="flex-shrink-0" />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Footer section */}
          <div className="p-4 border-t border-gray-100 mt-auto">
            <p className="text-sm text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Safar
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
