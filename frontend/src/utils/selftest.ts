import { CELL_GAP, DESIGN_W, LAYOUTS, themeDefaults } from './design';
import { clamp, coverScale, isLight, seeded } from './canvas';
import { computeLayout } from './renderStrip';
import { arrange, decorSlots, isSafe } from './placement';
import { translate } from './i18n';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`[selftest] ${msg}`);
}

/**
 * One runnable check over the non-obvious maths: strip layout, cover-fit, the
 * seeded PRNG the preview and the export must agree on, and i18n fallback.
 * Runs automatically in dev (see src/app/page.tsx).
 */
export function runSelfTest() {
  // --- layout geometry -------------------------------------------------
  for (const id of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
    const d = { ...themeDefaults('wedding'), layout: id, border: 28 };
    const l = computeLayout(d);
    const conf = LAYOUTS[id];

    assert(l.cells.length === conf.cols * conf.rows, `${id}: cell count`);
    assert(l.width === DESIGN_W, `${id}: width is the design space`);

    const last = l.cells[l.cells.length - 1];
    assert(
      Math.abs(last.x + last.w - (DESIGN_W - l.pad)) < 0.001,
      `${id}: right edge respects padding`,
    );
    assert(Math.abs(last.y + last.h - l.footerY) < 0.001, `${id}: footer starts below the grid`);
    assert(
      Math.abs(l.height - (l.footerY + l.footerH + l.pad)) < 0.001,
      `${id}: total height adds up`,
    );
    if (conf.cols > 1) {
      assert(
        Math.abs(l.cells[1].x - (l.cells[0].x + l.cells[0].w) - CELL_GAP) < 0.001,
        `${id}: column gap`,
      );
    }
  }

  // Footer collapses when there is nothing to print in it.
  const bare = { ...themeDefaults('wedding'), title: '', subtitle: '', showDate: false };
  assert(computeLayout(bare).footerH === 0, 'bare strip has no footer band');

  // --- image fitting ---------------------------------------------------
  assert(coverScale(100, 50, 100, 100) === 2, 'cover fills the short axis');
  assert(clamp(5, 0, 1) === 1 && clamp(-5, 0, 1) === 0, 'clamp bounds');

  // --- determinism: preview and 4x export must draw identical confetti --
  const a = seeded(9137);
  const b = seeded(9137);
  assert(a() === b() && a() === b(), 'seeded PRNG is reproducible');
  assert(seeded(1)() !== seeded(2)(), 'different seeds differ');

  // --- decorative placement --------------------------------------------
  for (const id of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
    const d = { ...themeDefaults('wedding'), layout: id };
    const slots = decorSlots(d);
    assert(slots.length >= 8, `${id}: enough decorative anchors`);
    assert(
      slots.every((s) => isSafe(d, s.x, s.y, s.size)),
      `${id}: no anchor intrudes on a subject area`,
    );
    assert(
      slots.every((s) => s.x >= -10 && s.x <= DESIGN_W + 10),
      `${id}: anchors stay on the strip`,
    );

    // A centre-of-frame position must always be rejected.
    const cell = computeLayout(d).cells[0];
    assert(!isSafe(d, cell.x + cell.w / 2, cell.y + cell.h / 2, 40), `${id}: centre is protected`);

    const seeds = Array.from({ length: 8 }, (_, i) => ({
      kind: 'sticker' as const,
      id: `s${i}`,
      char: '✦',
      x: 0,
      y: 0,
      size: 40,
      rotation: 0,
      opacity: 1,
    }));
    const placed = arrange(d, seeds);
    assert(placed.length === seeds.length, `${id}: arrange keeps every sticker`);
    assert(
      placed.every((p) => isSafe(d, p.x, p.y, p.size)),
      `${id}: arranged stickers clear the subjects`,
    );
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const gap = Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y);
        assert(gap > 1, `${id}: arranged stickers do not stack on one point`);
      }
    }
  }

  // --- misc ------------------------------------------------------------
  assert(isLight('#FFFFFF') && !isLight('#0B0A12'), 'luminance split');
  assert(translate('ja', 'download') === 'ダウンロード', 'translation hit');
  assert(translate('ja', 'brand') === 'ACM Photo Booth', 'translation falls back to English');

  return true;
}
