import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="py-8 mb-4 page-header">
      <div className="max-w-[1440px] mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-emerald-700">
          {title}
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
