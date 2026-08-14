'use client';

import { motion } from 'framer-motion';
import { useCallback, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useImages } from '@/hooks/useImages';
import { useBooth } from '@/services/store';
import { clamp } from '@/utils/canvas';
import { DESIGN_W } from '@/utils/design';
import { computeLayout, handlePoints, hitTestItem, renderStrip } from '@/utils/renderStrip';
import type { Item, StickerItem, TextItem } from '@/utils/types';

type DragMode = 'move' | 'scale' | 'rotate';
interface DragState {
  mode: DragMode;
  id: string;
  item: Item;
  start: { x: number; y: number };
  startDist: number;
  startAngle: number;
}

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/**
 * The strip renderer *is* the editor: preview and 2400px export run the same
 * draw call, and selection/drag/scale/rotate are hit-tested straight on the canvas.
 */
export default function PhotoCanvas({
  interactive = true,
  className,
  maxWidth = 460,
}: {
  interactive?: boolean;
  className?: string;
  maxWidth?: number;
}) {
  const { design, photos, selectedItemId, selectItem, updateItem, removeItem, setActivePhoto, go } =
    useBooth();
  const images = useImages(photos);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<DragState | null>(null);
  const anim = useRef(new Map<string, { x: number; y: number; size: number; rotation: number }>());
  const raf = useRef<number | null>(null);
  const [frame, tick] = useReducer((n: number) => n + 1, 0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const layout = computeLayout(design);
  const aspect = layout.width / layout.height;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      // A centred flex parent gives the wrapper no intrinsic height — fall back to width.
      const byHeight = r.height > 8 ? r.height * aspect : Infinity;
      const w = Math.min(r.width || maxWidth, byHeight, maxWidth);
      setBox({ w: Math.max(0, w), h: Math.max(0, w / aspect) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, maxWidth]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || box.w < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(box.w * dpr);
    canvas.width = pixelWidth;
    canvas.height = Math.round(box.h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';

    // Ease overlays toward their target so auto-placement and "Beautify" glide
    // into position instead of snapping. Export always renders final values.
    const K = 0.24;
    let settled = true;
    const live = new Set(design.items.map((i) => i.id));
    anim.current.forEach((_, id) => live.has(id) || anim.current.delete(id));

    const items = design.items.map((it) => {
      let s = anim.current.get(it.id);
      if (!s) {
        s = { x: it.x, y: it.y, size: it.size * 0.25, rotation: it.rotation };
        anim.current.set(it.id, s);
      }
      if (drag.current?.id === it.id) {
        Object.assign(s, { x: it.x, y: it.y, size: it.size, rotation: it.rotation });
        return it;
      }
      const delta =
        Math.abs(it.x - s.x) + Math.abs(it.y - s.y) + Math.abs(it.size - s.size) + Math.abs(it.rotation - s.rotation);
      if (delta < 0.6) {
        Object.assign(s, { x: it.x, y: it.y, size: it.size, rotation: it.rotation });
        return it;
      }
      settled = false;
      s.x += (it.x - s.x) * K;
      s.y += (it.y - s.y) * K;
      s.size += (it.size - s.size) * K;
      s.rotation += (it.rotation - s.rotation) * K;
      return { ...it, x: s.x, y: s.y, size: s.size, rotation: s.rotation };
    });

    renderStrip(ctx, {
      design: settled ? design : { ...design, items },
      photos,
      images,
      pixelWidth,
      selectedId: selectedItemId,
      showHandles: interactive,
      ui: DESIGN_W / box.w,
    });

    if (!settled) {
      raf.current = requestAnimationFrame(() => tick());
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
  }, [box, design, photos, images, selectedItemId, interactive, frame]);

  const toDesign = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * DESIGN_W,
      y: ((e.clientY - r.top) / r.width) * DESIGN_W,
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const ui = DESIGN_W / box.w;
    const p = toDesign(e);
    const selected = design.items.find((i) => i.id === selectedItemId) ?? null;

    let mode: DragMode | null = null;
    let target: Item | null = null;

    if (selected) {
      const hp = handlePoints(ctx, selected, ui);
      if (dist(p.x, p.y, hp.rotate[0], hp.rotate[1]) < 13 * ui) {
        mode = 'rotate';
        target = selected;
      } else if (dist(p.x, p.y, hp.scale[0], hp.scale[1]) < 13 * ui) {
        mode = 'scale';
        target = selected;
      }
    }

    if (!mode) {
      const hit = hitTestItem(ctx, design.items, p.x, p.y, 6 * ui);
      if (hit) {
        mode = 'move';
        target = hit;
        selectItem(hit.id);
      } else {
        selectItem(null);
        return;
      }
    }

    if (!target || !mode) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      mode,
      id: target.id,
      item: { ...target },
      start: p,
      startDist: Math.max(1, dist(p.x, p.y, target.x, target.y)),
      startAngle: Math.atan2(p.y - target.y, p.x - target.x),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toDesign(e);

    if (d.mode === 'move') {
      updateItem(d.id, {
        x: clamp(d.item.x + (p.x - d.start.x), -60, DESIGN_W + 60),
        y: clamp(d.item.y + (p.y - d.start.y), -60, layout.height + 60),
      });
      return;
    }

    if (d.mode === 'rotate') {
      const a = Math.atan2(p.y - d.item.y, p.x - d.item.x);
      const deg = d.item.rotation + ((a - d.startAngle) * 180) / Math.PI;
      updateItem(d.id, { rotation: e.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg) });
      return;
    }

    const factor = Math.max(0.1, dist(p.x, p.y, d.item.x, d.item.y) / d.startDist);
    if (d.item.kind === 'sticker') {
      updateItem(d.id, { size: clamp((d.item as StickerItem).size * factor, 16, 460) });
    } else {
      updateItem(d.id, { size: clamp((d.item as TextItem).size * factor, 10, 220) });
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current) e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = toDesign(e);
    if (hitTestItem(ctx, design.items, p.x, p.y, 6)) return;
    const idx = layout.cells.findIndex(
      (c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h,
    );
    const photo = photos[idx];
    if (photo) {
      setActivePhoto(photo.id);
      go('review');
    }
  };

  return (
    <div
      ref={wrapRef}
      className={className ?? 'grid h-full w-full place-items-center'}
      onKeyDown={(e) => {
        if (interactive && selectedItemId && (e.key === 'Delete' || e.key === 'Backspace')) {
          removeItem(selectedItemId);
        }
      }}
      tabIndex={interactive ? 0 : -1}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 240, damping: 30 }}
        className="relative overflow-hidden rounded-xl shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]"
        style={{ width: box.w, height: box.h }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: box.w, height: box.h }}
          className={interactive ? 'block touch-none' : 'block'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={onDoubleClick}
        />
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </motion.div>
    </div>
  );
}

/** Label used by the layer list in the sticker/text panels. */
export function itemLabel(it: Item) {
  return it.kind === 'sticker' ? it.char : it.text.split('\n')[0] || 'Text';
}
