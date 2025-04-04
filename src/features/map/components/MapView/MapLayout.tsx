import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface PageLayoutProps {
  sidebar?: React.ReactNode;
  content: React.ReactNode;
  showSidebar?: boolean;
  contentClassName?: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Flexible layout component for page content
 * Can be used with or without a sidebar
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  sidebar,
  content,
  showSidebar = true,
  contentClassName,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:gap-6 mx-auto',
        showSidebar && sidebar ? 'md:grid-cols-4' : 'md:grid-cols-1',
        fullWidth ? 'max-w-full' : 'max-w-[1200px]',
        className
      )}
    >
      {/* Sidebar - only shown if provided and showSidebar is true */}
      {showSidebar && sidebar && (
        <div className="hidden md:block md:col-span-1 md:self-start">
          {sidebar}
        </div>
      )}

      {/* Content area - takes full width if no sidebar */}
      <div
        className={cn(
          showSidebar && sidebar ? 'md:col-span-3' : 'md:col-span-full',
          contentClassName
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default PageLayout;
