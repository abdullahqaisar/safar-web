import Image from 'next/image';
import React from 'react';

interface TransitLine {
  color: string;
  name: string;
}

interface NetworkMapPreviewProps {
  imageSrc: string;
  alt?: string;
  lines?: TransitLine[];
}

export const NetworkMapPreview = ({
  imageSrc,
  alt = 'Network Map',
  lines = [
    { color: '#E53E3E', name: 'Red Line' },
    { color: '#3B82F6', name: 'Blue Line' },
    { color: '#10B981', name: 'Green Line' },
  ],
}: NetworkMapPreviewProps) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-0 bg-[color:var(--color-accent)]/20 rounded-2xl -rotate-6"></div>
      <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 mr-4"></div>
          <div className="text-xs text-gray-600 flex-1 text-center">
            Routes View
          </div>
        </div>
        <div className="relative w-full h-64">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-cover object-center"
            style={{
              filter: 'grayscale(0.2) contrast(1.1)',
              opacity: 0.9,
            }}
            priority
          />
        </div>
        <div className="p-4 bg-gray-50">
          <div className="flex mb-3">
            {lines.map((line, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div className="ml-4"></div>}
                <div
                  className="w-3 h-3 rounded-full mr-1.5"
                  style={{ backgroundColor: line.color }}
                ></div>
                <div className="text-xs">{line.name}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
