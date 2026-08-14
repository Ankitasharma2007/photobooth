'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CameraOff,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useShutter } from '@/hooks/useShutter';
import { slotsFor, useBooth } from '@/services/store';
import { filterString } from '@/utils/canvas';
import { DEFAULT_FILTERS, FILTER_PRESETS } from '@/utils/design';
import type { Filters } from '@/utils/types';
import CountdownTimer from './CountdownTimer';
import PhotoCapture from './PhotoCapture';
import { GlowButton, Spinner, cx } from './ui';
import { AcmLogo } from './AcmLogo';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CameraModule() {
  const { lang, design, photos, addPhoto, removePhoto, patchDesign, go } = useBooth();
  const slots = slotsFor(design);
  const remaining = Math.max(0, slots - photos.length);

  const cam = useCamera(true);
  const { shutter, beep, prime } = useShutter();

  const [timer, setTimer] = useState(3);
  const [mirror, setMirror] = useState(true);
  const [grid, setGrid] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [preset, setPreset] = useState('original');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const shoot = useCallback(() => {
    const video = cam.videoRef.current;
    if (!video || !video.videoWidth) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    addPhoto(canvas.toDataURL('image/jpeg', 0.92), w, h, filters);
    shutter();
    setFlash(true);
    setTimeout(() => alive.current && setFlash(false), 260);
  }, [addPhoto, cam.videoRef, filters, mirror, shutter]);

  const runCapture = useCallback(async () => {
    if (busy.current || cam.status !== 'ready') return;
    if (photosRef.current.length >= slotsRef.current) {
      go('final');
      return;
    }
    busy.current = true;
    prime();
    try {
      while (alive.current && photosRef.current.length < slotsRef.current) {
        for (let i = timer; i > 0; i--) {
          if (!alive.current) return;
          setCountdown(i);
          beep(i === 1 ? 1180 : 720, 0.1, 0.05);
          await wait(1000);
        }
        if (!alive.current) return;
        setCountdown(0);
        beep(1560, 0.16, 0.07);
        await wait(430);
        if (!alive.current) return;
        setCountdown(null);
        shoot();
        await wait(600);
      }
      if (alive.current && photosRef.current.length >= slotsRef.current) {
        await wait(400);
        go('final');
      }
    } finally {
      busy.current = false;
    }
  }, [beep, cam.status, prime, shoot, timer, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        void runCapture();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runCapture]);

  const applyPreset = (id: string) => {
    const p = FILTER_PRESETS.find((f) => f.id === id);
    if (!p) return;
    setPreset(id);
    setFilters({ ...p.filters });
  };

  const handleFilterChange = (patch: Partial<Filters>) => {
    setPreset('custom');
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const currentPhotoIndex = Math.min(photos.length + 1, slots);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="relative z-10 flex min-h-[100dvh] flex-col justify-between gap-3 p-4 sm:p-6 max-w-5xl mx-auto"
    >
      {/* HEADER */}
      <header className="flex items-center justify-between gap-4 border-b border-[#D5E0E4] pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go('welcome')}
            className="icon-btn"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <AcmLogo className="h-7 w-auto" />
        </div>

        {/* Center Capture Progress Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#D5E0E4] bg-[#E3F0F5] px-3.5 py-1 shadow-subtle">
          <span className="h-2 w-2 rounded-full bg-[#2F7898]" />
          <span className="text-xs font-bold text-[#17242B]">
            Photo {photos.length >= slots ? slots : currentPhotoIndex} of {slots}
          </span>
        </div>

        <GlowButton
          disabled={photos.length === 0}
          onClick={() => go('final')}
          className="font-semibold text-xs sm:text-sm"
        >
          <span>Continue</span>
          <ArrowRight size={14} />
        </GlowButton>
      </header>

      {/* MAIN CAMERA CONTAINER */}
      <main className="flex flex-1 flex-col items-center justify-center gap-3 w-full my-auto">
        {/* LIVE CAMERA PREVIEW WITH NEUTRAL BORDER */}
        <div className="relative w-full max-w-2xl aspect-[4/3] overflow-hidden rounded-[16px] border border-[#D5E0E4] bg-[#202C33] shadow-subtle">
          <video
            ref={cam.videoRef}
            playsInline
            muted
            autoPlay
            className={cx(
              'h-full w-full object-cover transition-opacity duration-300',
              cam.status === 'ready' ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              transform: mirror ? 'scaleX(-1)' : undefined,
              filter: filterString(filters),
            }}
          />

          {/* Clean Light Progress Counter Overlay */}
          {cam.status === 'ready' && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-[#D5E0E4] bg-[#E3F0F5] px-3 py-1 text-xs font-bold text-[#17242B] shadow-subtle">
              <span className="h-2 w-2 rounded-full bg-[#2F7898]" />
              <span>Photo {photos.length >= slots ? slots : currentPhotoIndex} of {slots}</span>
            </div>
          )}

          {/* Grid Overlay */}
          {grid && cam.status === 'ready' && (
            <div className="pointer-events-none absolute inset-0">
              {[1, 2].map((i) => (
                <span key={`v${i}`} className="absolute top-0 h-full w-px bg-white/20" style={{ left: `${(i * 100) / 3}%` }} />
              ))}
              {[1, 2].map((i) => (
                <span key={`h${i}`} className="absolute left-0 h-px w-full bg-white/20" style={{ top: `${(i * 100) / 3}%` }} />
              ))}
            </div>
          )}

          {/* Countdown Timer */}
          <CountdownTimer value={countdown} label="GET READY" accent="#2F7898" />

          {/* Flash Effect */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 z-40 bg-white"
              />
            )}
          </AnimatePresence>

          {/* Camera Permission / Error State */}
          <CameraState status={cam.status} error={cam.error} onRetry={cam.start} />
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="w-full max-w-2xl">
          <PhotoCapture
            accent="#2F7898"
            disabled={cam.status !== 'ready' || remaining === 0}
            busy={countdown !== null}
            remaining={remaining}
            totalSlots={slots}
            photosCount={photos.length}
            timer={timer}
            onTimer={setTimer}
            mirror={mirror}
            onMirror={setMirror}
            grid={grid}
            onGrid={setGrid}
            filters={filters}
            onFiltersChange={handleFilterChange}
            activePreset={preset}
            onSelectPreset={applyPreset}
            lastPhotoSrc={photos[photos.length - 1]?.src}
            layout={design.layout}
            onLayoutChange={(l) => patchDesign({ layout: l })}
            onCapture={() => void runCapture()}
          />
        </div>

        {/* COMPACT CAPTURED THUMBNAIL RAIL */}
        {photos.length > 0 && (
          <div className="flex items-center gap-3 w-full max-w-2xl rounded-[12px] border border-[#D5E0E4] bg-white p-2.5 shadow-subtle">
            <span className="text-xs font-semibold text-[#65747C] shrink-0">Captured:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <AnimatePresence initial={false}>
                {photos.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group relative aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-[8px] border border-[#D5E0E4] bg-[#EEF3F5]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover drag-none"
                      style={{ filter: filterString(p.filters) }}
                    />
                    <span className="absolute left-1 top-1 grid h-3.5 w-3.5 place-items-center rounded bg-black/60 text-[8.5px] font-bold text-white backdrop-blur">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-subtle"
                    >
                      <Trash2 size={10} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="flex items-center justify-between text-[11px] font-medium text-[#65747C] border-t border-[#D5E0E4] pt-2">
        <span>ACM Event Photo Booth</span>
        <span>Press Spacebar to shoot</span>
      </footer>
    </motion.div>
  );
}

/* ---------------- SHARED HEADER COMPONENT ---------------- */
export function Header({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[#D5E0E4] pb-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="icon-btn" aria-label={backLabel}>
            <ArrowLeft size={16} />
          </button>
        )}
        <AcmLogo className="h-7 w-auto" />
      </div>
      {right}
    </header>
  );
}

/* ---------------- CAMERA PERMISSION & ERROR STATE ---------------- */
function CameraState({
  status,
  error,
  onRetry,
}: {
  status: string;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === 'ready') return null;

  return (
    <div className="absolute inset-0 grid place-items-center bg-[#F7F8F8] p-6 text-center z-30">
      {status === 'requesting' || status === 'idle' ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-6 w-6 text-[#2F7898]" />
          <div>
            <h3 className="text-sm font-bold text-[#17242B]">Camera access needed</h3>
            <p className="mt-1 text-xs text-[#65747C] max-w-[32ch] leading-relaxed">
              Allow camera access to start your photo session.
            </p>
          </div>
        </div>
      ) : status === 'denied' ? (
        <div className="flex flex-col items-center gap-3 max-w-sm">
          {/* Soft Blue Circle + ACM-Blue Camera Off Icon */}
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E3F0F5] text-[#2F7898]">
            <CameraOff size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17242B]">Camera access needed</h3>
            <p className="mt-1 text-xs text-[#65747C]">
              Allow camera access to start your photo session.
            </p>
          </div>

          {/* Clean Light Instruction Card */}
          <div className="w-full text-left rounded-[12px] border border-[#D5E0E4] bg-[#EEF3F5] p-3 space-y-1.5 shadow-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17242B]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2F7898] text-[10px] font-bold text-white">1</span>
              <span>Open site settings in your browser</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17242B]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2F7898] text-[10px] font-bold text-white">2</span>
              <span>Set Camera to Allow</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17242B]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2F7898] text-[10px] font-bold text-white">3</span>
              <span>Click Try again below</span>
            </div>
          </div>

          <GlowButton onClick={onRetry} size="sm" className="mt-1 font-semibold">
            <RefreshCw size={13} />
            <span>Try again</span>
          </GlowButton>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 max-w-sm">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E3F0F5] text-[#2F7898]">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17242B]">{error || 'Camera unavailable'}</h3>
            <p className="mt-1 text-xs text-[#65747C]">
              Ensure your camera is connected and not in use by another app.
            </p>
          </div>
          <GlowButton onClick={onRetry} size="sm" className="mt-1 font-semibold">
            <RefreshCw size={13} />
            <span>Try again</span>
          </GlowButton>
        </div>
      )}
    </div>
  );
}
