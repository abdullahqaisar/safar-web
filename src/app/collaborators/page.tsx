import { Metadata } from 'next';
import React from 'react';
import { Container } from '@/components/common/Container';
import {
  Instagram,
  ExternalLink,
  Bell,
  FacebookIcon,
  Users,
  MapPin,
  AtSign,
  Award,
  BookOpen,
  ChevronRight,
  UserPlus,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Collaborators | Safar',
  description:
    'Meet the collaborators and communities who contributed to Safar',
  keywords: [
    'collaborators',
    'contributors',
    'Islamabad Metro',
    'public transit',
    'Safar',
    'Twin Cities',
    'WhatsApp community',
  ],
};

// Define types for better type safety
type ContributionType = string;

interface SocialLink {
  platform: string;
  handle: string;
  link: string;
}

interface BaseContributor {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  type: string;
}

interface ChannelOrGroup extends BaseContributor {
  link: string;
  label: string;
}

interface IndividualContributor extends BaseContributor {
  name: string;
  role: string;
  social: SocialLink;
  contributions: ContributionType[];
}


/**
 * Collaborators page to acknowledge contributors to the project
 */
export default function CollaboratorsPage() {
  const communityChannels: ChannelOrGroup[] = [
    {
      title: 'Metro Bus Updates RWP/ISB',
      description:
        'Community-run channel providing daily updates on metro bus routes, schedules, and service changes in Rawalpindi and Islamabad.',
      icon: Bell,
      color: 'emerald',
      link: 'https://whatsapp.com/channel/0029Vao4OLg002T97lLNFs2n',
      label: 'Channel 1',
      type: 'channel',
    },
    {
      title: 'Electric Buses Stops Updates',
      description:
        'Independently managed channel with updates about electric bus stops, routes, and schedule changes throughout the Twin Cities.',
      icon: Bell,
      color: 'amber',
      link: 'https://whatsapp.com/channel/0029Vax1l4g4yltUta9jZo1J',
      label: 'Channel 3',
      type: 'channel',
    },
    {
      title: 'Twin Cities Mass Transit Community',
      description:
        'External Facebook community page where transit enthusiasts discuss and share information about mass transit options in Rawalpindi and Islamabad.',
      icon: FacebookIcon,
      color: 'blue',
      link: 'https://www.facebook.com/share/1YXMYUAB1W/',
      label: 'Facebook Page',
      type: 'social',
    },
  ];

  const communityGroups: ChannelOrGroup[] = [
    {
      title: 'MetroBus Updates Group',
      description:
        'Created in 2022, this is the 5th group in a series that spans nearly 4000 people across 5 groups. Regular updates related to MetroBus and feeder routes are shared here.',
      icon: Users,
      color: 'green',
      link: 'https://chat.whatsapp.com/LWdGtknOJw50hifv7phx5l',
      label: 'WhatsApp Group',
      type: 'group',
    },
  ];

  const individualContributors: IndividualContributor[] = [
    {
      title: 'Faizan Khatak', // For common filtering
      name: 'Faizan Khatak',
      role: 'Mapping Data Contributor',
      description:
        'Provided essential mapping data and insights for transit routes that helped make our visualization accurate and comprehensive.',
      icon: Instagram,
      color: 'amber',
      social: {
        platform: 'Instagram',
        handle: '@faizan_ukk',
        link: 'https://www.instagram.com/faizan_ukk/',
      },
      contributions: ['Route Mapping', 'Data Collection'],
      type: 'individual',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10">
          {/* Header Section */}
          <PageHeader
            title="Our Collaborators"
            description="We're grateful to these individuals and communities for
                their contributions to mapping Islamabad's transit network."
          />

          <Container maxWidth="5xl" className="px-4 pb-20 pt-4">
            {/* Sections Navigation */}
            <div className="flex flex-wrap justify-center mb-8">
              <a href="#channels" className="m-1 px-5 py-2 bg-white rounded-full shadow-sm hover:shadow text-gray-700 font-medium transition-all hover:text-[color:var(--color-accent)]">
                Channels
              </a>
              <a href="#groups" className="m-1 px-5 py-2 bg-white rounded-full shadow-sm hover:shadow text-gray-700 font-medium transition-all hover:text-[color:var(--color-accent)]">
                Groups
              </a>
              <a href="#individuals" className="m-1 px-5 py-2 bg-white rounded-full shadow-sm hover:shadow text-gray-700 font-medium transition-all hover:text-[color:var(--color-accent)]">
                Individuals
              </a>
            </div>

            {/* Individual Contributors */}
            <div id="individuals" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Individual Contributors
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {individualContributors.map((item, index) => (
                  <div
                    key={`individual-${index}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[color:var(--color-accent)] hover:shadow-md transition-all group"
                  >
                    <div className="h-3 bg-amber-500"></div>
                    <div className="p-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                            <item.icon className="w-6 h-6 text-amber-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-gray-800">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {item.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>

                      

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs uppercase font-semibold text-gray-500 mb-2">
                          Contributions
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.contributions.map((contribution: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {contribution}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={item.social.link}
                          className="flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <AtSign className="w-3.5 h-3.5 mr-1" />
                          <span>{item.social.handle}</span>
                          <ExternalLink className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels Section */}
            <div id="channels" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Community Channels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityChannels.map((item, index) => (
                  <div
                    key={`channel-${index}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[color:var(--color-accent)] hover:shadow-md transition-all group"
                  >
                    <div className={`h-3 bg-${item.color}-500`}></div>
                    <div className="p-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-14 h-14 bg-${item.color}-100 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform`}
                          >
                            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full bg-${item.color}-100 text-${item.color}-700 mb-1`}
                          >
                            {item.label}
                          </span>
                          <h3 className="text-lg font-bold text-gray-800">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-full py-2.5 mt-4 bg-${item.color}-50 hover:bg-${item.color}-100 text-${item.color}-700 font-medium rounded-lg transition-colors text-sm`}
                      >
                        Follow Channel
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Groups Section */}
            <div id="groups" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Community Groups
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityGroups.map((item, index) => (
                  <div
                    key={`group-${index}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[color:var(--color-accent)] hover:shadow-md transition-all group"
                  >
                    <div className={`h-3 bg-${item.color}-500`}></div>
                    <div className="p-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-14 h-14 bg-${item.color}-100 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform`}
                          >
                            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full bg-${item.color}-100 text-${item.color}-700 mb-1`}
                          >
                            {item.label}
                          </span>
                          <h3 className="text-lg font-bold text-gray-800">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-full py-2.5 mt-4 bg-${item.color}-50 hover:bg-${item.color}-100 text-${item.color}-700 font-medium rounded-lg transition-colors text-sm`}
                      >
                        Join Group
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Want to Join Section */}
            <div className="mt-16 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="md:flex">
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full mb-4">
                    Join Our Community
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Become a Contributor
                  </h2>
                  <p className="text-gray-600 mb-6">
                    If you have knowledge about transit routes or want to 
                    contribute to improving this application, we&apos;d love to hear from you.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          Share your knowledge about public transit in the Twin Cities
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          Help map routes and improve accuracy of transit information
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Globe className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          Join a community dedicated to improving public transit access
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <Link
                      href="/contribute"
                      className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Get Started
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-emerald-400 to-amber-400 relative">
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center p-8">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                     
                      <p className="text-white/80">
                        Be part of a growing community dedicated to improving transit information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to top button */}
            <div className="flex justify-center mt-12">
              <a 
                href="#" 
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow hover:shadow-md transition-all text-gray-500 hover:text-[color:var(--color-accent)]"
                aria-label="Back to top"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </a>
            </div>
          </Container>
        </div>
      </div>
      
      {/* Add a custom scroll progress indicator */}
      <div className="fixed bottom-0 left-0 h-1 bg-[color:var(--color-accent)]" style={{ width: 'var(--scroll-width, 0%)' }}></div>
      
      {/* Add client-side script to handle scroll progress */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Scroll progress indicator
          window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            document.documentElement.style.setProperty('--scroll-width', scrollPercent + '%');
          });
          
          // Smooth scrolling for anchor links
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
              e.preventDefault();
              const targetId = this.getAttribute('href');
              if (targetId === '#') {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                  targetElement.scrollIntoView({
                    behavior: 'smooth'
                  });
                }
              }
            });
          });
        });
      ` }} />
    </div>
  );
}
