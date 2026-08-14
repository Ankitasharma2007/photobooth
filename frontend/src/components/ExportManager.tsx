'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  Download,
  Frame as FrameIcon,
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
import { LAYOUTS, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import type { PatternId, TextureId } from '@/utils/types';
import { Header } from './CameraModule';
import CloudPanel from './CloudPanel';
import PhotoCanvas from './PhotoCanvas';
import { GlowButton, Panel, Segmented, Spinner, Toggle, cx } from './ui';

type Job = 'download' | 'print' | 'share' | null;
type TabId = 'templates' | 'frames' | 'stickers' | 'text';

interface TemplatePreset {
  id: string;
  name: string;
  bg: string;
  borderColor: string;
  pattern: PatternId;
  texture: TextureId;
  border: number;
  title: string;
  subtitle: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'acm-magenta-4',
    name: 'Magenta 4-Strip',
    bg: '#B3278C',
    borderColor: '#E6359E',
    pattern: 'solid',
    texture: 'none',
    border: 24,
    title: 'ACM PHOTO BOOTH',
    subtitle: 'Thapar Student Chapter',
  },
  {
    id: 'acm-amber-3',
    name: 'Amber 3-Strip',
    bg: '#C46D00',
    borderColor: '#D97706',
    pattern: 'solid',
    texture: 'none',
    border: 28,
    title: 'ACM SOCIETY EVENT',
    subtitle: 'Orientation 2026',
  },
  {
    id: 'acm-skyblue-1',
    name: 'Sky Blue Poster',
    bg: '#4AA3E0',
    borderColor: '#38BDF8',
    pattern: 'solid',
    texture: 'none',
    border: 32,
    title: 'ACM CHAPTER THAPAR',
    subtitle: 'Orientation Fair',
  },
  {
    id: 'pale-oak',
    name: 'Pale Oak',
    bg: '#F4F1EC',
    borderColor: '#E5E0D8',
    pattern: 'aurora',
    texture: 'vignette',
    border: 18,
    title: 'Clock IT..!!',
    subtitle: 'Warm Neutral Edition',
  },
];

const FRAME_PRESETS = [
  { id: 'none', label: 'None', color: 'transparent', size: 0 },
  { id: 'magenta', label: 'ACM Magenta', color: '#B3278C', size: 24 },
  { id: 'amber', label: 'ACM Amber', color: '#C46D00', size: 28 },
  { id: 'skyblue', label: 'ACM Sky Blue', color: '#4AA3E0', size: 32 },
  { id: 'pale-oak', label: 'Pale Oak', color: '#E5E0D8', size: 20 },
  { id: 'slate', label: 'Muted Slate', color: '#D6D0C5', size: 24 },
  { id: 'ivory', label: 'Clean Ivory', color: '#FFFFFF', size: 16 },
  { id: 'blue', label: 'ACM Blue', color: '#E3F0F5', size: 22 },
];

const STICKER_GROUPS = [
  { group: 'Event', items: ['✨', '🌟', '📷', '📸', '⚡'] },
  { group: 'Celebration', items: ['🎉', '🎊', '🎂', '🎈', '🥂'] },
  { group: 'Fun', items: ['😎', '😂', '🔥', '⭐', '💫'] },
  { group: 'Love', items: ['❤️', '💕', '💗', '💍', '💖'] },
  { group: 'Nature', items: ['🌸', '🌿', '💐', '🍀', '🌺'] },
];

const TEXT_PRESETS = [
  'ACM Photo Booth',
  'Society Event',
  'Cheers!',
  'BEST SOCIETY',
  'Our Moment',
  'Love & Laughter',
];

export default function ExportManager() {
  const { lang, theme, design, photos, patchDesign, addSticker, selectedItemId, removeItem, updateItem, go, resetSession } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = '#2F7898';

  const [activeTab, setActiveTab] = useState<TabId>('templates');
  const [isEditing, setIsEditing] = useState(true);
  const [job, setJob] = useState<Job>(null);
  const [quality, setQuality] = useState<QualityId>('max');
  const [lossless, setLossless] = useState(true);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const preset = QUALITIES.find((q) => q.id === quality)!;
  const out = exportSize(design, scaleFor(quality));

  const flash = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSelectTemplate = (tpl: TemplatePreset) => {
    patchDesign({
      bg: tpl.bg,
      borderColor: tpl.borderColor,
      pattern: tpl.pattern,
      texture: tpl.texture,
      border: tpl.border,
      title: tpl.title,
      subtitle: tpl.subtitle,
    });
  };

  const handleSelectFrame = (frm: typeof FRAME_PRESETS[0]) => {
    patchDesign({
      borderColor: frm.color,
      border: frm.size,
    });
  };

  const handleAddSticker = (char: string) => {
    if (design.items.length >= 8) {
      flash('err', 'Maximum 8 stickers per strip');
      return;
    }
    addSticker(char);
  };

  const handleSelectText = (titleText: string) => {
    patchDesign({ title: titleText });
  };

  const handleUndo = () => {
    if (design.items.length > 0) {
      const last = design.items[design.items.length - 1];
      removeItem(last.id);
    } else {
      patchDesign({ title: 'ACM PHOTO BOOTH', subtitle: 'Society Event' });
    }
  };

  const selectedItem = design.items.find((i) => i.id === selectedItemId);

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
        title={isEditing ? 'STYLE YOUR STRIP' : t('ready')}
        subtitle={isEditing ? 'Tap any template, frame or sticker to customize' : `${out.width} × ${out.height} px · ${out.dpi} DPI`}
        onBack={() => (isEditing ? go('capture') : setIsEditing(true))}
        backLabel={t('back')}
      />

      <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* CENTER CANVASES PREVIEW */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex min-h-[440px] flex-col items-center justify-center py-2 lg:h-[calc(100dvh-150px)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2F7898]/06 blur-[100px]" />
          <PhotoCanvas interactive={isEditing} maxWidth={400} />

          {/* Selected Sticker Floating Toolbar */}
          {isEditing && selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 rounded-full border border-[#D6D0C5] bg-white px-4 py-1.5 shadow-glass"
            >
              <span className="text-xs font-bold text-[#252320]">
                {selectedItem.kind === 'sticker' ? selectedItem.char : 'Text'}
              </span>
              <button
                type="button"
                onClick={() => updateItem(selectedItem.id, { size: Math.max(20, selectedItem.size - 12) })}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF3F5] text-[#252320] hover:bg-[#E3F0F5]"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => updateItem(selectedItem.id, { size: Math.min(300, selectedItem.size + 12) })}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF3F5] text-[#252320] hover:bg-[#E3F0F5]"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeItem(selectedItem.id)}
                className="grid h-7 w-7 place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT INTERACTIVE TOOLBAR OR EXPORT PANEL */}
        <div className="min-h-0 flex flex-col gap-4 lg:max-h-full lg:overflow-y-auto lg:pr-1">
          {isEditing ? (
            /* 2-CLICK INTERACTIVE CUSTOMIZER TOOLBAR WITH PALE OAK STYLING */
            <Panel className="flex flex-col gap-4 !border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-glass">
              {/* Category Tabs */}
              <div className="flex items-center justify-between border-b border-[#D6D0C5] pb-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className={cx(
                      'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all',
                      activeTab === 'templates' ? 'bg-[#2F7898] text-white shadow-subtle' : 'text-[#6B665E] hover:bg-[#EEF3F5] hover:text-[#252320]',
                    )}
                  >
                    <Bookmark size={13} />
                    <span>Templates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('frames')}
                    className={cx(
                      'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all',
                      activeTab === 'frames' ? 'bg-[#2F7898] text-white shadow-subtle' : 'text-[#6B665E] hover:bg-[#EEF3F5] hover:text-[#252320]',
                    )}
                  >
                    <FrameIcon size={13} />
                    <span>Frames</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stickers')}
                    className={cx(
                      'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all',
                      activeTab === 'stickers' ? 'bg-[#2F7898] text-white shadow-subtle' : 'text-[#6B665E] hover:bg-[#EEF3F5] hover:text-[#252320]',
                    )}
                  >
                    <Smile size={13} />
                    <span>Stickers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className={cx(
                      'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all',
                      activeTab === 'text' ? 'bg-[#2F7898] text-white shadow-subtle' : 'text-[#6B665E] hover:bg-[#EEF3F5] hover:text-[#252320]',
                    )}
                  >
                    <Type size={13} />
                    <span>Text</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents — 2-Click Items */}
              <div className="min-h-[220px]">
                {activeTab === 'templates' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {TEMPLATE_PRESETS.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className="group flex flex-col gap-1.5 rounded-[10px] border border-[#D6D0C5] bg-white p-2.5 text-left transition-all hover:border-[#2F7898] hover:bg-[#EEF3F5] shadow-subtle"
                      >
                        <div
                          className="h-16 w-full rounded-[6px] border border-black/10 flex flex-col justify-end p-1.5 shadow-inner"
                          style={{ backgroundColor: tpl.bg, borderColor: tpl.borderColor }}
                        >
                          <span
                            className="text-[8.5px] font-bold tracking-widest uppercase truncate"
                            style={{ color: tpl.bg === '#121212' ? '#FFFFFF' : '#252320' }}
                          >
                            {tpl.title}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#252320] group-hover:text-[#2F7898]">
                          {tpl.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'frames' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {FRAME_PRESETS.map((frm) => (
                      <button
                        key={frm.id}
                        type="button"
                        onClick={() => handleSelectFrame(frm)}
                        className="flex items-center justify-between rounded-[10px] border border-[#D6D0C5] bg-white px-3 py-2.5 text-xs font-semibold text-[#252320] transition-all hover:border-[#2F7898] hover:bg-[#EEF3F5] shadow-subtle"
                      >
                        <span>{frm.label}</span>
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: frm.color || '#fff' }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'stickers' && (
                  <div className="space-y-3">
                    {STICKER_GROUPS.map((g) => (
                      <div key={g.group}>
                        <p className="text-[11px] font-semibold text-[#6B665E] uppercase tracking-wider mb-1">
                          {g.group}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((char) => (
                            <button
                              key={char}
                              type="button"
                              onClick={() => handleAddSticker(char)}
                              className="grid h-10 w-10 place-items-center rounded-[10px] border border-[#D6D0C5] bg-white text-lg shadow-subtle transition-transform hover:scale-110 hover:border-[#2F7898] hover:bg-[#EEF3F5]"
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'text' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#6B665E]">Preset Titles</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TEXT_PRESETS.map((txt) => (
                        <button
                          key={txt}
                          type="button"
                          onClick={() => handleSelectText(txt)}
                          className="rounded-[10px] border border-[#D6D0C5] bg-white p-2.5 text-xs font-semibold text-[#252320] text-left transition-all hover:border-[#2F7898] hover:bg-[#EEF3F5] shadow-subtle"
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Row: Undo + Done */}
              <div className="flex items-center justify-between border-t border-[#D6D0C5] pt-3">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="flex items-center gap-1.5 rounded-[10px] border border-[#D6D0C5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#252320] hover:bg-[#EEF3F5] transition-all shadow-subtle"
                >
                  <RotateCcw size={13} />
                  <span>Undo</span>
                </button>

                <GlowButton
                  accent="#2F7898"
                  onClick={() => setIsEditing(false)}
                  className="font-semibold bg-[#2F7898] text-white hover:bg-[#276984] px-6"
                >
                  <span>Done</span>
                  <ArrowRight size={15} />
                </GlowButton>
              </div>
            </Panel>
          ) : (
            /* EXPORT / DOWNLOAD PANEL */
            <>
              <Panel className="!border-[#D6D0C5] !bg-white backdrop-blur-xl shadow-glass">
                <p className="font-sans text-2xl font-bold text-[#252320]">{t('ready')}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B665E]">{t('readyBody')}</p>

                <div className="mt-5 space-y-3">
                  <div>
                    <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#252320]">
                      <span>Download quality</span>
                      <span className="font-bold text-[#2F7898]">{out.width} × {out.height}</span>
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

                  <div className="grid grid-cols-3 gap-2">
                    <GlowButton
                      variant="outline"
                      className="w-full !px-2 font-semibold text-[#252320] border-[#D6D0C5]"
                      disabled={job !== null}
                      onClick={() => setIsEditing(true)}
                    >
                      Customize
                    </GlowButton>
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

              <CloudPanel />

              <Panel title="Summary" className="!border-[#D6D0C5] !bg-white backdrop-blur-xl">
                <dl className="space-y-2 text-xs">
                  <Row label="Layout" value={LAYOUTS[design.layout].label} />
                  <Row label="Frames" value={`${photos.length} / ${slotsFor(design)}`} />
                  <Row label="Overlays" value={`${design.items.length}`} />
                  <Row label="Export" value={`${out.width} × ${out.height}`} />
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
            </>
          )}
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
            {toast.kind === 'ok' ? <Check size={15} className="text-[#2F7898]" /> : <AlertTriangle size={15} />}
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
