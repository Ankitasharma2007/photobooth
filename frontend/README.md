# Lumière · Photo Booth Studio

A production-ready photo-booth web app: capture → crop → design → print. Blush-and-beige
premium UI, a canvas editor with smart decorative sticker placement, and print-resolution export.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

> The camera needs a **secure origin**. `http://localhost` works; opening the dev URL from
> another device over `http://192.168.x.x` does not — the app detects this and says so. Use
> `https://` (or a tunnel) for LAN/kiosk testing.
>
> Don't run `npm run build` while `npm run dev` is running — they share `.next` and the dev
> server will start serving a broken bundle.

## Screens

| Screen | What it does |
| --- | --- |
| **Welcome** | Brand, event theme (Wedding / Birthday / Corporate / Festival), strip layout, language (EN/ES/FR/JA) |
| **Camera** | Live preview, framing reticle, 3-2-1 countdown with beeps, flash + synthesised shutter, live filter tiles, brightness/contrast/saturation, mirror, thirds grid, device picker, `Space` to shoot |
| **Review** | Gallery with drag-reorder + delete, canvas crop stage (drag to pan, wheel to zoom, rotate), aspect chips, Reset / Cancel / Confirm |
| **Design studio** | Frames, layout, photo shape, background pattern & texture, border, footer text, stickers, text layers, per-photo grading, saved templates |
| **Final** | Full-resolution preview, quality + format picker, Download / Print / Share, session summary |

## Architecture

```
src/
├ app/            Next.js App Router entry (page.tsx = screen switcher)
├ components/     CameraModule, PhotoCapture, CountdownTimer, CropEditor, PhotoCanvas,
│                 FrameSelector, StickerEditor, TextEditor, StripDesigner,
│                 TemplateManager, ExportManager, ui/ (design system)
├ hooks/          useCamera, useShutter, useImages
├ services/       store (zustand), exporter, storage
├ utils/          types, design (presets), canvas, renderStrip, placement, i18n, selftest
└ styles/         globals.css
```

### One renderer, two outputs

`utils/renderStrip.ts` draws the whole strip in a virtual 600-unit-wide design space.
`PhotoCanvas` scales it to the on-screen preview; `services/exporter.ts` scales the *same
draw call* to 1200–4800 px. The preview is therefore WYSIWYG by construction — there is no
second DOM-based renderer to drift out of sync.

Selection, drag, resize and rotate are hit-tested directly on that canvas (`hitTestItem`,
`handlePoints`), which is why there's no Fabric.js/Konva dependency: the shapes, filters and
fonts all had to be drawn in canvas for export anyway.

### Smart decorative placement

`utils/placement.ts` treats stickers as ornaments, not paste-ons:

- **Safe zones** — frame corners, outer side margins, inter-cell gaps, top band, footer band.
- **Protected subject area** — an ellipse covering the middle 34%×36% of every photo cell.
  `isSafe()` rejects any position that would intrude on it, for auto-placement *and* presets.
- **Balanced order** — corners are visited `(round + cellIndex) % 4` so consecutive stickers
  alternate sides and spread down the strip; `arrange()` additionally steers each sticker to
  whichever side is currently lighter.
- **Deterministic variation** — size and tilt come from a seeded PRNG keyed on slot index, so
  a layout looks composed rather than random, and the preview matches the export exactly.

Eight one-click presets (Cute, Romantic, Birthday, Wedding, Minimal, Kawaii, Elegant, Party),
plus **Beautify layout** (re-flow existing stickers) and **Reset** (clear them). Placement
changes are eased on the canvas, so stickers glide into position. Manual drag / resize /
rotate / layer order / delete all still work and always win.

Monochrome glyphs in the **Ornaments** pack are tinted with the frame's border colour; colour
emoji ignore the fill.

### Export quality

| Preset | Scale | Output (classic strip) | Use |
| --- | --- | --- | --- |
| Standard | 2× | 1200 × 3664 | Web & social |
| High | 4× | 2400 × 7328 | 300 DPI print |
| **Max** (default) | 8× | 4800 × 14656 | Archival / large print |

PNG lossless by default, JPEG 95% optional. If a device can't allocate the canvas, the
renderer halves the scale and retries, and the toast reports what it actually produced.
Printing caps at 4× — no printer resolves more.

### State & storage

`zustand` store in `services/store.ts`. `services/storage.ts` persists **design drafts,
templates and preferences** to `localStorage`. Photos stay in memory: base64 frames blow the
5 MB quota within one session — move to IndexedDB if "resume my session" becomes a requirement.

## Checks

`utils/selftest.ts` asserts the strip layout maths, cover-fit, PRNG determinism (the preview
and the 4×/8× export must draw identical confetti and grain), i18n fallback, and the
placement engine's safety and non-overlap guarantees. It runs automatically in development
from `app/page.tsx` and throws on failure.

To run it standalone:

```bash
npx tsc src/utils/selftest.ts --outDir .tmp --module commonjs --target es2020 \
  --moduleResolution node --skipLibCheck --lib es2020,dom
node -e "require('./.tmp/selftest.js').runSelfTest(); console.log('OK')"
```

## Deliberate simplifications

- **Framing reticle, not face detection.** Real face tracking needs a ~2 MB model
  (face-api / MediaPipe). The safe-zone engine makes it unnecessary for placement.
- **Emoji stickers.** They render identically in the DOM picker and in canvas export with no
  asset pipeline. Add SVG/PNG packs behind the same `StickerItem` shape when brand art matters.
- **No auth / backend.** Everything runs client-side; the store and exporter are the seams to
  add an API behind.
