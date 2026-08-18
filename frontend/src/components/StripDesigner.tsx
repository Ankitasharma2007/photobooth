'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  Frame as FrameIcon,
  Image as ImageIcon,
  SlidersHorizontal,
  Sticker,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import { useBooth } from '@/services/store';
import { filterString } from '@/utils/canvas';
import { DEFAULT_FILTERS, FILTER_PRESETS, PREVIEW_SWATCH, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import { Header } from './CameraModule';
import FrameSelector from './FrameSelector';
import PhotoCanvas from './PhotoCanvas';
import StickerEditor from './StickerEditor';
import TemplateManager from './TemplateManager';
import TextEditor from './TextEditor';
import { Chip, EmptyState, FilterTile, GlowButton, Panel, Slider, cx } from './ui';

type TabId = 'frame' | 'stickers' | 'text' | 'filters' | 'templates';

export default function StripDesigner() {
  const { lang, theme, go } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;
  const [tab, setTab] = useState<TabId>('frame');

  const tabs: { id: TabId; label: string; Icon: typeof FrameIcon }[] = [
    { id: 'frame', label: t('frame'), Icon: FrameIcon },
    { id: 'stickers', label: t('stickers'), Icon: Sticker },
    { id: 'text', label: t('text'), Icon: Type },
    { id: 'filters', label: t('filters'), Icon: SlidersHorizontal },
    { id: 'templates', label: t('templates'), Icon: Bookmark },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-[100dvh] flex-col gap-4 p-4 sm:p-6 lg:h-[100dvh] lg:p-8"
    >
      <Header
        title={t('design')}
        subtitle={THEMES[theme].label}
        onBack={() => go('review')}
        backLabel={t('back')}
        right={
          <GlowButton accent={accent} onClick={() => go('final')}>
            {t('finish')}
            <ArrowRight size={16} />
          </GlowButton>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_384px]">
        {/* LEFT — live strip */}
        <div className="glass relative flex min-h-[420px] items-center justify-center overflow-hidden p-6">
          <span className="hairline" />
          <div
            className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: accent }}
          />
          <PhotoCanvas maxWidth={520} />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/25">
            Double-click a frame to re-crop it
          </p>
        </div>

        {/* RIGHT — customisation */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Indicator slides via CSS %, not a shared layoutId — a layoutId inside a
              screen that unmounts stalls the AnimatePresence exit. */}
          <div className="glass relative flex shrink-0 gap-1 p-1.5 border border-[#D5E0E4]">
            <span
              aria-hidden
              className="absolute bottom-1.5 top-1.5 rounded-[10px] bg-[#2F7898] shadow-sm transition-[left] duration-200 ease-out"
              style={{
                left: `calc(0.375rem + ${(tabs.findIndex((x) => x.id === tab) * 100) / tabs.length}%)`,
                width: `calc(${100 / tabs.length}% - 0.25rem)`,
              }}
            />
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cx(
                  'relative z-10 flex flex-1 flex-col items-center gap-1 rounded-[10px] px-1 py-2 text-[11px] font-semibold transition-colors duration-200',
                  tab === id ? 'text-white' : 'text-[#65747C] hover:text-[#17242B]',
                )}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-210px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === 'frame' && <FrameSelector />}
                {tab === 'stickers' && <StickerEditor />}
                {tab === 'text' && <TextEditor />}
                {tab === 'filters' && <PhotoFilters />}
                {tab === 'templates' && <TemplateManager />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- per-photo image processing ---------------- */

function PhotoFilters() {
  const { lang, theme, photos, activePhotoId, setActivePhoto, updatePhoto } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;
  const active = photos.find((p) => p.id === activePhotoId) ?? photos[0] ?? null;
  const [applyAll, setApplyAll] = useState(false);

  const setFilters = (patch: Partial<typeof DEFAULT_FILTERS>) => {
    if (!active) return;
    const targets = applyAll ? photos : [active];
    targets.forEach((p) => updatePhoto(p.id, { filters: { ...p.filters, ...patch } }));
  };

  if (!active) {
    return (
      <Panel title={t('filters')}>
        <EmptyState icon={<ImageIcon size={18} />} title="No photos to grade" body="Capture a few frames first." />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title={t('gallery')}>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePhoto(p.id)}
              className={cx(
                'relative aspect-[4/3] w-[74px] overflow-hidden rounded-lg border transition-all duration-300',
                active.id === p.id ? 'border-white/60' : 'border-white/10 opacity-60 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={`Frame ${i + 1}`}
                className="h-full w-full object-cover drag-none"
                style={{ filter: filterString(p.filters) }}
              />
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Chip active={applyAll} onClick={() => setApplyAll((v) => !v)} className="!text-[12px]">
            Apply to all frames
          </Chip>
        </div>
      </Panel>

      <Panel title={t('look')}>
        <div className="grid grid-cols-3 gap-2.5">
          {FILTER_PRESETS.map((p) => (
            <FilterTile
              key={p.id}
              label={p.label}
              filter={filterString(p.filters)}
              src={active.src}
              fallback={PREVIEW_SWATCH}
              active={filterString(active.filters) === filterString(p.filters)}
              onClick={() => setFilters(p.filters)}
            />
          ))}
        </div>
      </Panel>

      <Panel title={t('adjust')}>
        <div className="space-y-4">
          <Slider
            accent={accent}
            label={t('brightness')}
            min={0.5}
            max={1.6}
            step={0.01}
            value={active.filters.brightness}
            onChange={(v) => setFilters({ brightness: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            accent={accent}
            label={t('contrast')}
            min={0.5}
            max={1.8}
            step={0.01}
            value={active.filters.contrast}
            onChange={(v) => setFilters({ contrast: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            accent={accent}
            label={t('saturation')}
            min={0}
            max={2}
            step={0.01}
            value={active.filters.saturate}
            onChange={(v) => setFilters({ saturate: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            accent={accent}
            label="Warmth"
            min={-40}
            max={40}
            step={1}
            value={active.filters.hue}
            onChange={(v) => setFilters({ hue: v })}
            format={(v) => `${v}°`}
          />
          <Slider
            accent={accent}
            label="Blur"
            min={0}
            max={8}
            step={0.1}
            value={active.filters.blur}
            onChange={(v) => setFilters({ blur: v })}
            format={(v) => (v === 0 ? 'Off' : `${v.toFixed(1)}px`)}
          />
          <Chip onClick={() => setFilters({ ...DEFAULT_FILTERS })} className="!text-[12px]">
            {t('reset')}
          </Chip>
        </div>
      </Panel>
    </div>
  );
}
