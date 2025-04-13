import { useEffect, RefObject } from 'react';

/**
 * Hook that detects clicks outside of the specified element
 * @param ref Reference to the element to detect clicks outside of
 * @param handler Function to call when a click outside is detected
 * @param excludeRefs Optional array of refs to exclude from outside click detection
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  excludeRef?: RefObject<HTMLElement> | RefObject<HTMLElement>[]
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Do nothing if clicking ref's element or excludeRef's element
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // Handle exclude refs
      if (excludeRef) {
        if (Array.isArray(excludeRef)) {
          for (const exRef of excludeRef) {
            if (exRef.current && exRef.current.contains(target)) {
              return;
            }
          }
        } else if (excludeRef.current && excludeRef.current.contains(target)) {
          return;
        }
      }

      handler(event);
    };

    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, excludeRef]);
}
