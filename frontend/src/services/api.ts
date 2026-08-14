/**
 * Client for the FastAPI booth backend (photobooth/main.py).
 *
 * Every route the server exposes is covered here:
 *   GET  /                        health
 *   GET  /templates               catalogue + slot counts
 *   POST /session                 new session
 *   POST /session/{id}/upload     one photo (multipart field "photo")
 *   GET  /session/{id}/photos     what the server actually stored
 *   POST /session/{id}/generate   collage + frame -> output/final_hd.png
 *   GET  /session/{id}/download   that PNG
 *   POST /session/{id}/email      queue it for delivery
 */

import { filterString } from '@/utils/canvas';
import type { Photo } from '@/utils/types';

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
);

export interface ServerSession {
  sessionId: string;
  status: string;
  createdAt: string;
}

export interface ServerPhoto {
  id: string;
  filename: string;
  uploadedAt: string;
}

export interface ServerTemplate {
  id: string;
  layout: string;
  frame: string;
  slots: number;
}

export interface GenerateResult {
  success: boolean;
  message: string;
  sessionId: string;
  templateId: string;
  layout: string;
  frame: string;
  collage: string;
  final_image: string;
}

export interface QueuedEmail {
  queueId: number;
  sessionId: string;
  email: string;
  status: string;
}

/** FastAPI puts the reason in `detail` — a string for HTTPException, a list for 422. */
async function reason(res: Response) {
  try {
    const body = (await res.json()) as { detail?: unknown };
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined;
      if (first?.msg) return first.msg;
    }
  } catch {
    /* not JSON — fall through to the status line */
  }
  return `${res.status} ${res.statusText}`;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error(`Cannot reach the booth server at ${API_BASE}.`);
  }
  if (!res.ok) throw new Error(await reason(res));
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  health: () => call<{ message: string }>('/'),

  templates: () =>
    call<{ templates: ServerTemplate[] }>('/templates').then((r) => r.templates),

  createSession: () => call<ServerSession>('/session', { method: 'POST' }),

  uploadPhoto: (sessionId: string, blob: Blob, filename: string) => {
    const form = new FormData();
    form.append('photo', blob, filename);
    return call<{ imageId: string; filename: string; uploadedAt: string }>(
      `/session/${sessionId}/upload`,
      { method: 'POST', body: form },
    );
  },

  photos: (sessionId: string) =>
    call<{ count: number; photos: ServerPhoto[] }>(`/session/${sessionId}/photos`),

  generate: (sessionId: string, templateId: string) =>
    call<GenerateResult>(`/session/${sessionId}/generate`, json({ template_id: templateId })),

  /** Plain URL — it is an <img> src and a download link, not a fetch. */
  downloadUrl: (sessionId: string) => `${API_BASE}/session/${sessionId}/download`,

  email: (sessionId: string, email: string) =>
    call<QueuedEmail>(`/session/${sessionId}/email`, json({ email })),
};

/**
 * Captures carry their filters as data so they stay editable, so bake them in
 * on the way out — otherwise the server print does not match the preview.
 */
export function photoBlob(photo: Photo): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Could not read the captured frame.'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || photo.w;
      canvas.height = img.naturalHeight || photo.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable on this device.'));
      // Unsupported filter strings are ignored by the browser, never thrown.
      ctx.filter = filterString(photo.filters);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the frame.'))),
        'image/jpeg',
        0.92,
      );
    };
    img.src = photo.src;
  });
}
