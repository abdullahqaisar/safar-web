import { cn } from '@/lib/utils/formatters';
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean | null;
  children: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#00a745] hover:bg-[#0a8f42] active:bg-[#097a39] text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white',
    outline:
      'bg-transparent border border-[#00a745] text-[#00a745] hover:bg-[#e6f7ee]',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800',
  };

  const sizes = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2.5 px-4 text-base',
    lg: 'py-4 px-6 text-lg',
  };

  const isDisabled = Boolean(disabled) || isLoading;

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition duration-200',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-70 cursor-not-allowed' : '',
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="animate-spin mr-2" size={16} />
          {children}
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
}
