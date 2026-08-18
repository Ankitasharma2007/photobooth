import { seeded } from './canvas';
import { DESIGN_W } from './design';
import { computeLayout } from './renderStrip';
import type { Design, Item, StickerItem } from './types';

/**
 * Decorative placement engine.
 *
 * Stickers are ornaments, not stickers-on-a-face: every candidate position lives
 * in a "safe zone" — frame corners, outer margins, the top band and the footer
 * band — and anything that would intrude on the protected subject ellipse at the
 * centre of a photo cell is rejected outright.
 */

export type SlotKind = 'corner' | 'margin' | 'band' | 'gap';

export interface Slot {
  x: number;
  y: number;
  size: number;
  rotation: number;
  side: 'left' | 'right';
  kind: SlotKind;
}

/** Fraction of a cell reserved for the subject (face / torso). Never decorated. */
const SUBJECT_RX = 0.34;
const SUBJECT_RY = 0.36;

/** Corner visiting order — alternates left/right so a run of adds stays balanced. */
const CORNER_ORDER = [0, 2, 1, 3] as const;

/** Deterministic per-slot jitter, so a layout looks designed rather than random. */
function jitter(i: number) {
  const r = seeded(1000 + i * 7919);
  return { a: r(), b: r(), c: r() };
}

/** True when a sticker of `size` centred at (x,y) clears every subject area. */
export function isSafe(design: Design, x: number, y: number, size: number): boolean {
  const layout = computeLayout(design);
  const r = size * 0.5;
  return layout.cells.every((c) => {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const rx = c.w * SUBJECT_RX + r;
    const ry = c.h * SUBJECT_RY + r;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy >= 1;
  });
}

/** Ordered decorative anchors for the current strip design. */
export function decorSlots(design: Design): Slot[] {
  const layout = computeLayout(design);
  const pad = layout.pad;
  const slots: Slot[] = [];
  let n = 0;

  const push = (
    x: number,
    y: number,
    base: number,
    side: Slot['side'],
    kind: SlotKind,
  ) => {
    const j = jitter(n++);
    slots.push({
      x,
      y,
      size: Math.round(base * (0.86 + j.a * 0.34)),
      rotation: Math.round((j.b - 0.5) * 34),
      side,
      kind,
    });
  };

  // 1. Frame corners — the primary decorative real estate.
  for (let round = 0; round < 4; round++) {
    layout.cells.forEach((c, ci) => {
      const corner = CORNER_ORDER[(round + ci) % 4];
      const ins = Math.min(c.w, c.h) * 0.145;
      const left = corner === 0 || corner === 3;
      const top = corner === 0 || corner === 1;
      push(
        left ? c.x + ins : c.x + c.w - ins,
        top ? c.y + ins : c.y + c.h - ins,
        Math.min(58, Math.min(c.w, c.h) * 0.16),
        left ? 'left' : 'right',
        'corner',
      );
    });
  }

  // 2. Outer side margins — only when the frame is wide enough to hold them.
  if (pad >= 26) {
    layout.cells.forEach((c) => {
      push(pad * 0.5, c.y + c.h * 0.5, Math.min(34, pad * 1.05), 'left', 'margin');
      push(DESIGN_W - pad * 0.5, c.y + c.h * 0.42, Math.min(34, pad * 1.05), 'right', 'margin');
    });
  }

  // 3. Gaps between rows.
  for (let i = 0; i < layout.cells.length - 1; i++) {
    const a = layout.cells[i];
    const b = layout.cells[i + 1];
    if (b.y <= a.y) continue; // same row
    const y = (a.y + a.h + b.y) / 2;
    push(a.x + a.w * 0.16, y, 26, 'left', 'gap');
    push(a.x + a.w * 0.84, y, 26, 'right', 'gap');
  }

  // 4. Top band and footer band.
  push(pad * 1.1, pad * 0.5, Math.min(32, pad), 'left', 'band');
  push(DESIGN_W - pad * 1.1, pad * 0.5, Math.min(32, pad), 'right', 'band');
  if (layout.footerH) {
    push(pad * 1.2, layout.footerY + layout.footerH * 0.42, 30, 'left', 'band');
    push(DESIGN_W - pad * 1.2, layout.footerY + layout.footerH * 0.42, 30, 'right', 'band');
  }

  return slots.filter((s) => isSafe(design, s.x, s.y, s.size));
}

type Placed = { x: number; y: number; size: number };

const occupied = (placed: readonly Placed[], s: Slot) =>
  placed.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < Math.max(s.size, p.size) * 0.85);

/** Next free decorative anchor; falls back to a nudged slot when the strip is full. */
export function nextSlot(design: Design, items: Item[]): Slot {
  const slots = decorSlots(design);
  const free = slots.find((s) => !occupied(items, s));
  if (free) return free;

  const base = slots[items.length % Math.max(1, slots.length)] ?? {
    x: DESIGN_W / 2,
    y: design.border,
    size: 34,
    rotation: 0,
    side: 'left' as const,
    kind: 'band' as const,
  };
  const j = jitter(items.length + 500);
  return { ...base, x: base.x + (j.a - 0.5) * 26, y: base.y + (j.b - 0.5) * 26 };
}

/**
 * Re-flows every sticker onto the ordered slot list: balanced sides, no overlap,
 * subject areas untouched. Text layers are left exactly where the user put them.
 */
export function arrange(design: Design, stickers: StickerItem[]): StickerItem[] {
  const slots = decorSlots(design);
  if (!slots.length) return stickers;

  let left = 0;
  let right = 0;
  const used: Slot[] = [];

  return stickers.map((st, i) => {
    // Prefer the lighter side so the composition never piles up on one edge.
    const wantSide: Slot['side'] = left <= right ? 'left' : 'right';
    const slot =
      slots.find((s) => s.side === wantSide && !used.includes(s) && !occupied(used, s)) ??
      slots.find((s) => !used.includes(s) && !occupied(used, s)) ??
      slots.find((s) => !used.includes(s)) ??
      slots[i % slots.length];

    used.push(slot);
    if (slot.side === 'left') left++;
    else right++;

    return { ...st, x: slot.x, y: slot.y, size: slot.size, rotation: slot.rotation };
  });
}
