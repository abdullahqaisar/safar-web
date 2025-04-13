import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface PageHeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  showBackButton = false,
  onBackClick,
  actions,
  className = '',
}) => {
  return (
    <header className={`py-8 mb-4 page-header ${className}`} role="banner">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center mb-2 justify-between">
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 mr-2"
                onClick={onBackClick}
                leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                aria-label="Go back"
              >
                Back
              </Button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">
              {title}
            </h1>
          </div>
          {actions && <div className="flex items-center">{actions}</div>}
        </div>
        {description && (
          <p className="text-sm md:text-base text-gray-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
