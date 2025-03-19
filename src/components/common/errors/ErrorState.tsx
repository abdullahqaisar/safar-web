import React, { ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { AppError } from '@/lib/errors/AppError';
import { Button } from '../Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  error?: AppError | Error;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

/**
 * A reusable error state component for displaying error messages
 * with consistent styling and appropriate actions
 */
export function ErrorState({
  title,
  message,
  code,
  icon,
  primaryAction,
  secondaryAction,
  error,
  className = '',
  variant = 'default',
}: ErrorStateProps) {
  // If an error object is provided, use its properties unless overridden
  const displayTitle =
    title || (error instanceof AppError ? error.code : 'Error');
  const displayMessage =
    message || (error ? error.message : 'An error occurred');
  const displayCode =
    code || (error instanceof AppError ? error.code : undefined);

  // For inline/compact variants
  if (variant === 'compact' || variant === 'inline') {
    const isInline = variant === 'inline';
    return (
      <div
        className={`flex ${
          isInline ? 'flex-row items-center' : 'flex-col'
        } gap-3 ${className}`}
      >
        {icon && <div className="text-red-500 flex-shrink-0">{icon}</div>}
        {!icon && (
          <i className="fas fa-exclamation-circle text-red-500 text-lg flex-shrink-0" />
        )}

        <div className={`${isInline ? '' : 'mt-1'}`}>
          {title && (
            <div className="font-medium text-gray-900">{displayTitle}</div>
          )}
          <div className={`text-sm text-red-600 ${title && 'mt-0.5'}`}>
            {displayMessage}
          </div>
        </div>

        {primaryAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={primaryAction.onClick}
            className="ml-auto"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}
      </div>
    );
  }

  // For default full variant, use the ErrorDisplay component
  return (
    <ErrorDisplay
      error={error || ({ message: displayMessage, code: displayCode } as any)}
      title={title}
      description={message}
      action={
        <>
          {primaryAction && (
            <Button
              variant="primary"
              onClick={primaryAction.onClick}
              size="sm"
              className="mr-2"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
              size="sm"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
        </>
      }
    />
  );
}
