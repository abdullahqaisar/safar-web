import Link from 'next/link';
import { Container } from '@/components/common/Container';

// Extract footer data into organized objects for maintainability
const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/routes', label: 'Routes' },
  { href: '/maps', label: 'Maps' },
  { href: '/help', label: 'Help' },
];

const resourceLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/city-guide', label: 'City Guide' },
  { href: '/updates', label: 'Transit Updates' },
];

const contactInfo = [
  { icon: 'fas fa-envelope', text: 'info@safar.pk', ariaLabel: 'Email' },
  { icon: 'fas fa-phone-alt', text: '+92 51 123 4567', ariaLabel: 'Phone' },
  {
    icon: 'fas fa-map-marker-alt',
    text: 'Islamabad, Pakistan',
    ariaLabel: 'Location',
  },
];

const socialLinks = [
  {
    href: 'https://facebook.com',
    icon: 'fab fa-facebook-f',
    label: 'Facebook',
  },
  { href: 'https://twitter.com', icon: 'fab fa-twitter', label: 'Twitter' },
  {
    href: 'https://instagram.com',
    icon: 'fab fa-instagram',
    label: 'Instagram',
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="text-white py-12 relative"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Background gradient using theme variables */}
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-primary)] to-[color:var(--color-primary-dark)] -z-10"></div>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Tagline */}
          <div>
            <h4 className="text-xl font-bold mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-[color:var(--color-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Safar</span>
            </h4>
            <p className="text-gray-400">Public Transportation Made Easy</p>
          </div>

          {/* Quick Links */}
          <nav aria-labelledby="footer-quick-links">
            <h5
              id="footer-quick-links"
              className="font-medium mb-4 text-gray-200"
            >
              Quick Links
            </h5>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[color:var(--color-accent-light)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-labelledby="footer-resources">
            <h5
              id="footer-resources"
              className="font-medium mb-4 text-gray-200"
            >
              Resources
            </h5>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[color:var(--color-accent-light)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h5 className="font-medium mb-4 text-gray-200">Contact</h5>
            <ul className="space-y-2 text-gray-400">
              {contactInfo.map((item, index) => (
                <li key={index} className="flex items-center">
                  <i
                    className={`${item.icon} mr-2 text-[color:var(--color-accent)]`}
                    aria-hidden="true"
                  ></i>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <i className={social.icon} aria-hidden="true"></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[color:var(--color-primary-light)] mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© {currentYear} Safar. All rights reserved.</p>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[color:var(--color-primary-dark)] via-[color:var(--color-accent)] to-[color:var(--color-primary-dark)]"></div>
      </Container>
    </footer>
  );
}
