import { Metadata } from 'next';
import PageHeader from '@/components/common/PageHeader';
import React from 'react';
import { Container } from '@/components/common/Container';
import {
  Instagram,
  MessageSquare,
  ExternalLink,
  Bell,
  FacebookIcon,
} from 'lucide-react';
import Link from 'next/link';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Collaborators | Safar',
  description:
    'Meet the collaborators and communities who contributed to the Safar transit application',
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

/**
 * Collaborators page to acknowledge contributors to the project
 */
export default function CollaboratorsPage() {
  const communityChannels = [
    {
      title: 'Metro Bus Updates RWP/ISB',
      description:
        'Community-run channel providing daily updates on metro bus routes, schedules, and service changes in Rawalpindi and Islamabad.',
      icon: Bell,
      color: 'emerald',
      link: 'https://whatsapp.com/channel/0029Vao4OLg002T97lLNFs2n',
      label: 'Channel 1',
    },
    {
      title: 'Twin Cities Urban Transit Updates',
      description:
        'External channel sharing information about urban transit services and developments in the Twin Cities area.',
      icon: MessageSquare,
      color: 'blue',
      link: 'https://whatsapp.com/channel/0029VamJhy77IUYTbJBMQr2l',
      label: 'Channel 2',
    },
    {
      title: 'Electric Buses Stops Updates',
      description:
        'Independently managed channel with updates about electric bus stops, routes, and schedule changes throughout the Twin Cities.',
      icon: Bell,
      color: 'amber',
      link: 'https://whatsapp.com/channel/0029Vax1l4g4yltUta9jZo1J',
      label: 'Channel 3',
    },
    {
      title: 'Twin Cities Mass Transit Community',
      description:
        'External Facebook community page where transit enthusiasts discuss and share information about mass transit options in Rawalpindi and Islamabad.',
      icon: FacebookIcon,
      color: 'indigo',
      link: 'https://www.facebook.com/share/1YXMYUAB1W/',
      label: 'Facebook Page',
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

        <PageHeader
          title="Our Collaborators"
          description="We're grateful to these individuals and communities for
                their contributions to mapping Islamabad's transit network."
        />

        <main className="relative z-10">
          <Container maxWidth="5xl" className="px-4 sm:px-4 py-6">
            {/* WhatsApp Communities Section */}
            <div className="mb-16">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6 mb-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Community Transit Information Channels
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    These external WhatsApp channels and Facebook community are
                    managed by transit enthusiasts who supported our project
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {communityChannels.map((channel, index) => (
                    <a
                      key={index}
                      href={channel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col bg-white border border-gray-200 hover:border-[color:var(--color-accent)] rounded-xl p-6 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center mb-4">
                        <div
                          className={`w-12 h-12 bg-${channel.color}-100 rounded-full flex items-center justify-center mr-4`}
                        >
                          <channel.icon
                            className={`w-6 h-6 text-${channel.color}-600`}
                          />
                        </div>
                        <div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full bg-${channel.color}-100 text-${channel.color}-700 mb-1 inline-block`}
                          >
                            {channel.label}
                          </span>
                          <h3 className="text-lg font-bold text-gray-800">
                            {channel.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 text-sm">
                        {channel.description}
                      </p>

                      <div className="mt-auto flex items-center text-[color:var(--color-accent)] font-medium group-hover:text-[color:var(--color-accent-dark)]">
                        {channel.label.includes('Facebook')
                          ? 'Visit Page'
                          : 'Join Channel'}
                        <ExternalLink className="w-4 h-4 ml-1.5" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual Contributors */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Individual Contributors
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Individual Contributor Card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                        <Instagram className="w-7 h-7 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Faizan Khatak
                        </h3>
                        <p className="text-sm text-gray-500">
                          Mapping Data Contributor
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-6">
                      Provided essential mapping data and insights for transit
                      routes that helped make our visualization accurate and
                      comprehensive.
                    </p>

                    <div className="border-t border-gray-100 pt-4">
                      <Link
                        href="https://www.instagram.com/faizan_ukk/"
                        className="flex items-center text-amber-600 hover:text-amber-700 font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        <span>@faizan_ukk</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-8 max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Want to Contribute?
                </h3>
                <p className="text-gray-600 mb-6">
                  If you have knowledge about transit routes or want to
                  contribute to improving this application, we&apos;d love to
                  hear from you.
                </p>
                <Link
                  href="/contribute"
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  Join Our Contributors
                </Link>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}
