'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  FlipHorizontal,
  Grid3x3,
  Sliders,
  SlidersHorizontal,
  Timer as TimerIcon,
} from 'lucide-react';
import { useState } from 'react';
import { FILTER_PRESETS } from '@/utils/design';
import type { Filters, LayoutId } from '@/utils/types';
import { Slider, cx } from './ui';

const LAYOUT_NAMES: Record<LayoutId, string> = {
  strip4: '4 Photos',
  strip3: '2 Photos',
  grid4: 'Frame',
  single: '1 Photo',
};

const MAIN_FILTERS = FILTER_PRESETS.slice(0, 6);
const EXTRA_FILTERS = FILTER_PRESETS.slice(6);

export default function PhotoCapture({
  accent = '#2F7898',
  disabled,
  busy,
  remaining,
  totalSlots,
  photosCount,
  timer,
  onTimer,
  mirror,
  onMirror,
  grid,
  onGrid,
  filters,
  onFiltersChange,
  activePreset,
  onSelectPreset,
  lastPhotoSrc,
  layout,
  onLayoutChange,
  onCapture,
}: {
  accent?: string;
  disabled: boolean;
  busy: boolean;
  remaining: number;
  totalSlots: number;
  photosCount: number;
  timer: number;
  onTimer: (v: number) => void;
  mirror: boolean;
  onMirror: (v: boolean) => void;
  grid: boolean;
  onGrid: (v: boolean) => void;
  filters: Filters;
  onFiltersChange: (patch: Partial<Filters>) => void;
  activePreset: string;
  onSelectPreset: (id: string) => void;
  lastPhotoSrc?: string;
  layout: LayoutId;
  onLayoutChange: (l: LayoutId) => void;
  onCapture: () => void;
}) {
  const [openPopover, setOpenPopover] = useState<'timer' | 'look' | 'adjust' | 'layout' | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const togglePopover = (name: 'timer' | 'look' | 'adjust' | 'layout') => {
    setOpenPopover((prev) => (prev === name ? null : name));
  };

  return (
    <div className="relative flex flex-col items-center gap-3 w-full">
      {/* SHUTTER & PRIMARY CONTROLS ROW - SW 7015 PALE OAK STYLING */}
      <div className="flex w-full items-center justify-between gap-2 max-w-2xl px-1 sm:px-2">
        {/* LEFT CONTROLS: Timer & Look */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* TIMER BUTTON (SW 7015 PALE OAK) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('timer')}
              style={{ backgroundColor: timer > 0 || openPopover === 'timer' ? '#E3F0F5' : '#E5E0D8' }}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs font-semibold transition-all duration-150 shadow-subtle hover:-translate-y-[1px]',
                timer > 0 || openPopover === 'timer'
                  ? 'border-[#2F7898] text-[#2F7898]'
                  : 'border-[#D6D0C5] text-[#252320] hover:border-[#C8C2B7] hover:bg-[#F4F1EC]',
              )}
            >
              <TimerIcon size={14} className={timer > 0 || openPopover === 'timer' ? 'text-[#2F7898]' : 'text-[#6B665E]'} />
              <span>{timer === 0 ? 'Timer' : `${timer}s`}</span>
              <ChevronDown size={12} className={cx('transition-transform duration-150', openPopover === 'timer' ? 'rotate-180' : '')} />
            </button>

            <AnimatePresence>
              {openPopover === 'timer' && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  style={{ backgroundColor: '#FFFFFF' }}
                  className="absolute bottom-full left-0 mb-2 z-50 min-w-[130px] rounded-[12px] border border-[#D6D0C5] p-1.5 shadow-glass"
                >
                  {[0, 3, 5, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        onTimer(v);
                        setOpenPopover(null);
                      }}
                      className={cx(
                        'flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors',
                        timer === v ? 'bg-[#2F7898] text-white' : 'text-[#6B665E] hover:bg-[#E5E0D8] hover:text-[#252320]',
                      )}
                    >
                      <span>{v === 0 ? 'Off' : `${v} seconds`}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOOK BUTTON (SW 7015 PALE OAK) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('look')}
              style={{ backgroundColor: activePreset !== 'original' || openPopover === 'look' ? '#E3F0F5' : '#E5E0D8' }}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs font-semibold transition-all duration-150 shadow-subtle hover:-translate-y-[1px]',
                activePreset !== 'original' || openPopover === 'look'
                  ? 'border-[#2F7898] text-[#2F7898]'
                  : 'border-[#D6D0C5] text-[#252320] hover:border-[#C8C2B7] hover:bg-[#F4F1EC]',
              )}
            >
              <Sliders size={14} className={activePreset !== 'original' || openPopover === 'look' ? 'text-[#2F7898]' : 'text-[#6B665E]'} />
              <span>Look</span>
              <ChevronDown size={12} className={cx('transition-transform duration-150', openPopover === 'look' ? 'rotate-180' : '')} />
            </button>

            <AnimatePresence>
              {openPopover === 'look' && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  style={{ backgroundColor: '#FFFFFF' }}
                  className="absolute bottom-full left-0 mb-2 z-50 min-w-[240px] max-w-[290px] rounded-[12px] border border-[#D6D0C5] p-3 shadow-glass"
                >
                  <p className="text-[11px] font-semibold text-[#6B665E] uppercase tracking-wider mb-2">Photo Look</p>
                  <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {(showMoreFilters ? FILTER_PRESETS : MAIN_FILTERS).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPreset(p.id);
                          setOpenPopover(null);
                        }}
                        className={cx(
                          'flex flex-col items-center gap-1 p-1 rounded-[8px] border transition-all text-center',
                          activePreset === p.id
                            ? 'border-[#2F7898] bg-[#E3F0F5] text-[#2F7898] font-semibold'
                            : 'border-[#D6D0C5] hover:border-[#C8C2B7] bg-[#E5E0D8] text-[#6B665E] hover:text-[#252320]',
                        )}
                      >
                        <span className="aspect-square w-full rounded-[6px] overflow-hidden bg-[#F4F1EC] flex items-center justify-center text-[10px] font-semibold border border-black/5">
                          {lastPhotoSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={lastPhotoSrc} alt={p.label} className="h-full w-full object-cover drag-none" style={{ filter: p.id === 'original' ? 'none' : undefined }} />
                          ) : (
                            p.label[0]
                          )}
                        </span>
                        <span className="text-[10.5px] truncate w-full">{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {!showMoreFilters && (
                    <button
                      type="button"
                      onClick={() => setShowMoreFilters(true)}
                      className="mt-2.5 w-full rounded-[8px] border border-dashed border-[#D6D0C5] py-1 text-[11px] font-semibold text-[#2F7898] hover:bg-[#E5E0D8]"
                    >
                      + More Filters ({EXTRA_FILTERS.length})
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CENTER — SHUTTER BUTTON (SW 7015 PALE OAK OUTSIDE RING) */}
        <div className="flex flex-col items-center">
          <motion.button
            type="button"
            onClick={onCapture}
            disabled={disabled || busy}
            whileHover={disabled || busy ? undefined : { scale: 1.04 }}
            whileTap={disabled || busy ? undefined : { scale: 0.94 }}
            transition={{ duration: 0.12 }}
            aria-label="Take Photo"
            style={{ backgroundColor: '#E5E0D8' }}
            className="group relative grid h-[74px] w-[74px] place-items-center rounded-full border border-[#D6D0C5] p-1.5 shadow-subtle disabled:opacity-40"
          >
            {/* Middle graphite ring #252320, center ACM blue dot #2F7898 */}
            <span className="absolute inset-1 rounded-full border border-[#D6D0C5] bg-[#252320] transition-transform duration-150 group-active:scale-95 flex items-center justify-center">
              <span className="h-4 w-4 rounded-full bg-[#2F7898]" />
            </span>
          </motion.button>
        </div>

        {/* RIGHT CONTROLS: Adjust, Mirror, Grid */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ADJUST BUTTON (SW 7015 PALE OAK) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('adjust')}
              style={{ backgroundColor: openPopover === 'adjust' ? '#E3F0F5' : '#E5E0D8' }}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs font-semibold transition-all duration-150 shadow-subtle hover:-translate-y-[1px]',
                openPopover === 'adjust'
                  ? 'border-[#2F7898] text-[#2F7898]'
                  : 'border-[#D6D0C5] text-[#252320] hover:border-[#C8C2B7] hover:bg-[#F4F1EC]',
              )}
            >
              <SlidersHorizontal size={14} className={openPopover === 'adjust' ? 'text-[#2F7898]' : 'text-[#6B665E]'} />
              <span className="hidden sm:inline">Adjust</span>
              <ChevronDown size={12} className={cx('transition-transform duration-150', openPopover === 'adjust' ? 'rotate-180' : '')} />
            </button>

            <AnimatePresence>
              {openPopover === 'adjust' && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  style={{ backgroundColor: '#FFFFFF' }}
                  className="absolute bottom-full right-0 mb-2 z-50 min-w-[210px] rounded-[12px] border border-[#D6D0C5] p-3 shadow-glass space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#D6D0C5] pb-2">
                    <span className="text-[11px] font-semibold text-[#6B665E] uppercase tracking-wider">Adjustments</span>
                    <button
                      type="button"
                      onClick={() => onSelectPreset('original')}
                      className="text-[10.5px] font-semibold text-[#2F7898] hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <Slider
                    label="Brightness"
                    min={0.5}
                    max={1.6}
                    step={0.01}
                    value={filters.brightness}
                    onChange={(v) => onFiltersChange({ brightness: v })}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                  <Slider
                    label="Contrast"
                    min={0.5}
                    max={1.8}
                    step={0.01}
                    value={filters.contrast}
                    onChange={(v) => onFiltersChange({ contrast: v })}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                  <Slider
                    label="Saturation"
                    min={0}
                    max={2}
                    step={0.01}
                    value={filters.saturate}
                    onChange={(v) => onFiltersChange({ saturate: v })}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MIRROR BUTTON (SW 7015 PALE OAK) */}
          <button
            type="button"
            onClick={() => onMirror(!mirror)}
            title="Mirror Camera"
            style={{ backgroundColor: mirror ? '#E3F0F5' : '#E5E0D8' }}
            className={cx(
              'grid h-9 w-9 place-items-center rounded-[10px] border transition-all duration-150 shadow-subtle hover:-translate-y-[1px]',
              mirror
                ? 'border-[#2F7898] text-[#2F7898]'
                : 'border-[#D6D0C5] text-[#252320] hover:bg-[#F4F1EC]',
            )}
          >
            <FlipHorizontal size={14} />
          </button>

          {/* GRID BUTTON (SW 7015 PALE OAK) */}
          <button
            type="button"
            onClick={() => onGrid(!grid)}
            title="Grid Guide"
            style={{ backgroundColor: grid ? '#E3F0F5' : '#E5E0D8' }}
            className={cx(
              'grid h-9 w-9 place-items-center rounded-[10px] border transition-all duration-150 shadow-subtle hover:-translate-y-[1px]',
              grid
                ? 'border-[#2F7898] text-[#2F7898]'
                : 'border-[#D6D0C5] text-[#252320] hover:bg-[#F4F1EC]',
            )}
          >
            <Grid3x3 size={14} />
          </button>
        </div>
      </div>

      {/* SECONDARY ROW: LAYOUT SELECTOR */}
      <div className="flex items-center gap-1.5 text-xs font-normal text-[#6B665E]">
        <span>Layout:</span>
        <div className="relative flex items-center gap-1.5">
          <span className="font-bold text-[#252320]">{LAYOUT_NAMES[layout] || 'Strip'}</span>
          <button
            type="button"
            onClick={() => togglePopover('layout')}
            className="text-xs font-semibold text-[#2F7898] hover:underline cursor-pointer"
          >
            Change
          </button>

          <AnimatePresence>
            {openPopover === 'layout' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{ backgroundColor: '#FFFFFF' }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[140px] rounded-[10px] border border-[#D6D0C5] p-1.5 shadow-glass"
              >
                {(['strip4', 'strip3', 'single', 'grid4'] as LayoutId[]).map((lId) => (
                  <button
                    key={lId}
                    type="button"
                    onClick={() => {
                      onLayoutChange(lId);
                      setOpenPopover(null);
                    }}
                    className={cx(
                      'flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors',
                      layout === lId ? 'bg-[#2F7898] text-white' : 'text-[#6B665E] hover:bg-[#E5E0D8] hover:text-[#252320]',
                    )}
                  >
                    <span>{LAYOUT_NAMES[lId]}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
