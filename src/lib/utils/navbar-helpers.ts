/**
 * Determines the appropriate background color/style for the navbar
 * based on the current pathname and scroll position
 */
export function getNavbarBackground(
  pathname: string,
  isScrolled: boolean,
  isMobile: boolean = false
): string {
  // When scrolled down, always use a solid background with shadow
  if (isScrolled) {
    return 'bg-white/85 shadow-sm backdrop-blur-md';
  }

  // Special case for mobile menu when open
  if (isMobile) {
    return 'bg-white/95 shadow-sm backdrop-blur-md';
  }

  // All pages now use the same background at the top
  return 'bg-from-[color:var(--color-accent)]/5 backdrop-blur-sm';
}
