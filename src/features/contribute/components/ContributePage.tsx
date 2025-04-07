'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/common/Container';
import PageHeader from '@/components/common/PageHeader';
import {
  FileEdit,
  HelpCircle,
  MapPin,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import ContributionForm from './ContributionForm';
import ContactForm from './ContactForm';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';

export default function ContributePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'contribute');

  // Update the activeTab state when the query parameter changes
  useEffect(() => {
    if (tabParam && ['contribute', 'support'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
            title="Contribute & Support"
            description="Help improve Pakistan's transit mapping by sharing your knowledge or contact us with questions"
          />

          <Container maxWidth="6xl" className="px-4 sm:px-6 py-4">
            {/* Support options cards - visible on all tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Email Support Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <Mail className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Email Support
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Get in touch with our support team directly via email
                </p>
                <a
                  href="mailto:info@safar.fyi"
                  className="mt-auto text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] font-medium inline-flex items-center relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[color:var(--color-accent)] hover:after:w-full after:transition-all after:duration-300"
                >
                  info@safar.fyi
                </a>
              </div>

              {/* Instagram Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <MessageSquare className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Follow on Instagram
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Follow us on Instagram for updates and announcements
                </p>
                <a
                  href="https://instagram.com/safar.fyi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] font-medium inline-flex items-center relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[color:var(--color-accent)] hover:after:w-full after:transition-all after:duration-300"
                >
                  @safar.fyi
                  <ExternalLink size={14} className="ml-1.5" />
                </a>
              </div>

              {/* Collaborators Card */}
              <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[color:var(--color-accent)]/30 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[color:var(--color-accent)]/20 transition-colors duration-300">
                  <BookOpen className="w-6 h-6 text-[color:var(--color-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Our Collaborators
                </h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Meet the people who help make Safar possible
                </p>
                <Link
                  href="/collaborators"
                  className="mt-auto text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] font-medium inline-flex items-center relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[color:var(--color-accent)] hover:after:w-full after:transition-all after:duration-300"
                >
                  View Collaborators
                </Link>
              </div>
            </div>

            {/* Tabs section */}
            <Tabs
              value={activeTab}
              className="mb-12"
              onValueChange={setActiveTab}
            >
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="contribute">Contribute</TabsTrigger>
                  <TabsTrigger value="support">Contact Us</TabsTrigger>
                </TabsList>
              </div>

              {/* Contribute Tab */}
              <TabsContent value="contribute" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="col-span-1 lg:col-span-2">
                    {/* Main Form Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-emerald-50 p-5 border-b border-emerald-100">
                        <h2 className="font-semibold text-emerald-800 flex items-center">
                          <FileEdit className="h-5 w-5 mr-2 text-emerald-600" />
                          Submit Your Contribution
                        </h2>
                      </div>
                      <div className="p-6">
                        <ContributionForm />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    {/* Information Panel */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
                      <div className="bg-gray-50 p-5 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-emerald-600" />
                          How You Can Help
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="space-y-5">
                          {/* Contribution Types */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                              Transit Route Data
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Share information about bus routes, metro lines,
                              or feeder services that may be missing or need
                              corrections.
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                              Station Information
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Add details about stations, stops, accessibility
                              features, or suggest corrections to existing
                              information.
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                              Service Schedule
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Provide updated information about route schedules,
                              frequency, or operational hours of transit
                              services.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 p-5 border-b border-emerald-100">
                    <h2 className="font-semibold text-emerald-800 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-emerald-600" />
                      Contact Us
                    </h2>
                  </div>
                  <div className="p-6">
                    <ContactForm />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Container>
        </div>
      </div>
    </div>
  );
}
