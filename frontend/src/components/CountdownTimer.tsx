'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * Fullscreen countdown ring. `value` is the number to show, or 0 for the
 * "Capture" beat right before the shutter fires. `null` hides it.
 */
export default function CountdownTimer({
  value,
  label,
  accent,
}: {
  value: number | null;
  label: string;
  accent: string;
}) {
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
        >
          <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]" />

          <AnimatePresence mode="popLayout">
            <motion.div
              key={value}
              initial={{ scale: 0.55, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.5, opacity: 0, filter: 'blur(12px)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative grid place-items-center"
            >
              <svg width="220" height="220" viewBox="0 0 220 220" className="absolute -rotate-90">
                <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <motion.circle
                  cx="110"
                  cy="110"
                  r="96"
                  fill="none"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 96}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 96 }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </svg>

              {value > 0 ? (
                <span
                  className="font-display text-[128px] leading-none tabular-nums"
                  style={{ textShadow: `0 20px 60px ${accent}` }}
                >
                  {value}
                </span>
              ) : (
                <span
                  className="px-8 text-center font-display text-5xl uppercase tracking-[0.16em]"
                  style={{ textShadow: `0 20px 60px ${accent}` }}
                >
                  {label}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
