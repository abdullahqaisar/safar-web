import { PropsWithChildren } from 'react';

/**
 * Layout wrapper for the routes section
 */
export default function RoutesLayout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Any routes-specific layout elements could go here */}
      {children}
    </>
  );
}
