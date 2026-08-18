import {
  clamp,
  coverScale,
  EMOJI_FONT,
  filterString,
  hexToRgba,
  isLight,
  roundRectPath,
  seeded,
  shapePath,
  type Ctx,
} from './canvas';
import { CELL_GAP, DESIGN_W, FOOTER_H, LAYOUTS } from './design';
import type { Design, Item, Photo, TextItem } from './types';

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StripLayout {
  width: number;
  height: number;
  pad: number;
  cells: Cell[];
  footerY: number;
  footerH: number;
}

export function hasFooter(d: Design) {
  return Boolean(d.title || d.subtitle || d.showDate);
}

export const CUSTOM_FRAME_CONFIGS: Record<
  string,
  {
    nativeWidth: number;
    nativeHeight: number;
    slots: { x: number; y: number; w: number; h: number }[];
  }
> = {
  '/frames/spiderman_single.png': {
    nativeWidth: 916,
    nativeHeight: 1024,
    slots: [{ x: 111, y: 113, w: 654, h: 655 }],
  },
  '/frames/pop_three.png': {
    nativeWidth: 343,
    nativeHeight: 1024,
    slots: [
      { x: 17, y: 56, w: 310, h: 254 },
      { x: 17, y: 326, w: 310, h: 254 },
      { x: 17, y: 597, w: 310, h: 254 },
    ],
  },
  '/frames/retro_four.png': {
    nativeWidth: 357,
    nativeHeight: 1024,
    slots: [
      { x: 50, y: 74, w: 247, h: 190 },
      { x: 50, y: 277, w: 247, h: 190 },
      { x: 50, y: 480, w: 247, h: 190 },
      { x: 50, y: 683, w: 247, h: 190 },
    ],
  },
  '/frames/doodle_four.png': {
    nativeWidth: 823,
    nativeHeight: 1024,
    slots: [
      { x: 45, y: 90, w: 350, h: 372 },
      { x: 430, y: 88, w: 350, h: 374 },
      { x: 48, y: 500, w: 352, h: 384 },
      { x: 435, y: 504, w: 340, h: 376 },
    ],
  },
};

export function computeLayout(d: Design): StripLayout {
  if (d.frameOverlay && CUSTOM_FRAME_CONFIGS[d.frameOverlay]) {
    const cfg = CUSTOM_FRAME_CONFIGS[d.frameOverlay];
    const scale = DESIGN_W / cfg.nativeWidth;
    const height = Math.round(cfg.nativeHeight * scale);
    const cells = cfg.slots.map((s) => ({
      x: Math.round(s.x * scale),
      y: Math.round(s.y * scale),
      w: Math.round(s.w * scale),
      h: Math.round(s.h * scale),
    }));
    return {
      width: DESIGN_W,
      height,
      pad: 0,
      cells,
      footerY: height,
      footerH: 0,
    };
  }

  const conf = LAYOUTS[d.layout];
  const pad = d.border;
  const cellW = (DESIGN_W - pad * 2 - (conf.cols - 1) * CELL_GAP) / conf.cols;
  const cellH = cellW / conf.aspect;

  const cells: Cell[] = [];
  for (let r = 0; r < conf.rows; r++) {
    for (let c = 0; c < conf.cols; c++) {
      cells.push({
        x: pad + c * (cellW + CELL_GAP),
        y: pad + r * (cellH + CELL_GAP),
        w: cellW,
        h: cellH,
      });
    }
  }

  const gridH = conf.rows * cellH + (conf.rows - 1) * CELL_GAP;
  const footerH = hasFooter(d) ? FOOTER_H : 0;
  return {
    width: DESIGN_W,
    height: pad + gridH + footerH + pad,
    pad,
    cells,
    footerY: pad + gridH,
    footerH,
  };
}

/* ------------------------------------------------------------------ */
/* Backgrounds                                                         */
/* ------------------------------------------------------------------ */

function paintBackground(ctx: Ctx, d: Design, w: number, h: number) {
  ctx.fillStyle = d.bg;
  ctx.fillRect(0, 0, w, h);

  const rand = seeded(9137);

  switch (d.pattern) {
    case 'gradient': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, d.bg);
      g.addColorStop(0.55, hexToRgba(d.bgAccent, 0.55));
      g.addColorStop(1, d.bgAccent);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'dots': {
      ctx.fillStyle = hexToRgba(d.bgAccent, 0.5);
      const step = 26;
      for (let y = step / 2, row = 0; y < h; y += step, row++) {
        for (let x = row % 2 ? step : step / 2; x < w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'grid': {
      ctx.strokeStyle = hexToRgba(d.bgAccent, 0.32);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      break;
    }
    case 'confetti': {
      const colors = [d.bgAccent, d.borderColor, '#FFFFFF'];
      const count = Math.round((w * h) / 5200);
      for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.translate(rand() * w, rand() * h);
        ctx.rotate(rand() * Math.PI);
        ctx.globalAlpha = 0.35 + rand() * 0.5;
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        const pw = 5 + rand() * 8;
        ctx.fillRect(-pw / 2, -2, pw, 4);
        ctx.restore();
      }
      break;
    }
    case 'aurora': {
      const blobs: [number, number, number, string][] = [
        [w * 0.18, h * 0.12, w * 0.75, d.bgAccent],
        [w * 0.9, h * 0.42, w * 0.8, d.borderColor],
        [w * 0.3, h * 0.85, w * 0.85, d.bgAccent],
      ];
      for (const [x, y, r, color] of blobs) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, hexToRgba(color, 0.55));
        g.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    default:
      break;
  }
}

function paintTexture(ctx: Ctx, d: Design, w: number, h: number) {
  if (d.texture === 'grain') {
    const rand = seeded(4242);
    // ponytail: per-speck grain, capped. Swap for a tiled noise bitmap if this ever shows on the frame budget.
    const count = clamp(Math.round((w * h) / 900), 0, 4000);
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < count; i++) ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#000000';
    for (let i = 0; i < count / 2; i++) ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
    ctx.restore();
  }

  if (d.texture === 'vignette') {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, h * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

function paintBorder(ctx: Ctx, d: Design, w: number, h: number) {
  const inset = Math.max(6, d.border * 0.38);
  ctx.save();
  ctx.strokeStyle = hexToRgba(d.borderColor, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, 10);
  ctx.stroke();

  if (d.border > 20) {
    ctx.strokeStyle = hexToRgba(d.borderColor, 0.34);
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRectPath(ctx, inset + 6, inset + 6, w - (inset + 6) * 2, h - (inset + 6) * 2, 7);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

export function drawPhotoInCell(
  ctx: Ctx,
  img: HTMLImageElement,
  cell: Cell,
  photo: Photo,
  shape: Design['shape'],
) {
  ctx.save();
  shapePath(ctx, shape, cell.x, cell.y, cell.w, cell.h);
  ctx.clip();

  const t = photo.transform;
  ctx.filter = filterString(photo.filters);
  ctx.translate(cell.x + cell.w / 2 + t.x * cell.w, cell.y + cell.h / 2 + t.y * cell.h);
  ctx.rotate((t.rotation * Math.PI) / 180);

  const iw = img.naturalWidth || photo.w;
  const ih = img.naturalHeight || photo.h;
  const s = coverScale(iw, ih, cell.w, cell.h) * t.scale;
  ctx.drawImage(img, (-iw * s) / 2, (-ih * s) / 2, iw * s, ih * s);
  ctx.restore();

  // A hairline keeps light photos from bleeding into light frames.
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1;
  shapePath(ctx, shape, cell.x, cell.y, cell.w, cell.h);
  ctx.stroke();
  ctx.restore();
}

function drawEmptyCell(ctx: Ctx, cell: Cell, d: Design, index: number) {
  ctx.save();
  ctx.fillStyle = hexToRgba(isLight(d.bg) ? '#000000' : '#FFFFFF', 0.05);
  shapePath(ctx, d.shape, cell.x, cell.y, cell.w, cell.h);
  ctx.fill();

  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = hexToRgba(d.borderColor, 0.4);
  ctx.lineWidth = 1.5;
  shapePath(ctx, d.shape, cell.x, cell.y, cell.w, cell.h);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = hexToRgba(d.borderColor, 0.75);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 15px Inter, sans-serif`;
  ctx.fillText(`Frame ${index + 1}`, cell.x + cell.w / 2, cell.y + cell.h / 2);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Overlay items                                                       */
/* ------------------------------------------------------------------ */

export function textMetrics(ctx: Ctx, it: TextItem) {
  ctx.font = `${it.weight} ${it.size}px "${it.font}", Inter, sans-serif`;
  const lines = it.text.length ? it.text.split('\n') : [' '];
  const w = Math.max(...lines.map((l) => ctx.measureText(l || ' ').width), 8);
  const lh = it.size * 1.18;
  return { lines, w, h: lines.length * lh, lh };
}

export function itemBox(ctx: Ctx, it: Item): { w: number; h: number } {
  if (it.kind === 'sticker') return { w: it.size, h: it.size };
  const m = textMetrics(ctx, it);
  return { w: m.w, h: m.h };
}

function drawItem(ctx: Ctx, it: Item, tint: string) {
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate((it.rotation * Math.PI) / 180);
  ctx.globalAlpha = it.opacity;

  if (it.kind === 'sticker') {
    ctx.font = `${it.size}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Colour emoji ignore fillStyle; monochrome ornament glyphs pick up the frame accent.
    ctx.fillStyle = tint;
    ctx.fillText(it.char, 0, it.size * 0.04);
  } else {
    const m = textMetrics(ctx, it);
    ctx.textBaseline = 'middle';
    ctx.textAlign = it.align;
    const originX = it.align === 'left' ? -m.w / 2 : it.align === 'right' ? m.w / 2 : 0;

    if (it.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = it.size * 0.28;
      ctx.shadowOffsetY = it.size * 0.06;
    }

    m.lines.forEach((line, i) => {
      const y = -m.h / 2 + m.lh / 2 + i * m.lh;
      if (it.strokeWidth > 0) {
        ctx.lineJoin = 'round';
        ctx.strokeStyle = it.strokeColor;
        ctx.lineWidth = it.strokeWidth;
        ctx.strokeText(line, originX, y);
      }
      ctx.fillStyle = it.color;
      ctx.fillText(line, originX, y);
    });
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Selection handles (the mini editor engine)                          */
/* ------------------------------------------------------------------ */

export interface HandlePoints {
  hw: number;
  hh: number;
  scale: [number, number];
  rotate: [number, number];
  corners: [number, number][];
}

export function handlePoints(ctx: Ctx, it: Item, ui: number): HandlePoints {
  const box = itemBox(ctx, it);
  const hw = box.w / 2 + 8 * ui;
  const hh = box.h / 2 + 8 * ui;
  const th = (it.rotation * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const map = (px: number, py: number): [number, number] => [
    it.x + px * cos - py * sin,
    it.y + px * sin + py * cos,
  ];
  return {
    hw,
    hh,
    scale: map(hw, hh),
    rotate: map(0, -hh - 28 * ui),
    corners: [map(-hw, -hh), map(hw, -hh), map(hw, hh), map(-hw, hh)],
  };
}

const SELECT_COLOR = '#2F7898';

function drawSelection(ctx: Ctx, it: Item, ui: number) {
  const hp = handlePoints(ctx, it, ui);
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate((it.rotation * Math.PI) / 180);

  // White halo under a rose rule: legible on both blush frames and dark photos.
  ctx.lineWidth = 3.5 * ui;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeRect(-hp.hw, -hp.hh, hp.hw * 2, hp.hh * 2);
  ctx.lineWidth = 1.5 * ui;
  ctx.strokeStyle = SELECT_COLOR;
  ctx.strokeRect(-hp.hw, -hp.hh, hp.hw * 2, hp.hh * 2);

  ctx.beginPath();
  ctx.moveTo(0, -hp.hh);
  ctx.lineTo(0, -hp.hh - 28 * ui);
  ctx.strokeStyle = SELECT_COLOR;
  ctx.stroke();
  ctx.restore();

  const dot = (p: [number, number], r: number, fill: string) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], r * ui, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.5 * ui;
    ctx.strokeStyle = SELECT_COLOR;
    ctx.stroke();
  };

  hp.corners.forEach((c) => dot(c, 3.5, '#FFFFFF'));
  dot(hp.scale, 6.5, '#FFFFFF');
  dot(hp.rotate, 6.5, '#FFFFFF');
}

/* ------------------------------------------------------------------ */
/* Hit testing                                                         */
/* ------------------------------------------------------------------ */

export function hitTestItem(ctx: Ctx, items: Item[], px: number, py: number, pad = 6): Item | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    const box = itemBox(ctx, it);
    const th = (it.rotation * Math.PI) / 180;
    const dx = px - it.x;
    const dy = py - it.y;
    const lx = dx * Math.cos(th) + dy * Math.sin(th);
    const ly = -dx * Math.sin(th) + dy * Math.cos(th);
    if (Math.abs(lx) <= box.w / 2 + pad && Math.abs(ly) <= box.h / 2 + pad) return it;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main render                                                         */
/* ------------------------------------------------------------------ */

export interface RenderOptions {
  design: Design;
  photos: Photo[];
  images: Map<string, HTMLImageElement>;
  /** Backing-store width in px. Everything else derives from it. */
  pixelWidth: number;
  selectedId?: string | null;
  showHandles?: boolean;
  /** Design units per CSS pixel — keeps handles a constant on-screen size. */
  ui?: number;
  date?: Date;
}

export function renderStrip(ctx: Ctx, o: RenderOptions): StripLayout {
  const d = o.design;
  const layout = computeLayout(d);
  const k = o.pixelWidth / DESIGN_W;

  ctx.save();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, layout.width, layout.height);

  paintBackground(ctx, d, layout.width, layout.height);

  layout.cells.forEach((cell, i) => {
    const photo = o.photos[i];
    const img = photo ? o.images.get(photo.src) : undefined;
    if (photo && img && img.complete && img.naturalWidth) {
      drawPhotoInCell(ctx, img, cell, photo, d.shape);
    } else {
      drawEmptyCell(ctx, cell, d, i);
    }
  });

  if (d.frameOverlay) {
    const frameImg = o.images.get(d.frameOverlay);
    if (frameImg && frameImg.complete && frameImg.naturalWidth) {
      ctx.drawImage(frameImg, 0, 0, layout.width, layout.height);
    }
  } else {
    if (layout.footerH) drawFooter(ctx, d, layout, o.date ?? new Date());
    paintTexture(ctx, d, layout.width, layout.height);
    paintBorder(ctx, d, layout.width, layout.height);
  }

  d.items.forEach((it) => drawItem(ctx, it, d.borderColor));

  if (o.showHandles && o.selectedId) {
    const sel = d.items.find((i) => i.id === o.selectedId);
    if (sel) drawSelection(ctx, sel, o.ui ?? 1);
  }

  ctx.restore();
  return layout;
}

function drawFooter(ctx: Ctx, d: Design, layout: StripLayout, date: Date) {
  const light = isLight(d.bg);
  const primary = light ? 'rgba(17,17,20,0.92)' : 'rgba(255,255,255,0.94)';
  const secondary = light ? 'rgba(17,17,20,0.55)' : 'rgba(255,255,255,0.6)';
  const cx = layout.width / 2;
  const top = layout.footerY;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = hexToRgba(d.borderColor, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 26, top + 16);
  ctx.lineTo(cx - 8, top + 16);
  ctx.moveTo(cx + 8, top + 16);
  ctx.lineTo(cx + 26, top + 16);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(d.borderColor, 0.9);
  ctx.font = '9px Inter, sans-serif';
  ctx.fillText('◆', cx, top + 16);

  if (d.title) {
    ctx.fillStyle = primary;
    ctx.font = `600 ${d.titleFont === 'Bebas Neue' ? 32 : 27}px "${d.titleFont}", Georgia, serif`;
    ctx.fillText(d.title, cx, top + 44);
  }

  const meta = [d.subtitle, d.showDate ? formatDate(date) : ''].filter(Boolean).join('   ·   ');
  if (meta) {
    ctx.fillStyle = secondary;
    ctx.font = '400 13px Inter, sans-serif';
    ctx.fillText(meta, cx, top + 68);
  }

  ctx.fillStyle = light ? 'rgba(17,17,20,0.35)' : 'rgba(255,255,255,0.34)';
  ctx.font = '600 9.5px Inter, sans-serif';
  ctx.fillText('A C M   P H O T O   B O O T H   •   2 0 2 6', cx, top + 86);
  ctx.restore();
}

export function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
