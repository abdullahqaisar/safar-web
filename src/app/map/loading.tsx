/**
 * Loading component for the routes page
 * Displayed during initial loading and navigation
 */
export default function RoutesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[color:var(--color-bg-cream)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-[color:var(--color-accent)] border-[color:var(--color-accent)]/30 rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-medium text-gray-800 mb-2">
          Loading Transit Map
        </h2>
        <p className="text-gray-600 max-w-xs mx-auto">
          Preparing the interactive transit network map for you...
        </p>
      </div>
    </div>
  );
}
