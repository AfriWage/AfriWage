'use client';

import dynamic from 'next/dynamic';
import RotatingText from '@/components/ui/RotatingText';

const MagicRings = dynamic(() => import('@/components/ui/MagicRings'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%' }} />,
});

export default function HeroVisual() {
  return (
    <div className="hero-visual-container">
      {/* MagicRings background */}
      <div className="hero-rings-wrapper">
        <MagicRings
          color="#14A800"
          colorTwo="#22C55E"
          ringCount={8}
          speed={0.8}
          attenuation={6}
          lineThickness={2.5}
          baseRadius={0.4}
          radiusStep={0.12}
          scaleRate={0.15}
          opacity={0.8}
          blur={0}
          noiseAmount={0.05}
          rotation={0}
          ringGap={1.8}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.15}
          hoverScale={1.1}
          parallax={0.03}
          clickBurst={true}
        />
      </div>

      {/* Centered rotating text overlay */}
      <div className="hero-text-overlay" style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, color: 'white' }}>Instant</span>
        <RotatingText
          texts={['Payroll', 'Settlement', 'Transfers', 'Delivery']}
          mainClassName="text-[clamp(28px,4.5vw,48px)] font-extrabold px-5 sm:px-7 py-1.5 sm:py-2.5 bg-[#14A800] text-white overflow-hidden justify-center rounded-2xl"
          staggerFrom="last"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-120%", opacity: 0 }}
          animatePresenceInitial={false}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2500}
          splitBy="characters"
          auto
          loop
        />
      </div>
    </div>
  );
}
