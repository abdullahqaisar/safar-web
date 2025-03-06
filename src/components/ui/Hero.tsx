export function Hero() {
  return (
    <section className="bg-[#effcf4] py-22 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-left md:text-center relative z-10 px-4 md:px-0">
        <h1 className="mb-5">
          <span className="text-4xl font-large text-gray-700 tracking-wide md:text-6xl">
            From Suffer to{' '}
          </span>
          <span
            className="italic text-[#0d442b] font-bold text-6xl md:text-7xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Safar
          </span>
        </h1>
        <p className="text-sm text-gray-700 font-small">
          No delays. No stress. Just smooth travel.
        </p>
      </div>
    </section>
  );
}
