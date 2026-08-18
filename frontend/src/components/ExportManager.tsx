'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Download,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  Smile,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import {
  QUALITIES,
  type QualityId,
  canvasToBlob,
  downloadBlob,
  exportSize,
  fileName,
  printDataUrl,
  renderExport,
  scaleFor,
  shareBlob,
} from '@/services/exporter';
import { slotsFor, useBooth } from '@/services/store';
import { FONTS, FRAMES, LAYOUTS } from '@/utils/design';
import { translate } from '@/utils/i18n';
import type { TextItem } from '@/utils/types';
import { Header } from './CameraModule';
import CloudPanel from './CloudPanel';
import PhotoCanvas from './PhotoCanvas';
import { GlowButton, Panel, Segmented, Spinner, Toggle, cx } from './ui';

type Job = 'download' | 'print' | 'share' | null;

const QUICK_STICKERS = ['✨', '🌟', '📷', '📸', '⚡', '🎉', '🔥', '⭐', '❤️', '🌸', '😎', '👑'];

const PRESET_TITLES = [
  'ACM Photo Booth',
  'Society Event',
  'Cheers!',
  'BEST SOCIETY',
  'Our Moment',
  'Love & Laughter',
  'ACM Thapar 2026',
];

const TEXT_COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Black', value: '#18232B' },
  { label: 'Yellow', value: '#FFDF00' },
  { label: 'Red', value: '#E23636' },
  { label: 'Pink', value: '#FF3385' },
  { label: 'Cyan', value: '#00D4FF' },
  { label: 'Gold', value: '#F29C38' },
];

export default function ExportManager() {
  const {
    lang,
    design,
    photos,
    patchDesign,
    addSticker,
    addText,
    selectedItemId,
    removeItem,
    updateItem,
    selectItem,
    go,
    resetSession,
  } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  const [job, setJob] = useState<Job>(null);
  const [quality, setQuality] = useState<QualityId>('max');
  const [lossless, setLossless] = useState(true);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  // Custom text input state
  const [customText, setCustomText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  const out = exportSize(design, scaleFor(quality));

  const flash = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const handleAddSticker = (char: string) => {
    if (design.items.length >= 12) {
      flash('err', 'Maximum 12 overlays per strip');
      return;
    }
    addSticker(char);
  };

  const handleAddCustomText = (textToAdd?: string) => {
    const text = (textToAdd ?? customText).trim();
    if (!text) {
      flash('err', 'Please enter text first');
      return;
    }
    if (design.items.length >= 12) {
      flash('err', 'Maximum 12 overlays per strip');
      return;
    }
    addText(text);
    setCustomText('');
    flash('ok', 'Text added! Drag it anywhere on the strip');
  };

  const selectedItem = design.items.find((i) => i.id === selectedItemId);
  const selectedTextItem =
    selectedItem && selectedItem.kind === 'text' ? (selectedItem as TextItem) : null;

  const run = async (kind: Exclude<Job, null>) => {
    if (job) return;
    setJob(kind);
    try {
      const wanted = kind === 'print' ? Math.min(4, scaleFor(quality)) : scaleFor(quality);
      const { canvas, scale } = await renderExport(design, photos, wanted);
      const stepped = scale < wanted ? ` (stepped down to ${scale}× for this device)` : '';

      if (kind === 'print') {
        printDataUrl(canvas.toDataURL('image/png'));
        flash('ok', `Sent to printer${stepped}`);
      } else {
        const type = lossless ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, type, lossless ? 1 : 0.95);
        const name = fileName(design, lossless ? 'png' : 'jpg');
        const mb = (blob.size / 1048576).toFixed(1);
        if (kind === 'download') {
          downloadBlob(blob, name);
          flash('ok', `Saved ${canvas.width}×${canvas.height} · ${mb} MB${stepped}`);
        } else {
          const how = await shareBlob(blob, name);
          flash('ok', how === 'shared' ? 'Shared' : 'Sharing unavailable — downloaded instead');
        }
      }
    } catch (e) {
      const err = e as Error;
      if (err?.name !== 'AbortError') flash('err', err?.message || 'Something went wrong');
    } finally {
      setJob(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-[100dvh] flex-col gap-4 p-4 sm:p-6 lg:h-[100dvh] lg:p-8 select-none text-[#252320]"
    >
      <Header
        title={t('ready')}
        subtitle={`${out.width} × ${out.height} px · ${out.dpi} DPI`}
        onBack={() => go('capture')}
        backLabel={t('back')}
      />

      <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        {/* CENTER CANVASES PREVIEW */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex min-h-[440px] flex-col items-center justify-center py-2 lg:h-[calc(100dvh-150px)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2F7898]/06 blur-[100px]" />
          <PhotoCanvas interactive={true} maxWidth={400} />

          {/* Selected Overlay Floating Controls */}
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 rounded-full border border-[#D6D0C5] bg-white px-4 py-1.5 shadow-glass"
            >
              <span className="text-xs font-bold text-[#252320]">
                {selectedItem.kind === 'sticker' ? selectedItem.char : `"${selectedItem.text}"`}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateItem(selectedItem.id, { size: Math.max(16, selectedItem.size - 6) })
                }
                className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF3F5] text-[#252320] hover:bg-[#E3F0F5]"
                title="Decrease size"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateItem(selectedItem.id, { size: Math.min(200, selectedItem.size + 6) })
                }
                className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF3F5] text-[#252320] hover:bg-[#E3F0F5]"
                title="Increase size"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeItem(selectedItem.id)}
                className="grid h-7 w-7 place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT SIDEBAR: EXPORT, TYPE YOUR OWN TEXT, STICKERS, SWITCH FRAMES, CLOUD */}
        <div className="min-h-0 flex flex-col gap-4 lg:max-h-full lg:overflow-y-auto lg:pr-1">
          {/* EXPORT / DOWNLOAD CARD */}
          <Panel className="!border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-glass">
            <p className="font-sans text-2xl font-bold text-[#252320]">{t('ready')}</p>
            <p className="mt-1 text-xs font-semibold text-[#6B665E]">{t('readyBody')}</p>

            <div className="mt-4 space-y-3">
              <div>
                <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#252320]">
                  <span>Download quality</span>
                  <span className="font-bold text-[#2F7898]">
                    {out.width} × {out.height}
                  </span>
                </span>
                <Segmented
                  options={QUALITIES.map((q) => ({ id: q.id, label: q.label }))}
                  value={quality}
                  onChange={setQuality}
                />
              </div>

              <Toggle
                label={lossless ? 'PNG · lossless' : 'JPEG · smaller file'}
                checked={lossless}
                onChange={setLossless}
              />
            </div>

            <div className="mt-4 space-y-2">
              <GlowButton
                accent="#2F7898"
                size="lg"
                className="w-full font-semibold bg-[#2F7898] text-white hover:bg-[#276984]"
                disabled={job !== null}
                onClick={() => void run('download')}
              >
                {job === 'download' ? <Spinner /> : <Download size={17} />}
                {job === 'download' ? t('rendering') : t('download')}
              </GlowButton>

              <div className="grid grid-cols-2 gap-2">
                <GlowButton
                  variant="outline"
                  className="w-full !px-2 font-semibold text-[#252320] border-[#D6D0C5]"
                  disabled={job !== null}
                  onClick={() => void run('print')}
                >
                  {job === 'print' ? <Spinner /> : <Printer size={15} />}
                  {t('print')}
                </GlowButton>
                <GlowButton
                  variant="outline"
                  className="w-full !px-2 font-semibold text-[#252320] border-[#D6D0C5]"
                  disabled={job !== null}
                  onClick={() => void run('share')}
                >
                  {job === 'share' ? <Spinner /> : <Share2 size={15} />}
                  {t('share')}
                </GlowButton>
              </div>
            </div>
          </Panel>

          {/* TYPE YOUR OWN TEXT PANEL */}
          <Panel title="Add Your Own Text" className="!border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-subtle">
            <div className="space-y-3">
              {/* Text Input Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomText();
                  }}
                  placeholder="Type your message, names, date..."
                  className="flex-1 rounded-[10px] border border-[#D6D0C5] bg-[#F9F8F6] px-3.5 py-2 text-xs font-semibold text-[#252320] outline-none transition-all placeholder:text-[#948E85] focus:border-[#2F7898] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomText()}
                  className="flex items-center gap-1.5 rounded-[10px] bg-[#2F7898] px-3.5 py-2 text-xs font-bold text-white shadow-subtle hover:bg-[#266885] transition-colors"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              {/* Preset Titles */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-[#6B665E] uppercase tracking-wider">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TITLES.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setCustomText(title);
                        handleAddCustomText(title);
                      }}
                      className="rounded-full border border-[#D6D0C5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#252320] hover:border-[#2F7898] hover:bg-[#EEF3F5] transition-all"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Text Formatting (shown when a text layer is selected on canvas) */}
              {selectedTextItem && (
                <div className="mt-3 rounded-[12px] border border-[#2F7898]/30 bg-[#EEF3F5]/80 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F7898]">
                      Editing Selected Text
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(selectedTextItem.id)}
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Live Edit Text */}
                  <input
                    type="text"
                    value={selectedTextItem.text}
                    onChange={(e) => updateItem(selectedTextItem.id, { text: e.target.value })}
                    className="w-full rounded-[8px] border border-[#D6D0C5] bg-white px-3 py-1.5 text-xs font-semibold text-[#252320] outline-none focus:border-[#2F7898]"
                  />

                  {/* Font Pickers */}
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase text-[#6B665E]">Font Style</span>
                    <div className="flex flex-wrap gap-1">
                      {FONTS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateItem(selectedTextItem.id, { font: f.id, weight: f.weight })}
                          className={cx(
                            'rounded-[6px] border px-2 py-1 text-[11px] font-semibold transition-all',
                            selectedTextItem.font === f.id
                              ? 'border-[#2F7898] bg-[#2F7898] text-white'
                              : 'border-[#D6D0C5] bg-white text-[#252320] hover:bg-[#E3F0F5]',
                          )}
                          style={{ fontFamily: `"${f.id}", Inter, sans-serif` }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase text-[#6B665E]">Text Color</span>
                    <div className="flex items-center gap-1.5">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => updateItem(selectedTextItem.id, { color: c.value })}
                          className={cx(
                            'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                            selectedTextItem.color === c.value ? 'ring-2 ring-[#2F7898] ring-offset-1 scale-110' : 'border-black/20',
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* REAL FRAME SELECTOR */}
          <Panel title="Select Frame" className="!border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-subtle">
            <div className="grid grid-cols-2 gap-2">
              {FRAMES.map((f) => {
                const active =
                  design.frameOverlay === f.design.frameOverlay || design.frameId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => patchDesign(f.design)}
                    className={cx(
                      'group relative flex flex-col items-center overflow-hidden rounded-[10px] border p-2 text-left transition-all shadow-subtle',
                      active
                        ? 'border-[#2F7898] bg-[#E3F0F5] ring-2 ring-[#2F7898]/30'
                        : 'border-[#D6D0C5] bg-white hover:border-[#2F7898]/50 hover:bg-[#F2F5F6]',
                    )}
                  >
                    <div className="relative mb-1.5 aspect-[3/4] w-full overflow-hidden rounded-[6px] bg-[#111] p-1 flex items-center justify-center">
                      <img
                        src={f.previewImage}
                        alt={f.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="w-full truncate text-[11px] font-bold text-[#18232B]">{f.name}</p>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#2F7898] text-white shadow-sm">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* QUICK STICKERS */}
          <Panel title="Add Stickers" className="!border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-subtle">
            <div className="flex flex-wrap gap-2">
              {QUICK_STICKERS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleAddSticker(char)}
                  className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#D6D0C5] bg-white text-base shadow-subtle transition-transform hover:scale-110 hover:border-[#2F7898] hover:bg-[#EEF3F5]"
                >
                  {char}
                </button>
              ))}
            </div>
          </Panel>

          {/* CLOUD & EMAIL PANEL */}
          <CloudPanel />

          {/* SUMMARY */}
          <Panel title="Summary" className="!border-[#D6D0C5] !bg-white backdrop-blur-xl">
            <dl className="space-y-2 text-xs">
              <Row label="Layout" value={LAYOUTS[design.layout]?.label ?? design.layout} />
              <Row label="Frames" value={`${photos.length} / ${slotsFor(design)}`} />
              <Row label="Overlays" value={`${design.items.length}`} />
              <Row label="Export Size" value={`${out.width} × ${out.height} px`} />
              <Row label="Format" value={lossless ? 'PNG (lossless)' : 'JPEG 95%'} />
            </dl>
          </Panel>

          <button
            type="button"
            onClick={resetSession}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#D6D0C5] bg-white py-2.5 text-xs font-semibold text-[#252320] hover:bg-[#EEF3F5] transition-all shadow-subtle"
          >
            <RotateCcw size={14} />
            {t('newSession')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cx(
              'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-[10px] border px-5 py-3 text-xs font-semibold backdrop-blur-2xl shadow-glass',
              toast.kind === 'ok'
                ? 'border-[#D6D0C5] bg-white text-[#252320]'
                : 'border-red-400/40 bg-red-500/20 text-red-900',
            )}
          >
            {toast.kind === 'ok' ? (
              <Check size={15} className="text-[#2F7898]" />
            ) : (
              <AlertTriangle size={15} />
            )}
            {toast.msg}
            {toast.kind === 'ok' && <Sparkles size={13} className="text-[#2F7898]" />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[#6B665E] font-semibold">{label}</dt>
      <dd className="tabular-nums text-[#252320] font-bold">{value}</dd>
    </div>
  );
}
