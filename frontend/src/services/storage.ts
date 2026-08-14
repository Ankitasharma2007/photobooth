import type { Design, Template } from '@/utils/types';

const KEY_TEMPLATES = 'lumiere.templates.v1';
const KEY_DRAFT = 'lumiere.draft.v1';
const KEY_PREFS = 'lumiere.prefs.v1';

/**
 * ponytail: photos stay in memory. Base64 frames blow the 5MB localStorage quota
 * within one session — move to IndexedDB when "resume my session" becomes a real ask.
 */
function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — the booth keeps running without persistence */
  }
}

export const storage = {
  templates: () => read<Template[]>(KEY_TEMPLATES, []),
  saveTemplates: (t: Template[]) => write(KEY_TEMPLATES, t),

  draft: () => read<Design | null>(KEY_DRAFT, null),
  saveDraft: (d: Design) => write(KEY_DRAFT, d),

  prefs: () => read<{ lang?: string; theme?: string }>(KEY_PREFS, {}),
  savePrefs: (p: { lang?: string; theme?: string }) => write(KEY_PREFS, p),
};
