import React from 'react';

interface MapLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

const MapLayout: React.FC<MapLayoutProps> = ({ sidebar, content }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 max-w-[1440px] mx-auto">
      {/* Left sidebar */}
      <div className="hidden md:block md:col-span-1 md:self-start">
        {sidebar}
      </div>

      {/* Content area */}
      <div className="md:col-span-3">{content}</div>
    </div>
  );
};

export default MapLayout;
