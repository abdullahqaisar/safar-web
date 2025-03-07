/**
 * Formats duration from seconds to minutes
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "5 min")
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
};

/**
 * Formats distance in meters
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "500 m")
 */
export const formatDistance = (meters: number): string => {
  return `${Math.ceil(meters)} m`;
};

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
