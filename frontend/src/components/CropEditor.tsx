'use client';

import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { Camera, Check, GripVertical, RotateCcw, RotateCw, Trash2, X, ZoomIn } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useImages } from '@/hooks/useImages';
import { useBooth } from '@/services/store';
import { clamp, filterString } from '@/utils/canvas';
import { ASPECTS, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import { drawPhotoInCell } from '@/utils/renderStrip';
import type { AspectId, Photo } from '@/utils/types';
import { Header } from './CameraModule';
import { Chip, EmptyState, GlowButton, Panel, Slider, cx } from './ui';

export default function CropEditor() {
  const {
    lang,
    theme,
    photos,
    activePhotoId,
    setActivePhoto,
    removePhoto,
    orderPhotos,
    setPhotoTransform,
    setPhotoAspect,
    updatePhoto,
    go,
  } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;

  const active = photos.find((p) => p.id === activePhotoId) ?? photos[0] ?? null;

  useEffect(() => {
    if (!activePhotoId && photos[0]) setActivePhoto(photos[0].id);
  }, [activePhotoId, photos, setActivePhoto]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-[100dvh] flex-col gap-4 p-4 sm:p-6 lg:h-[100dvh] lg:p-8"
    >
      <Header
        title={t('review')}
        subtitle={`${photos.length} ${t('gallery').toLowerCase()}`}
        onBack={() => go('capture')}
        backLabel={t('back')}
        right={
          <GlowButton accent={accent} disabled={photos.length === 0} onClick={() => go('design')}>
            <Check size={16} />
            {t('confirm')}
          </GlowButton>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* LEFT � gallery */}
        <Panel title={t('gallery')} className="order-2 flex min-h-0 flex-col lg:order-1">
          {photos.length === 0 ? (
            <EmptyState
              icon={<Camera size={18} />}
              title={t('emptyGallery')}
              body={t('emptyGalleryBody')}
              action={
                <GlowButton accent={accent} size="sm" className="mt-2" onClick={() => go('capture')}>
                  {t('capture')}
                </GlowButton>
              }
            />
          ) : (
            <Reorder.Group
              axis="y"
              values={photos}
              onReorder={(next: Photo[]) => orderPhotos(next.map((p) => p.id))}
              className="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto pr-1"
            >
              <AnimatePresence initial={false}>
                {photos.map((p, i) => (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileDrag={{ scale: 1.03, zIndex: 5 }}
                    className={cx(
                      'group relative flex cursor-grab items-center gap-2 rounded-[10px] border p-2 transition-colors duration-150 active:cursor-grabbing shadow-subtle',
                      active?.id === p.id
                        ? 'border-[#2F7898] bg-[#E3F0F5]'
                        : 'border-[#D6D0C5] bg-white hover:border-[#C8C2B7] hover:bg-[#E5E0D8]',
                    )}
                    onPointerDown={() => setActivePhoto(p.id)}
                  >
                    <GripVertical size={14} className="shrink-0 text-[#6B665E]" />
                    <div className="relative aspect-[4/3] w-[86px] shrink-0 overflow-hidden rounded-[8px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.src}
                        alt={`Frame ${i + 1}`}
                        className="h-full w-full object-cover drag-none"
                        style={{ filter: filterString(p.filters) }}
                      />
                      {active?.id === p.id && (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-[8px]"
                          style={{ boxShadow: `inset 0 0 0 2px ${accent}` }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-[#252320]">Frame {i + 1}</p>
                      <p className="text-[10.5px] font-semibold text-[#6B665E]">{ASPECTS[p.aspect].label}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(p.id);
                      }}
                      aria-label={`${t('delete')} ${i + 1}`}
                      className="icon-btn !h-7 !w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:!border-rose-300 hover:!bg-rose-100 hover:!text-rose-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </Panel>

        {/* CENTER � crop stage */}
        <div className="order-1 flex min-h-0 flex-col gap-4 lg:order-2">
          <div className="glass relative flex min-h-[340px] flex-1 items-center justify-center overflow-hidden p-4">
            <span className="hairline" />
            {active ? (
              <CropStage
                key={active.id}
                photo={active}
                onPan={(dx, dy) =>
                  setPhotoTransform(active.id, {
                    x: clamp(active.transform.x + dx, -0.6, 0.6),
                    y: clamp(active.transform.y + dy, -0.6, 0.6),
                  })
                }
                onZoom={(f) =>
                  setPhotoTransform(active.id, { scale: clamp(active.transform.scale * f, 0.5, 4) })
                }
              />
            ) : (
              <EmptyState icon={<Camera size={18} />} title={t('emptyGallery')} body={t('emptyGalleryBody')} />
            )}
          </div>

          {/* BOTTOM toolbar */}
          <Panel className="!p-3.5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ASPECTS) as AspectId[]).map((a) => (
                  <Chip
                    key={a}
                    active={active?.aspect === a}
                    onClick={() => active && setPhotoAspect(active.id, a)}
                  >
                    {ASPECTS[a].label}
                  </Chip>
                ))}
              </div>

              <div className="flex min-w-[260px] flex-1 gap-4 xl:max-w-[420px]">
                <div className="flex-1">
                  <Slider
                    accent={accent}
                    label={t('zoom')}
                    min={0.5}
                    max={4}
                    step={0.01}
                    value={active?.transform.scale ?? 1}
                    onChange={(v) => active && setPhotoTransform(active.id, { scale: v })}
                    format={(v) => `${v.toFixed(2)}�`}
                  />
                </div>
                <div className="flex-1">
                  <Slider
                    accent={accent}
                    label={t('rotate')}
                    min={-180}
                    max={180}
                    step={1}
                    value={active?.transform.rotation ?? 0}
                    onChange={(v) => active && setPhotoTransform(active.id, { rotation: v })}
                    format={(v) => `${v}°`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Rotate left"
                  onClick={() =>
                    active &&
                    setPhotoTransform(active.id, { rotation: active.transform.rotation - 90 })
                  }
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Rotate right"
                  onClick={() =>
                    active &&
                    setPhotoTransform(active.id, { rotation: active.transform.rotation + 90 })
                  }
                >
                  <RotateCw size={15} />
                </button>
                <Chip
                  onClick={() =>
                    active &&
                    updatePhoto(active.id, {
                      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                      aspect: 'free',
                    })
                  }
                >
                  <ZoomIn size={14} />
                  {t('reset')}
                </Chip>
                <Chip onClick={() => go('capture')}>
                  <X size={14} />
                  {t('cancel')}
                </Chip>
                <GlowButton accent={accent} size="sm" disabled={!active} onClick={() => go('design')}>
                  <Check size={14} />
                  {t('confirm')}
                </GlowButton>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- canvas stage ---------------- */

function CropStage({
  photo,
  onPan,
  onZoom,
}: {
  photo: Photo;
  onPan: (dx: number, dy: number) => void;
  onZoom: (factor: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useImages([photo]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  const aspect = ASPECTS[photo.aspect].value ?? photo.w / photo.h;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.min(width, height * aspect);
      setBox({ w: Math.max(0, w), h: Math.max(0, w / aspect) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !box.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.w * dpr);
    canvas.height = Math.round(box.h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    ctx.fillStyle = '#F4F1EC';
    ctx.fillRect(0, 0, box.w, box.h);

    const img = images.get(photo.src);
    if (img?.complete && img.naturalWidth) {
      drawPhotoInCell(ctx, img, { x: 0, y: 0, w: box.w, h: box.h }, photo, 'original');
    }

    // rule-of-thirds guides
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      ctx.moveTo((box.w * i) / 3, 0);
      ctx.lineTo((box.w * i) / 3, box.h);
      ctx.moveTo(0, (box.h * i) / 3);
      ctx.lineTo(box.w, (box.h * i) / 3);
    }
    ctx.stroke();
  }, [box, images, photo]);

  return (
    <div ref={wrapRef} className="grid h-full w-full place-items-center">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
        style={{ width: box.w, height: box.h }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: box.w, height: box.h }}
          className="block cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!drag.current || !box.w) return;
            onPan((e.clientX - drag.current.x) / box.w, (e.clientY - drag.current.y) / box.h);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => onZoom(1 - e.deltaY * 0.0012)}
        />
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/12" />
      </motion.div>
    </div>
  );
}
