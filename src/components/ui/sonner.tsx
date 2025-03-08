'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { useEffect, useState } from 'react';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const [position, setPosition] = useState<'top-center' | 'bottom-center'>(
    'bottom-center'
  );

  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth < 768 ? 'bottom-center' : 'top-center');
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position={position}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-[var(--color-accent)] group-[.toast]:text-white group-[.toast]:hover:bg-[var(--color-accent-dark)] group-[.toast]:rounded-md group-[.toast]:transition-colors group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:hover:bg-gray-200 group-[.toast]:transition-colors group-[.toast]:font-medium',
          error:
            'group-[.toaster]:bg-destructive/15 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/20 error-toast',
          success:
            'group-[.toaster]:bg-emerald-500/15 group-[.toaster]:text-emerald-600 group-[.toaster]:border-emerald-500/20 success-toast',
          info: 'group-[.toaster]:bg-blue-500/15 group-[.toaster]:text-blue-600 group-[.toaster]:border-blue-500/20 info-toast',
          warning:
            'group-[.toaster]:bg-amber-500/15 group-[.toaster]:text-amber-600 group-[.toaster]:border-amber-500/20',
          default:
            'group-[.toaster]:bg-[#effcf4] group-[.toaster]:text-[var(--color-primary-dark)] group-[.toaster]:border-[var(--color-primary)]/10',
          loading:
            'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border',
          closeButton:
            'group-[.toast]:text-foreground/50 group-[.toast]:hover:text-foreground/80 group-[.toast]:transition-colors',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
