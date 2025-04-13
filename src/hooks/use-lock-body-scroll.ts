import { useEffect } from 'react';

/**
 * Custom hook to prevent body scrolling when a modal, drawer, or overlay is open
 * @param isLocked Boolean indicating whether to lock the body scroll
 */
export function useLockBodyScroll(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      document.body.classList.remove('menu-open');
      return;
    }

    // Save current scroll position
    const scrollY = window.scrollY;

    // Save current body style
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPosition = originalStyle.position;
    const originalTop = originalStyle.top;
    const originalWidth = originalStyle.width;
    const originalHeight = originalStyle.height;

    // Add class for additional styles
    document.body.classList.add('menu-open');

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Add padding right to prevent layout shift when scrollbar disappears
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // Restore original body style when unmounted
      document.body.classList.remove('menu-open');
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.style.paddingRight = '';

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
