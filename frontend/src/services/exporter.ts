import { DESIGN_W } from '@/utils/design';
import { computeLayout, renderStrip } from '@/utils/renderStrip';
import type { Design, Photo } from '@/utils/types';

export const EXPORT_SCALE = 4; // 600 design units -> 2400px wide print file

/** A photo-booth strip is printed 2in wide, which is what the DPI readout assumes. */
export const PRINT_WIDTH_INCHES = 2;

/** Browsers cap total canvas area; stay well under it and step down if we must. */
const MAX_CANVAS_AREA = 240_000_000;

export const QUALITIES = [
  { id: 'standard', label: 'Standard', scale: 2, note: 'Web & social' },
  { id: 'high', label: 'High', scale: 4, note: '300 DPI print' },
  { id: 'max', label: 'Max', scale: 8, note: 'Archival / large print' },
] as const;

export type QualityId = (typeof QUALITIES)[number]['id'];

export const scaleFor = (q: QualityId) =>
  QUALITIES.find((x) => x.id === q)?.scale ?? EXPORT_SCALE;

export function loadImages(photos: Photo[]): Promise<Map<string, HTMLImageElement>> {
  return Promise.all(
    photos.map(
      (p) =>
        new Promise<[string, HTMLImageElement]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([p.src, img]);
          img.onerror = () => resolve([p.src, img]);
          img.src = p.src;
        }),
    ),
  ).then((pairs) => new Map(pairs));
}

/** Output pixel size for a given scale, before any safety clamp. */
export function exportSize(design: Design, scale: number) {
  const layout = computeLayout(design);
  return {
    width: Math.round(DESIGN_W * scale),
    height: Math.round(layout.height * scale),
    dpi: Math.round((DESIGN_W * scale) / PRINT_WIDTH_INCHES),
  };
}

/**
 * Renders the exact same draw call the preview uses, at the requested resolution.
 * Steps the scale down rather than failing if the device can't allocate the canvas.
 */
export async function renderExport(
  design: Design,
  photos: Photo[],
  scale: number = EXPORT_SCALE,
): Promise<{ canvas: HTMLCanvasElement; scale: number }> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const images = await loadImages(photos);
  const layout = computeLayout(design);

  let s = scale;
  while (s > 1 && DESIGN_W * s * layout.height * s > MAX_CANVAS_AREA) s /= 2;

  for (;;) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(DESIGN_W * s);
    canvas.height = Math.round(layout.height * s);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable on this device.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    try {
      renderStrip(ctx, { design, photos, images, pixelWidth: canvas.width, showHandles: false });
      // A canvas that failed to allocate reads back blank/black — probe one pixel.
      ctx.getImageData(0, 0, 1, 1);
      return { canvas, scale: s };
    } catch (e) {
      if (s <= 1) throw e;
      s /= 2;
    }
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image at this size.'))),
      type,
      quality,
    );
  });
}

export function fileName(design: Design, ext = 'png') {
  const slug = (design.title || 'photo-strip')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `acm-photobooth-${slug || 'strip'}-${Date.now()}.${ext}`;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareBlob(blob: Blob, name: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: 'ACM Photo Booth' });
    return 'shared';
  }
  downloadBlob(blob, name);
  return 'downloaded';
}

/**
 * Print via a hidden in-document node + the print stylesheet, so pop-up blockers
 * and kiosk browsers without window.open still work.
 */
export function printDataUrl(dataUrl: string) {
  const host = document.getElementById('print-area');
  if (!host) return;
  host.replaceChildren();
  const img = document.createElement('img');
  img.alt = 'Photo strip';
  img.src = dataUrl;
  host.appendChild(img);
  const done = () => {
    host.replaceChildren();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}
