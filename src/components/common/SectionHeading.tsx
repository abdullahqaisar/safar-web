interface SectionHeadingProps {
  tag: string;
  title: string;
  description: string;
}

export function SectionHeading({
  tag,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="text-center mb-12">
      <span className="inline-block text-[color:var(--color-accent)] font-semibold text-sm uppercase tracking-wider bg-[color:var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
        {tag}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
        {title}
      </h2>
      <div className="w-16 h-1 bg-[color:var(--color-accent)] mx-auto mb-6 rounded-full"></div>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">{description}</p>
    </div>
  );
}
