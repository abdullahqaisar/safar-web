import { useEffect } from 'react';

/**
 * Custom hook to prevent body scrolling when a modal, drawer, or overlay is open
 * @param isLocked Boolean indicating whether to lock the body scroll
 */
export function useLockBodyScroll(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    // Save current body style
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Add padding right to prevent layout shift when scrollbar disappears
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // Restore original body style when unmounted
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = '';
    };
  }, [isLocked]);
}
