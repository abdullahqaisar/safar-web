import Image from 'next/image';
import React from 'react';

interface NetworkMapPreviewProps {
  imageSrc: string;
  alt?: string;
}

export const NetworkMapPreview = ({
  imageSrc,
  alt = 'Network Map',
}: NetworkMapPreviewProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-[color:var(--color-accent)]/20 rounded-3xl -rotate-6 transform-gpu"></div>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 mr-4"></div>
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
      </div>
    </div>
  );
};
