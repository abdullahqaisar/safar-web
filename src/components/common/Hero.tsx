import { TopographyPattern } from '../ui/TopographyPattern';

export function Hero() {
  return (
    <section className="bg-[var(--color-bg-light)] pt-20 pb-24 relative overflow-hidden">
      {/* Topographic pattern background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <TopographyPattern
          color="var(--color-primary)"
          opacity={0.05}
          className="w-full h-full transform scale-150"
        />
      </div>

      <div className="max-w-3xl mx-auto text-left sm:text-center relative z-10 px-4 md:px-0">
        <div className="text-left sm:text-center mb-2 sm:mb-2">
          <span className="hero-badge" aria-label="Tagline">
            Public Transportation Made Easy
          </span>
        </div>
        <h1 className="hero-title text-left sm:text-center">
          <div className="flex flex-wrap sm:justify-center items-baseline gap-x-2">
            <span className="hero-title-main">From Suffer to</span>
            <span className="hero-title-accent">Safar</span>
          </div>
        </h1>

        <p className="hero-subtitle text-left sm:text-center mt-3 sm:mt-5 sm:mb-4">
          Find the fastest metro routes optimized for your journey
        </p>
      </div>
    </section>
  );
}
