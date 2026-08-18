'use client';

import { create } from 'zustand';
import {
  DECOR_PRESETS,
  DEFAULT_FILTERS,
  LAYOUTS,
  themeDefaults,
  uid,
} from '@/utils/design';
import { arrange, nextSlot } from '@/utils/placement';
import type {
  AspectId,
  Design,
  Filters,
  Item,
  Lang,
  Photo,
  ScreenId,
  StickerItem,
  Template,
  TextItem,
  ThemeId,
  Transform,
} from '@/utils/types';
import { api, photoBlob } from './api';
import { storage } from './storage';

const IDENTITY: Transform = { x: 0, y: 0, scale: 1, rotation: 0 };

export type UploadState = 'uploading' | 'done' | 'failed';

interface BoothState {
  screen: ScreenId;
  lang: Lang;
  theme: ThemeId;
  photos: Photo[];
  activePhotoId: string | null;
  design: Design;
  selectedItemId: string | null;
  hydrated: boolean;
  templates: Template[];

  // backend session (photobooth/main.py)
  sessionId: string | null;
  uploads: Record<string, UploadState>;
  cloudError: string | null;

  // navigation
  go: (screen: ScreenId) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemeId) => void;
  hydrate: () => void;
  resetSession: () => void;

  // photos
  addPhoto: (src: string, w: number, h: number, filters?: Filters) => void;
  removePhoto: (id: string) => void;
  reorderPhotos: (from: number, to: number) => void;
  orderPhotos: (ids: string[]) => void;
  setActivePhoto: (id: string | null) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  setPhotoTransform: (id: string, t: Partial<Transform>) => void;
  setPhotoAspect: (id: string, aspect: AspectId) => void;

  // design
  patchDesign: (patch: Partial<Design>) => void;
  applyTheme: (theme: ThemeId) => void;

  // items
  addSticker: (char: string) => void;
  beautifyStickers: () => void;
  clearStickers: () => void;
  applyDecorPreset: (id: string) => void;
  addText: (customText?: string) => void;
  updateItem: (id: string, patch: Partial<StickerItem> & Partial<TextItem>) => void;
  removeItem: (id: string) => void;
  raiseItem: (id: string, dir: 1 | -1) => void;
  selectItem: (id: string | null) => void;

  // templates
  saveTemplate: (name: string) => void;
  applyTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
}

/** How many frames the current layout wants. */
export const slotsFor = (design: Design) => LAYOUTS[design.layout].count;

/* ---------------- backend session ----------------
 * The booth works offline; the server is best-effort. Nothing here is allowed
 * to block or break a capture — failures surface as `cloudError` on the final
 * screen and a retry re-syncs from scratch.
 */

let sessionPromise: Promise<string> | null = null;

/** One session per booth run, shared by every in-flight upload. */
function ensureSession(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = api
      .createSession()
      .then((s) => {
        useBooth.setState({ sessionId: s.sessionId, cloudError: null });
        return s.sessionId;
      })
      .catch((e: Error) => {
        sessionPromise = null; // let the next attempt try again
        throw e;
      });
  }
  return sessionPromise;
}

export function resetCloudSession() {
  sessionPromise = null;
  useBooth.setState({ sessionId: null, uploads: {}, cloudError: null });
}

async function syncPhoto(photo: Photo): Promise<void> {
  useBooth.setState((s) => ({ uploads: { ...s.uploads, [photo.id]: 'uploading' } }));
  try {
    const sessionId = await ensureSession();
    await api.uploadPhoto(sessionId, await photoBlob(photo), `${photo.id}.jpg`);
    useBooth.setState((s) => ({ uploads: { ...s.uploads, [photo.id]: 'done' } }));
  } catch (e) {
    useBooth.setState((s) => ({
      uploads: { ...s.uploads, [photo.id]: 'failed' },
      cloudError: (e as Error).message,
    }));
  }
}

/**
 * Returns a session whose server-side photos match the strip on screen.
 *
 * Deletes and retakes leave the server holding stale frames and there is no
 * delete route, so any drift is healed by starting a fresh session and
 * re-uploading — one path that covers every way the two sides fall out of step.
 */
export async function prepareSession(): Promise<string> {
  const local = useBooth.getState().photos;
  if (!local.length) throw new Error('Capture a photo first.');

  let sessionId = await ensureSession();
  const { uploads } = useBooth.getState();
  const synced = await api.photos(sessionId);
  const drifted =
    synced.count !== local.length || local.some((p) => uploads[p.id] !== 'done');

  if (drifted) {
    resetCloudSession();
    sessionId = await ensureSession();
    // Sequential: the server orders photos by upload time, and that order is
    // the order they land in the collage slots.
    for (const photo of local) await syncPhoto(photo);

    const recheck = await api.photos(sessionId);
    if (recheck.count !== local.length) {
      throw new Error(`Only ${recheck.count} of ${local.length} photos reached the server.`);
    }
  }

  return sessionId;
}

export const useBooth = create<BoothState>((set, get) => ({
  screen: 'welcome',
  lang: 'en',
  theme: 'wedding',
  photos: [],
  activePhotoId: null,
  design: themeDefaults('wedding'),
  selectedItemId: null,
  hydrated: false,
  templates: [],
  sessionId: null,
  uploads: {},
  cloudError: null,

  go: (screen) => set({ screen, selectedItemId: null }),

  setLang: (lang) => {
    storage.savePrefs({ ...storage.prefs(), lang });
    set({ lang });
  },

  setTheme: (theme) => {
    storage.savePrefs({ ...storage.prefs(), theme });
    get().applyTheme(theme);
  },

  hydrate: () => {
    const prefs = storage.prefs();
    const draft = storage.draft();
    set({
      hydrated: true,
      templates: storage.templates(),
      lang: (prefs.lang as Lang) ?? 'en',
      theme: (prefs.theme as ThemeId) ?? 'wedding',
      design: draft ?? themeDefaults((prefs.theme as ThemeId) ?? 'wedding'),
    });
  },

  resetSession: () => {
    resetCloudSession();
    set((s) => ({
      screen: 'welcome',
      photos: [],
      activePhotoId: null,
      selectedItemId: null,
      design: { ...s.design, items: [] },
    }));
  },

  addPhoto: (src, w, h, filters) => {
    const photo: Photo = {
      id: uid(),
      src,
      w,
      h,
      transform: { ...IDENTITY },
      filters: filters ? { ...filters } : { ...DEFAULT_FILTERS },
      aspect: 'free',
      takenAt: Date.now(),
    };
    set((s) => ({ photos: [...s.photos, photo], activePhotoId: photo.id }));
    // Every capture path goes through here, so this is the only upload trigger.
    void syncPhoto(photo);
  },

  removePhoto: (id) =>
    set((s) => {
      const photos = s.photos.filter((p) => p.id !== id);
      return {
        photos,
        activePhotoId: s.activePhotoId === id ? (photos[0]?.id ?? null) : s.activePhotoId,
      };
    }),

  reorderPhotos: (from, to) =>
    set((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.photos.length || to >= s.photos.length) {
        return {};
      }
      const photos = [...s.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { photos };
    }),

  orderPhotos: (ids) =>
    set((s) => {
      const byId = new Map(s.photos.map((p) => [p.id, p]));
      const next = ids.map((id) => byId.get(id)).filter(Boolean) as Photo[];
      return next.length === s.photos.length ? { photos: next } : {};
    }),

  setActivePhoto: (id) => set({ activePhotoId: id }),

  updatePhoto: (id, patch) =>
    set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  setPhotoTransform: (id, t) =>
    set((s) => ({
      photos: s.photos.map((p) => (p.id === id ? { ...p, transform: { ...p.transform, ...t } } : p)),
    })),

  setPhotoAspect: (id, aspect) =>
    set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, aspect } : p)) })),

  patchDesign: (patch) =>
    set((s) => {
      const design = { ...s.design, ...patch };
      storage.saveDraft(design);
      return { design };
    }),

  applyTheme: (theme) =>
    set((s) => {
      const design: Design = { ...themeDefaults(theme), layout: s.design.layout, items: s.design.items };
      storage.saveDraft(design);
      return { theme, design };
    }),

  /** Placed by the decorative engine — corners, margins and bands only. */
  addSticker: (char) =>
    set((s) => {
      const slot = nextSlot(s.design, s.design.items);
      const item: StickerItem = {
        kind: 'sticker',
        id: uid(),
        char,
        x: slot.x,
        y: slot.y,
        size: slot.size,
        rotation: slot.rotation,
        opacity: 1,
      };
      const design = { ...s.design, items: [...s.design.items, item] };
      storage.saveDraft(design);
      return { design, selectedItemId: item.id };
    }),

  beautifyStickers: () =>
    set((s) => {
      const stickers = s.design.items.filter((i): i is StickerItem => i.kind === 'sticker');
      if (!stickers.length) return {};
      const placed = new Map(arrange(s.design, stickers).map((st) => [st.id, st]));
      const items = s.design.items.map((it) => placed.get(it.id) ?? it);
      const design = { ...s.design, items };
      storage.saveDraft(design);
      return { design };
    }),

  clearStickers: () =>
    set((s) => {
      const design = { ...s.design, items: s.design.items.filter((i) => i.kind !== 'sticker') };
      storage.saveDraft(design);
      return { design, selectedItemId: null };
    }),

  applyDecorPreset: (id) =>
    set((s) => {
      const preset = DECOR_PRESETS.find((p) => p.id === id);
      if (!preset) return {};
      const seeds: StickerItem[] = preset.chars.map((char) => ({
        kind: 'sticker',
        id: uid(),
        char,
        x: 0,
        y: 0,
        size: 40,
        rotation: 0,
        opacity: 1,
      }));
      const keep = s.design.items.filter((i) => i.kind !== 'sticker');
      const design = { ...s.design, items: [...keep, ...arrange(s.design, seeds)] };
      storage.saveDraft(design);
      return { design, selectedItemId: null };
    }),

  addText: (customText?: string) =>
    set((s) => {
      const item: TextItem = {
        kind: 'text',
        id: uid(),
        text: customText?.trim() ? customText.trim() : 'Your text',
        x: 300,
        y: 240,
        size: 38,
        rotation: 0,
        opacity: 1,
        font: 'Inter',
        weight: '700',
        color: '#FFFFFF',
        align: 'center',
        shadow: true,
        strokeWidth: 2,
        strokeColor: '#000000',
      };
      const design = { ...s.design, items: [...s.design.items, item] };
      storage.saveDraft(design);
      return { design, selectedItemId: item.id };
    }),

  updateItem: (id, patch) =>
    set((s) => {
      const items = s.design.items.map((it) =>
        it.id === id ? ({ ...it, ...patch } as Item) : it,
      );
      return { design: { ...s.design, items } };
    }),

  removeItem: (id) =>
    set((s) => {
      const design = { ...s.design, items: s.design.items.filter((i) => i.id !== id) };
      storage.saveDraft(design);
      return { design, selectedItemId: null };
    }),

  raiseItem: (id, dir) =>
    set((s) => {
      const items = [...s.design.items];
      const i = items.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= items.length) return {};
      [items[i], items[j]] = [items[j], items[i]];
      return { design: { ...s.design, items } };
    }),

  selectItem: (id) => set({ selectedItemId: id }),

  saveTemplate: (name) =>
    set((s) => {
      const templates = [
        { id: uid(), name: name.trim() || 'Untitled template', design: s.design, createdAt: Date.now() },
        ...s.templates,
      ].slice(0, 24);
      storage.saveTemplates(templates);
      return { templates };
    }),

  applyTemplate: (id) =>
    set((s) => {
      const tpl = s.templates.find((t) => t.id === id);
      if (!tpl) return {};
      const design = { ...tpl.design, items: tpl.design.items.map((it) => ({ ...it, id: uid() })) };
      storage.saveDraft(design);
      return { design, theme: design.theme, selectedItemId: null };
    }),

  deleteTemplate: (id) =>
    set((s) => {
      const templates = s.templates.filter((t) => t.id !== id);
      storage.saveTemplates(templates);
      return { templates };
    }),
}));

/** Convenience selector for the translated-string helper. */
export const useLang = () => useBooth((s) => s.lang);
