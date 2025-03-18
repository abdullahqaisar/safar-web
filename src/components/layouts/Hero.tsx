import { ReactNode } from 'react';
import { TopographyPattern } from '../common/TopographyPattern';

interface HeroProps {
  badgeText?: string;
  title: string | ReactNode;
  accentTitle?: string;
  subtitle: string;
  paddingTop?: string;
  paddingBottom?: string;
}

export function Hero({
  badgeText = 'Public Transportation Made Easy',
  title = 'From Suffer to',
  accentTitle = 'Safar',
  subtitle = 'Find the fastest metro routes optimized for your journey and enjoy a stress-free commute with our smart navigation system.',
  paddingTop = 'pt-20',
  paddingBottom = 'pb-24',
}: HeroProps) {
  return (
    <section
      className={`bg-[var(--color-bg-light)] ${paddingTop} ${paddingBottom} relative overflow-hidden`}
    >
      {/* Topographic pattern background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <TopographyPattern
          color="var(--color-primary)"
          opacity={0.05}
          className="w-full h-full transform scale-150"
        />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10 px-4 md:px-0">
        {badgeText && (
          <div className="text-center mb-2 sm:mb-2">
            <span className="hero-badge" aria-label="Tagline">
              {badgeText}
            </span>
          </div>
        )}

        <h1 className="hero-title text-center">
          {typeof title === 'string' && accentTitle ? (
            <div className="flex flex-wrap justify-center items-baseline gap-x-2">
              <span className="hero-title-main">{title}</span>
              <span className="hero-title-accent">{accentTitle}</span>
            </div>
          ) : (
            title
          )}
        </h1>

        <p className="hero-subtitle text-center mt-3 sm:mt-5 sm:mb-4 mx-auto">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
