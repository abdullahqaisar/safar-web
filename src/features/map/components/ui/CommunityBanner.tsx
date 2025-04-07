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
    <div className="relative z-10 pb-4 md:pb-6">
      <Container>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[color:var(--color-accent)]/20">
          <div className="bg-gradient-to-r from-[color:var(--color-accent)]/10 to-emerald-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-[color:var(--color-accent)] mr-2.5 flex-shrink-0" />
              <h3 className="font-medium text-gray-800">
                Transit Updates by Community Members
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-800"
                aria-label={
                  isExpanded ? 'Collapse channels' : 'Expand channels'
                }
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {communityChannels.map((channel, idx) => (
                  <a
                    key={idx}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-gray-50 hover:bg-[color:var(--color-accent)]/5 p-4 rounded-lg border border-gray-100 transition-colors"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center mr-3">
                        <channel.icon className="w-4 h-4 text-[color:var(--color-accent)]" />
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm">
                        {channel.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {channel.description}
                    </p>
                    <div className="mt-auto flex items-center text-xs font-medium text-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-dark)]">
                      Join Channel
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  External channels managed by transit enthusiasts who supported
                  this project
                </p>
                <Link
                  href="/collaborators"
                  className="text-sm font-medium text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] flex items-center"
                >
                  View contributors
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {!isExpanded && (
            <div className="px-4 py-2.5 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Join community-run WhatsApp channels for transit updates and
                schedules
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://whatsapp.com/channel/0029Vao4OLg002T97lLNFs2n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#22be5b] text-white text-sm font-medium rounded flex items-center transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Join Channels
                </a>
                <Link
                  href="/collaborators"
                  className="text-sm font-medium text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-dark)] flex items-center whitespace-nowrap"
                >
                  Learn More
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
