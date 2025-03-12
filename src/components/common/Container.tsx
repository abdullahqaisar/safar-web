import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
}

export function Container({
  children,
  className = '',
  maxWidth = '6xl',
}: ContainerProps) {
  return (
    <div
      className={`container mx-auto px-4 ${
        maxWidth ? `max-w-${maxWidth}` : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
