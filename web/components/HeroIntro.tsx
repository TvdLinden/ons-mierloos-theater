'use client';

import { useEffect, useState } from 'react';

type HeroIntroProps = {
  introText?: string | null;
};

export default function HeroIntro({ introText }: HeroIntroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!introText) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 pointer-events-none z-20 pt-8 md:pt-12 px-4 md:px-8"
      data-section="hero-intro"
      style={{
        animation: isVisible ? 'fadeInSlide 0.9s ease-out forwards' : 'none',
      }}
    >
      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto" data-element="content">
        <div className="hidden md:flex items-start gap-3 backdrop-blur-md bg-accent/15 border border-primary/30 rounded-xl p-5 shadow-lg">
          {/* Accent bar */}
          <div className="flex-shrink-0">
            <div
              className="w-1 h-16 bg-gradient-to-b from-primary to-primary/30 rounded-full"
              data-element="accent-bar"
            ></div>
          </div>

          {/* Text content */}
          <p className="text-lg lg:text-xl font-bold text-primary/90 leading-snug tracking-tight">
            {introText}
          </p>
        </div>

        {/* Mobile version - minimal */}
        <div className="md:hidden flex gap-2 backdrop-blur-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
          <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full flex-shrink-0"></div>
          <p className="text-xs font-bold text-primary/80 leading-snug">{introText}</p>
        </div>
      </div>
    </div>
  );
}
