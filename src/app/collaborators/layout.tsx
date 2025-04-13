import { PropsWithChildren } from 'react';

/**
 * Layout wrapper for the collaborators section
 */
export default function CollaboratorsLayout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Any collaborators-specific layout elements could go here */}
      {children}
    </>
  );
}
