export function Hero() {
  return (
    <section className="bg-[var(--color-bg-light)] pt-20 pb-24 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-left sm:text-center relative z-10 px-4 md:px-0">
        <h1 className="mb-5">
          <span className="text-4xl font-large text-[var(--color-gray-800)] tracking-wide md:text-6xl">
            From Suffer to{' '}
          </span>
          <span
            className="italic text-[var(--color-primary)] font-bold text-6xl md:text-7xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Safar
          </span>
        </h1>
        <p className="text-sm text-[var(--color-gray-600)] font-medium mt-2">
          No delays. No stress. Just smooth travel.
        </p>
      </div>
    </section>
  );
}
