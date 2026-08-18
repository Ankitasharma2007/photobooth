'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Aperture, ArrowRight, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBooth } from '@/services/store';
import { THEMES } from '@/utils/design';
import { LANGS, translate } from '@/utils/i18n';
import type { LayoutId } from '@/utils/types';
import { GlowButton, cx } from './ui';
import { AcmLogo } from './AcmLogo';

interface LayoutSlide {
  id: LayoutId;
  label: string;
  title: string;
  subtitle: string;
  badge: string;
  count: number;
}

const LAYOUT_SLIDES: LayoutSlide[] = [
  {
    id: 'strip4',
    label: '4 Photos',
    title: 'FOUR MOMENTS. ONE MEMORY.',
    subtitle: 'The classic ACM photo-booth experience.',
    badge: '4 PHOTOS',
    count: 4,
  },
  {
    id: 'single',
    label: '1 Photo',
    title: 'ONE PERFECT MOMENT.',
    subtitle: 'One portrait. Maximum impact.',
    badge: '1 PHOTO',
    count: 1,
  },
  {
    id: 'grid4',
    label: 'Frame',
    title: 'MAKE IT YOUR FRAME.',
    subtitle: "Your photo wrapped in the event's signature frame.",
    badge: 'FRAME',
    count: 4,
  },
];

export default function WelcomeScreen() {
  const { lang, theme, design, patchDesign, setLang, go } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  // Initialize active index from store's canonical design.layout
  const initialIdx = Math.max(
    0,
    LAYOUT_SLIDES.findIndex((s) => s.id === design.layout),
  );

  const [selectedIdx, setSelectedIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [frontIdx, setFrontIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [flash, setFlash] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Angle tracking in radians for continuous 3D orbit
  const angleRef = useRef(-((initialIdx >= 0 ? initialIdx : 0) * (Math.PI / 2)));
  const velocityRef = useRef(0.0025);
  const targetVelRef = useRef(0.0025);
  const isHoveredRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Card hover tilt state (mapped by slide id)
  const [hoverTilts, setHoverTilts] = useState<Record<string, { rx: number; ry: number }>>({});

  // Force component re-render on rAF frame update
  const [, setFrameTick] = useState(0);

  // Continuous 3D Revolving rAF Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      // Lerp velocity towards target velocity
      velocityRef.current += (targetVelRef.current - velocityRef.current) * 0.06;
      angleRef.current += velocityRef.current;

      // Calculate which card is currently closest to the front (angle = 0 mod 2pi)
      const normalized = ((-angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const currentFront = Math.round(normalized / (Math.PI / 2)) % LAYOUT_SLIDES.length;
      
      setFrontIdx(currentFront);
      setFrameTick((n) => (n + 1) % 10000);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ONE-TAP LAUNCHER: Tapping ANY card immediately sets canonical layout & opens camera!
  const launchSessionWithLayout = useCallback(
    (layoutId: LayoutId, idx?: number) => {
      if (idx !== undefined) {
        setSelectedIdx(idx);
        angleRef.current = -(idx * (Math.PI / 2));
      }
      patchDesign({ layout: layoutId });
      useBooth.setState({ photos: [], activePhotoId: null });

      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        go('capture');
      }, 100);
    },
    [patchDesign, go],
  );

  const handleDefaultStart = () => {
    launchSessionWithLayout(design.layout || 'strip4');
  };

  // Pointer movement over gallery controls orbit velocity & direction
  const handleGalleryMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    isHoveredRef.current = true;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const normX = (x - 0.5) * 2; // -1 to 1

    targetVelRef.current = normX * 0.012;

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        targetVelRef.current = 0.0025; // Resume slow autoplay
      }
    }, 1500);
  };

  const handleGalleryMouseLeave = () => {
    isHoveredRef.current = false;
    targetVelRef.current = 0.0025;
    setHoverTilts({});
  };

  // Layer 2: Card 3D hover tilt
  const handleCardMouseMove = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    setHoverTilts((prev) => ({
      ...prev,
      [id]: {
        rx: -py * 8, // rotateX ±4deg
        ry: px * 10,  // rotateY ±5deg
      },
    }));
  };

  const handleCardMouseLeave = (id: string) => {
    setHoverTilts((prev) => ({
      ...prev,
      [id]: { rx: 0, ry: 0 },
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const nextIdx = (selectedIdx + 1) % LAYOUT_SLIDES.length;
        setSelectedIdx(nextIdx);
        angleRef.current = -(nextIdx * (Math.PI / 2));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prevIdx = (selectedIdx - 1 + LAYOUT_SLIDES.length) % LAYOUT_SLIDES.length;
        setSelectedIdx(prevIdx);
        angleRef.current = -(prevIdx * (Math.PI / 2));
      } else if (e.key === 'Enter') {
        launchSessionWithLayout(LAYOUT_SLIDES[selectedIdx].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, launchSessionWithLayout]);

  // Mouse wheel navigation
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeoutRef.current) return;
    if (Math.abs(e.deltaY) > 25 || Math.abs(e.deltaX) > 25) {
      const step = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
      const nextIdx = (selectedIdx + step + LAYOUT_SLIDES.length) % LAYOUT_SLIDES.length;
      setSelectedIdx(nextIdx);
      angleRef.current = -(nextIdx * (Math.PI / 2));

      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 400);
    }
  };

  const activeLang = LANGS.find((l) => l.id === lang) || LANGS[0];
  const selectedSlide = LAYOUT_SLIDES[selectedIdx];

  return (
    <div
      onWheel={handleWheel}
      className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#F4F1EC] bg-[linear-gradient(180deg,#F9F8F6_0%,#F4F1EC_50%,#E9E5DE_100%)] select-none text-[#252320] pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      {/* CAMERA FLASH BLOOM MICRO-EFFECT */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>

      {/* SW 7015 PALE OAK AMBIENT TECHNICAL GLOW BEHIND CAROUSEL */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2F7898]/06 blur-[140px]" />

      {/* TOP FLOATING NAVBAR */}
      <header className="relative z-40 flex h-16 sm:h-20 shrink-0 items-center justify-between px-6 sm:px-10 lg:px-14">
        <AcmLogo />

        {/* Center shortcuts */}
        <nav className="hidden items-center gap-8 md:flex">
          <span className="text-xs font-bold tracking-[0.2em] text-[#252320] uppercase border-b-2 border-[#2F7898] pb-0.5">
            HOME
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#6B665E] uppercase hover:text-[#2F7898] transition-colors cursor-pointer">
            EXPERIENCE
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#6B665E] uppercase hover:text-[#2F7898] transition-colors cursor-pointer">
            LAYOUTS
          </span>
        </nav>

        {/* Right CTA & Lang */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-[#D6D0C5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#252320] transition-all hover:bg-[#E5E0D8] hover:shadow-subtle"
            >
              <Globe size={13} className="text-[#2F7898]" />
              <span>{activeLang.short}</span>
              <ChevronDown size={12} className={cx('transition-transform duration-200', langMenuOpen ? 'rotate-180' : '')} />
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 min-w-[130px] overflow-hidden rounded-2xl border border-[#DCE3E6] bg-white p-1.5 shadow-glass"
                >
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLang(l.id);
                        setLangMenuOpen(false);
                      }}
                      className={cx(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all',
                        lang === l.id
                          ? 'bg-[#347A9A] text-white shadow-sm font-bold'
                          : 'text-[#18232B] hover:bg-[#F2F5F6]',
                      )}
                    >
                      <span>{l.label}</span>
                      <span className="text-[10px] opacity-60">{l.short}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <GlowButton size="sm" accent="#347A9A" onClick={handleDefaultStart} className="font-bold tracking-wide">
            <span>START BOOTH</span>
            <ArrowRight size={14} />
          </GlowButton>
        </div>
      </header>

      {/* TOP HERO HEADLINE BLOCK (NO EXTRA CTA BUTTON) */}
      <div className="relative z-30 flex shrink-0 flex-col items-center justify-center pt-2 sm:pt-4 text-center px-4">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[#252320] sm:text-3xl lg:text-4xl">
          {selectedSlide.title}
        </h1>
        <p className="mt-1.5 max-w-[42ch] text-xs font-semibold leading-relaxed text-[#6B665E] sm:text-sm">
          {selectedSlide.subtitle}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D6D0C5] bg-white px-3.5 py-1 text-[11px] font-bold text-[#2F7898] shadow-subtle">
          <span>✦ Tap any photo strip below to start session</span>
        </div>
      </div>

      {/* 3D REVOLVING COVERFLOW CAROUSEL (ONE-TAP SESSION LAUNCHER) */}
      <main
        onMouseMove={handleGalleryMouseMove}
        onMouseLeave={handleGalleryMouseLeave}
        className="relative z-20 flex flex-1 items-center justify-center overflow-hidden my-2 sm:my-4"
      >
        {/* Navigation Chevrons */}
        <button
          type="button"
          onClick={() => {
            const prevIdx = (selectedIdx - 1 + LAYOUT_SLIDES.length) % LAYOUT_SLIDES.length;
            setSelectedIdx(prevIdx);
            angleRef.current = -(prevIdx * (Math.PI / 2));
          }}
          aria-label="Previous layout"
          className="absolute left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-[#D6D0C5] bg-white text-[#252320] transition-all duration-200 hover:scale-105 hover:bg-[#E5E0D8] shadow-subtle"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          onClick={() => {
            const nextIdx = (selectedIdx + 1) % LAYOUT_SLIDES.length;
            setSelectedIdx(nextIdx);
            angleRef.current = -(nextIdx * (Math.PI / 2));
          }}
          aria-label="Next layout"
          className="absolute right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-[#D6D0C5] bg-white text-[#252320] transition-all duration-200 hover:scale-105 hover:bg-[#E5E0D8] shadow-subtle"
        >
          <ChevronRight size={22} />
        </button>

        {/* 3D Circular Orbit Track Wrapper */}
        <div
          className="relative flex h-[400px] w-full max-w-[1200px] items-center justify-center sm:h-[460px] lg:h-[510px]"
          style={{ perspective: '1200px' }}
        >
          {LAYOUT_SLIDES.map((slide, i) => {
            const theta = i * (Math.PI / 2) + angleRef.current;
            const sin = Math.sin(theta);
            const cos = Math.cos(theta);

            // Desktop vs Mobile radius
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
            const radiusX = isMobile ? 115 : 260;
            const radiusZ = isMobile ? 80 : 140;

            const posX = sin * radiusX;
            const posZ = (cos - 1) * radiusZ;
            const rotY = sin * 22; // subtle 3D angle

            const scale = 0.72 + 0.28 * ((cos + 1) / 2);
            const opacity = 0.40 + 0.60 * ((cos + 1) / 2);
            const zIndex = Math.round(100 + 100 * cos);

            const isSelected = selectedIdx === i;
            const tilt = hoverTilts[slide.id] || { rx: 0, ry: 0 };

            return (
              /* Layer 1: Orbit Position Wrapper */
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  transform: `translate3d(${posX}px, 0, ${posZ}px) rotateY(${rotY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.1s ease-out, opacity 0.2s ease-out',
                }}
              >
                {/* Layer 2: Card 3D Hover Tilt Wrapper */}
                <div
                  onMouseMove={(e) => handleCardMouseMove(slide.id, e)}
                  onMouseLeave={() => handleCardMouseLeave(slide.id)}
                  onClick={() => launchSessionWithLayout(slide.id, i)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${tilt.rx !== 0 ? 16 : 0}px)`,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className={cx(
                    'h-[360px] w-[72vw] max-w-[310px] cursor-pointer overflow-hidden rounded-[20px] border p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 sm:h-[440px] sm:w-[300px] lg:h-[480px] lg:w-[320px]',
                    isSelected
                      ? 'border-[#2F7898] ring-4 ring-[#2F7898]/20 shadow-glass'
                      : 'border-[#E1E8EC] hover:border-[#2F7898]/50 shadow-subtle',
                  )}
                >
                  {/* REALISTIC PHYSICAL PHOTO PRINT STRIP MOCKUP */}
                  <div className="relative flex h-full w-full flex-col justify-between text-[#18232B]">
                    {/* Badge */}
                    <div className="absolute top-1 right-1 z-30 flex items-center gap-1 rounded-full border border-[#E1E8EC] bg-[#EBF3F6] px-2.5 py-0.5 text-[9.5px] font-bold tracking-wider text-[#2F7898]">
                      {slide.badge}
                    </div>

                    {/* Coherent Frame Stack */}
                    <div className={cx(
                      'mt-7 grid gap-2 flex-1 items-center',
                      slide.id === 'grid4' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1',
                    )}>
                      {Array.from({ length: slide.count }).map((_, pIdx) => (
                        <div
                          key={pIdx}
                          className={cx(
                            'relative flex flex-col items-center justify-center overflow-hidden rounded-[12px] border border-[#E1E8EC] bg-[#F7F9FA] text-[#18232B] shadow-inner',
                            slide.id === 'grid4' ? 'aspect-square' : slide.id === 'single' ? 'h-full aspect-[4/5]' : 'aspect-[4/3]',
                          )}
                        >
                          <Camera size={20} className="text-[#2F7898] opacity-85 mb-1" />
                          <span className="text-[11px] font-bold text-[#18232B]">Frame {pIdx + 1}</span>
                          {slide.id === 'grid4' && (
                            <div className="pointer-events-none absolute inset-1 rounded-lg border border-dashed border-[#CCD5D9]" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Paper Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#E1E8EC] pt-2 text-[#18232B]">
                      <div>
                        <p className="font-sans text-xs font-bold tracking-widest uppercase text-[#18232B]">
                          {slide.label}
                        </p>
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#66747D]">ACM PHOTO BOOTH</p>
                      </div>
                      <span className="font-mono text-[9.5px] font-bold text-[#66747D]">
                        2026.08
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* BOTTOM FOOTER: PAGINATION DOTS & COUNTER ONLY */}
      <footer className="relative z-40 flex h-10 shrink-0 items-center justify-between px-6 sm:px-10 lg:px-14">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {LAYOUT_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedIdx(idx);
                angleRef.current = -(idx * (Math.PI / 2));
              }}
              aria-label={`Select ${s.label}`}
              className={cx(
                'h-2 rounded-full transition-all duration-300',
                idx === selectedIdx
                  ? 'w-8 bg-[#347A9A] shadow-subtle'
                  : 'w-2 bg-[#DCE3E6] hover:bg-[#347A9A]/50',
              )}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="font-mono text-xs font-semibold tracking-widest text-[#66747D]">
          0{selectedIdx + 1} / 0{LAYOUT_SLIDES.length}
        </div>
      </footer>
    </div>
  );
}
