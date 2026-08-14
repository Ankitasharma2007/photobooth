import type { Filters, ShapeId } from './types';

export type Ctx = CanvasRenderingContext2D;

/** Deterministic PRNG so confetti/grain look identical in the preview and the 4x export. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function coverScale(iw: number, ih: number, cw: number, ch: number) {
  return Math.max(cw / iw, ch / ih);
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** roundRect ships everywhere modern, but kiosks run old WebViews — draw it by hand. */
export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function heartPath(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const top = y + h * 0.28;
  ctx.moveTo(cx, y + h * 0.97);
  ctx.bezierCurveTo(x - w * 0.12, y + h * 0.55, x + w * 0.1, y - h * 0.06, cx, top);
  ctx.bezierCurveTo(x + w * 0.9, y - h * 0.06, x + w * 1.12, y + h * 0.55, cx, y + h * 0.97);
  ctx.closePath();
}

/** Builds the clip path for a photo cell. Square/circle/heart inscribe inside the cell. */
export function shapePath(ctx: Ctx, shape: ShapeId, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  const side = Math.min(w, h);
  const ox = x + (w - side) / 2;
  const oy = y + (h - side) / 2;

  switch (shape) {
    case 'rounded':
      roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.09);
      break;
    case 'square':
      ctx.rect(ox, oy, side, side);
      break;
    case 'circle':
      ctx.arc(x + w / 2, y + h / 2, side / 2, 0, Math.PI * 2);
      break;
    case 'heart':
      heartPath(ctx, ox, oy, side, side);
      break;
    default:
      ctx.rect(x, y, w, h);
  }
}

export function filterString(f: Filters) {
  const parts: string[] = [];
  if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
  if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
  if (f.saturate !== 1) parts.push(`saturate(${f.saturate})`);
  if (f.grayscale) parts.push(`grayscale(${f.grayscale})`);
  if (f.sepia) parts.push(`sepia(${f.sepia})`);
  if (f.blur) parts.push(`blur(${f.blur}px)`);
  if (f.hue) parts.push(`hue-rotate(${f.hue}deg)`);
  return parts.length ? parts.join(' ') : 'none';
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Perceived luminance — used to pick readable footer text over any frame colour. */
export function isLight(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return false;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

export const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
