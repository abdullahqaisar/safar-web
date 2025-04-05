/**
 * Loading component for the routes page
 * Displayed during initial loading and navigation
 */
export default function RoutesLoading() {
  return (
    <div className="min-h-screen pt-16 md:pt-20 flex items-center justify-center bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-sm py-10 px-8 rounded-xl shadow-md border border-gray-200/50 max-w-md w-full text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-t-[color:var(--color-accent)] border-[color:var(--color-accent)]/20 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-[color:var(--color-accent)]/10 rounded-full"></div>
          </div>
        </div>
        <h2 className="text-xl font-medium text-gray-800 mb-3">
          Loading Transit Map
        </h2>
        <p className="text-[color:var(--color-gray-600)] max-w-xs mx-auto">
          Preparing the interactive transit network map for you...
        </p>
      </div>
    </div>
  );
}
