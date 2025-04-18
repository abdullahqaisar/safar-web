import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/common/Container';
import {
  MessageSquare,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react';

export default function CommunityBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const communityChannels = [
    {
      name: 'Metro Bus Updates RWP/ISB',
      description: 'Daily metro bus service updates',
      icon: Bell,
      url: 'https://whatsapp.com/channel/0029Vao4OLg002T97lLNFs2n',
    },
    {
      name: 'Twin Cities Urban Transit',
      description: 'All transit news and route changes',
      icon: MessageSquare,
      url: 'https://whatsapp.com/channel/0029VamJhy77IUYTbJBMQr2l',
    },
    {
      name: 'Electric Buses Updates',
      description: 'Electric bus schedules and stops',
      icon: Bell,
      url: 'https://whatsapp.com/channel/0029Vax1l4g4yltUta9jZo1J',
    },
    {
      name: 'Twin Cities Mass Transit',
      description: 'Facebook community page',
      icon: ExternalLink,
      url: 'https://www.facebook.com/share/1YXMYUAB1W/',
    },
  ];

  return (
    <div className="relative z-10 pb-4 md:pb-6 px-2 sm:px-2">
      <Container className="max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[color:var(--color-accent)]/20">
          {/* Banner Header */}
          <div className="bg-gradient-to-r from-[color:var(--color-accent)]/10 to-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--color-accent)] mr-2 flex-shrink-0" />
              <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                Transit Updates by Community Members
              </h3>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-800 p-1"
                aria-label={
                  isExpanded ? 'Collapse channels' : 'Expand channels'
                }
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-gray-600 hover:text-gray-800 p-1"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-3 sm:px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {communityChannels.map((channel, idx) => (
                  <a
                    key={idx}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-gray-50 hover:bg-[color:var(--color-accent)]/5 p-3 sm:p-4 rounded-lg border border-gray-100 transition-colors"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <channel.icon className="w-4 h-4 text-[color:var(--color-accent)]" />
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                        {channel.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {channel.description}
                    </p>
                    <div className="mt-auto flex items-center text-xs font-medium text-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-dark)]">
                      Join Channel
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  External channels managed by transit enthusiasts who supported
                  this project
                </p>
                <Link
                  href="/collaborators"
                  className="text-xs sm:text-sm font-medium text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] flex items-center whitespace-nowrap"
                >
                  View contributors
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {/* Collapsed Content */}
          {!isExpanded && (
            <div className="px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Join community-run WhatsApp channels for transit updates and
                schedules
              </p>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <a
                  href="https://whatsapp.com/channel/0029Vao4OLg002T97lLNFs2n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 sm:px-3 py-1.5 bg-[#25D366] hover:bg-[#22be5b] text-white text-xs sm:text-sm font-medium rounded flex items-center transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                  Join Channels
                </a>
                <Link
                  href="/collaborators"
                  className="text-xs sm:text-sm font-medium text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] flex items-center whitespace-nowrap"
                >
                  Learn More
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
