import React from 'react';
import Link from 'next/link';
import {
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-[var(--color-primary)] text-white relative"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Top divider shape */}
      <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white dark:fill-[var(--color-primary)]/95"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Column 1: About */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 relative">
                <Image
                  src="/lovable-uploads/1e41c855-044c-48d3-9d14-109b0b044d53.png"
                  alt="Safar Logo"
                  fill
                  className="object-contain"
                  sizes="40px"
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
              <SocialLink href="#" icon={<Facebook size={18} />} />
              <SocialLink href="#" icon={<Instagram size={18} />} />
              <SocialLink href="#" icon={<Linkedin size={18} />} />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <nav aria-labelledby="footer-quick-links">
            <h5
              id="footer-quick-links"
              className="font-medium mb-4 text-gray-200"
            >
              Quick Links
            </h5>
            <ul className="space-y-2">
              <FooterLink href="/" label="Home" />
              <FooterLink href="/route" label="Find your Route" />
              <FooterLink href="/map" label="View Routes Map" />
              <FooterLink href="/help" label="Help Center" />
            </ul>
          </nav>

          {/* Column 3: Contact */}
          <div>
            <h5 className="font-medium mb-4 text-gray-200">Contact</h5>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-[var(--color-accent)] mr-3 flex-shrink-0" />
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
