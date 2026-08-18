import type {
  AspectId,
  Design,
  Filters,
  LayoutId,
  PatternId,
  ShapeId,
  TextureId,
  ThemeId,
} from './types';

/**
 * Everything is authored in a virtual design space 600 units wide. The canvas
 * renderer scales that space to whatever pixel width it is handed, so the
 * on-screen preview and the 4x print export are literally the same draw call.
 */
export const DESIGN_W = 600;
export const CELL_GAP = 16;
export const FOOTER_H = 96;

export const LAYOUTS: Record<
  LayoutId,
  { cols: number; rows: number; aspect: number; label: string; count: number }
> = {
  strip4: { cols: 1, rows: 4, aspect: 4 / 3, label: 'Classic Strip', count: 4 },
  strip3: { cols: 1, rows: 3, aspect: 4 / 3, label: '3 Strip', count: 3 },
  grid4: { cols: 2, rows: 2, aspect: 1, label: 'Quad Grid', count: 4 },
  single: { cols: 1, rows: 1, aspect: 4 / 5, label: 'Poster', count: 1 },
};

export const SHAPES: { id: ShapeId; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'square', label: 'Square' },
  { id: 'circle', label: 'Circle' },
  { id: 'heart', label: 'Heart' },
];

export const PATTERNS: { id: PatternId; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'aurora', label: 'Aurora' },
];

export const TEXTURES: { id: TextureId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'grain', label: 'Film grain' },
  { id: 'vignette', label: 'Vignette' },
];

export const ASPECTS: Record<AspectId, { label: string; value: number | null }> = {
  free: { label: 'Free', value: null },
  square: { label: 'Square', value: 1 },
  portrait: { label: 'Portrait', value: 4 / 5 },
  landscape: { label: 'Landscape', value: 16 / 9 },
  strip: { label: 'Strip', value: 4 / 3 },
};

export const DEFAULT_FILTERS: Filters = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  hue: 0,
};

/** `swatch` is the fallback preview gradient used before any photo exists. */
export const FILTER_PRESETS: {
  id: string;
  label: string;
  filters: Filters;
}[] = [
  { id: 'original', label: 'Original', filters: { ...DEFAULT_FILTERS } },
  {
    id: 'lumiere',
    label: 'Lumière',
    filters: { ...DEFAULT_FILTERS, brightness: 1.1, contrast: 0.96, saturate: 1.14 },
  },
  {
    id: 'blush',
    label: 'Blush',
    filters: { ...DEFAULT_FILTERS, saturate: 1.18, hue: -10, brightness: 1.07, contrast: 0.98 },
  },
  {
    id: 'peach',
    label: 'Peach',
    filters: { ...DEFAULT_FILTERS, sepia: 0.2, saturate: 1.22, brightness: 1.06, hue: -4 },
  },
  {
    id: 'cream',
    label: 'Cream',
    filters: { ...DEFAULT_FILTERS, sepia: 0.28, brightness: 1.08, contrast: 0.94, saturate: 0.94 },
  },
  {
    id: 'rose',
    label: 'Rosé',
    filters: { ...DEFAULT_FILTERS, saturate: 1.3, hue: -16, contrast: 1.04 },
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    filters: { ...DEFAULT_FILTERS, brightness: 1.14, contrast: 0.88, saturate: 1.1, blur: 0.6 },
  },
  {
    id: 'vintage',
    label: 'Vintage',
    filters: { ...DEFAULT_FILTERS, sepia: 0.45, contrast: 1.08, saturate: 0.88 },
  },
  {
    id: 'film',
    label: 'Film',
    filters: { ...DEFAULT_FILTERS, contrast: 1.24, saturate: 0.85, sepia: 0.12 },
  },
  {
    id: 'mocha',
    label: 'Mocha',
    filters: { ...DEFAULT_FILTERS, sepia: 0.55, saturate: 0.8, contrast: 1.12, brightness: 0.98 },
  },
  {
    id: 'noir',
    label: 'Noir',
    filters: { ...DEFAULT_FILTERS, grayscale: 1, contrast: 1.2, brightness: 1.02 },
  },
  {
    id: 'arctic',
    label: 'Arctic',
    filters: { ...DEFAULT_FILTERS, saturate: 1.06, hue: 14, brightness: 1.05, contrast: 1.06 },
  },
];

/** Stand-in image for filter previews before the first frame is captured. */
export const PREVIEW_SWATCH =
  'linear-gradient(150deg,#F9CDBB 0%,#E58AA0 38%,#AE6E92 68%,#5E4A60 100%)';

export const THEMES: Record<
  ThemeId,
  { label: string; tagline: string; accent: string; glow: string; emoji: string }
> = {
  wedding: {
    label: 'Wedding',
    tagline: 'Clean studio elegance',
    accent: '#347A9A',
    glow: 'rgba(52,122,154,0.25)',
    emoji: '💍',
  },
  birthday: {
    label: 'Birthday',
    tagline: 'Celebration photo booth',
    accent: '#347A9A',
    glow: 'rgba(52,122,154,0.25)',
    emoji: '🎂',
  },
  corporate: {
    label: 'Corporate',
    tagline: 'ACM technical edition',
    accent: '#347A9A',
    glow: 'rgba(52,122,154,0.25)',
    emoji: '🏢',
  },
  festival: {
    label: 'Festival',
    tagline: 'ACM Event Experience',
    accent: '#347A9A',
    glow: 'rgba(52,122,154,0.25)',
    emoji: '🎪',
  },
};

export const FONTS: { id: string; label: string; weight: string }[] = [
  { id: 'Playfair Display', label: 'Editorial', weight: '600' },
  { id: 'Inter', label: 'Modern', weight: '600' },
  { id: 'Dancing Script', label: 'Script', weight: '700' },
  { id: 'Bebas Neue', label: 'Poster', weight: '400' },
  { id: 'Caveat', label: 'Marker', weight: '700' },
  { id: 'Georgia', label: 'Classic', weight: '700' },
  { id: 'Courier New', label: 'Typewriter', weight: '700' },
];

/** Frame presets — a partial Design merged over the current one. */
export type FramePreset = {
  id: string;
  name: string;
  category: ThemeId;
  previewImage: string;
  swatch: [string, string];
  design: Partial<Design>;
};

export const FRAMES: FramePreset[] = [
  {
    id: 'spiderman_single',
    name: 'ACM Spider-Man Single',
    category: 'festival',
    previewImage: '/frames/spiderman_single.png',
    swatch: ['#E23636', '#1A1A1A'],
    design: {
      layout: 'single',
      frameOverlay: '/frames/spiderman_single.png',
      frameId: 'spiderman_single',
      bg: '#FFFFFF',
      bgAccent: '#F5F5F5',
      borderColor: '#E23636',
      pattern: 'solid',
      texture: 'none',
      shape: 'original',
      border: 0,
      title: '',
      subtitle: '',
      showDate: false,
    },
  },
  {
    id: 'pop_three',
    name: 'ACM Pop Star 3-Strip',
    category: 'birthday',
    previewImage: '/frames/pop_three.png',
    swatch: ['#182BFF', '#FFDF00'],
    design: {
      layout: 'strip3',
      frameOverlay: '/frames/pop_three.png',
      frameId: 'pop_three',
      bg: '#FFFFFF',
      bgAccent: '#F5F5F5',
      borderColor: '#182BFF',
      pattern: 'solid',
      texture: 'none',
      shape: 'original',
      border: 0,
      title: '',
      subtitle: '',
      showDate: false,
    },
  },
  {
    id: 'retro_four',
    name: 'ACM Retro 4-Strip',
    category: 'wedding',
    previewImage: '/frames/retro_four.png',
    swatch: ['#8B0000', '#F29C38'],
    design: {
      layout: 'strip4',
      frameOverlay: '/frames/retro_four.png',
      frameId: 'retro_four',
      bg: '#8B0000',
      bgAccent: '#F29C38',
      borderColor: '#8B0000',
      pattern: 'solid',
      texture: 'none',
      shape: 'original',
      border: 0,
      title: '',
      subtitle: '',
      showDate: false,
    },
  },
  {
    id: 'doodle_four',
    name: 'ACM Cooked 4-Grid',
    category: 'corporate',
    previewImage: '/frames/doodle_four.png',
    swatch: ['#0D0D0D', '#C05A88'],
    design: {
      layout: 'grid4',
      frameOverlay: '/frames/doodle_four.png',
      frameId: 'doodle_four',
      bg: '#000000',
      bgAccent: '#1A1A1A',
      borderColor: '#C05A88',
      pattern: 'solid',
      texture: 'none',
      shape: 'original',
      border: 0,
      title: '',
      subtitle: '',
      showDate: false,
    },
  },
];

export const STICKER_CATEGORIES: { id: string; label: string; stickers: string[] }[] = [
  {
    id: 'love',
    label: 'Love',
    stickers: [
      '💖', '💕', '💗', '💘', '💝', '❤️', '🩷', '🤍', '💌', '💞', '💓', '🫶',
      '😍', '🥰', '😘', '💋', '🌹', '🌷', '🎀', '💐', '🦢', '🕊️', '🍓', '🧸',
    ],
  },
  {
    id: 'emoji',
    label: 'Faces',
    stickers: [
      '😀', '😄', '😁', '🥹', '😊', '😇', '🙂', '😉', '😌', '😎', '🤩', '🥳',
      '🤪', '😜', '😝', '🤗', '🤭', '🫢', '😳', '🥺', '😻', '🙌', '👏', '✌️',
    ],
  },
  {
    id: 'cute',
    label: 'Cute',
    stickers: [
      '🧸', '🐰', '🐻', '🐼', '🐱', '🐶', '🦋', '🐝', '🐣', '🦄', '🌸', '🌺',
      '🌼', '🌻', '☁️', '🫧', '🍡', '🍥', '🧁', '🍰', '🍓', '🍒', '🩰', '🎠',
    ],
  },
  {
    id: 'celebration',
    label: 'Party',
    stickers: [
      '🎉', '🎊', '🥂', '🍾', '🎈', '✨', '🎆', '🎇', '🪅', '🎀', '🍻', '🎁',
      '🌟', '💫', '🪩', '🎵', '🎶', '🕺', '💃', '🪄', '🧁', '🍭', '🎺', '🔮',
    ],
  },
  {
    id: 'wedding',
    label: 'Wedding',
    stickers: [
      '💍', '👰', '🤵', '💒', '💐', '🕊️', '🥂', '💌', '🤍', '🌹', '🕯️', '💞',
      '🎀', '🍰', '📸', '💖', '🥀', '🪞', '👗', '🫧', '🪺', '⛪', '💎', '🔔',
    ],
  },
  {
    id: 'birthday',
    label: 'Birthday',
    stickers: [
      '🎂', '🧁', '🍰', '🎈', '🎁', '🕯️', '🍭', '🍬', '🍩', '🎠', '🎯', '🪄',
      '🎺', '🥳', '🎪', '🍫', '🍨', '🍦', '🎀', '🎊', '🌈', '⭐', '🪅', '🥤',
    ],
  },
  {
    id: 'fun',
    label: 'Fun',
    stickers: [
      '🕶️', '🎩', '👑', '🥸', '🦄', '🐶', '🐱', '🍕', '🌈', '⚡', '🔥', '💫',
      '🎮', '🏄', '🛹', '🚀', '📸', '🎬', '🎤', '🎧', '🛼', '🍔', '🌮', '🥤',
    ],
  },
  {
    id: 'premium',
    label: 'Premium',
    stickers: [
      '💎', '👑', '🏆', '🥇', '🪙', '🔮', '🗝️', '⚜️', '🧿', '🪞', '🕰️', '📿',
      '🍸', '🎖️', '🪐', '🌙', '🤍', '🕊️', '🥂', '✨', '🪷', '🫧', '🦢', '🏵️',
    ],
  },
  {
    // Monochrome glyphs — the renderer tints these with the frame colour.
    id: 'ornaments',
    label: 'Ornaments',
    stickers: [
      '✦', '✧', '✶', '✷', '❀', '❁', '✿', '❋', '❃', '❦', '❧', '♡',
      '♥', '⟡', '◈', '❖', '✻', '✽', '⁕', '❥', '⚜', '≋', '·', '⌘',
    ],
  },
];

/** One-click decorative styles. The placement engine positions them. */
export const DECOR_PRESETS: { id: string; label: string; chars: string[] }[] = [
  { id: 'cute', label: 'Cute', chars: ['🎀', '🧸', '🌸', '⭐', '🫧', '💕', '🎀', '🌸'] },
  { id: 'romantic', label: 'Romantic', chars: ['🌹', '💗', '🕊️', '✨', '💌', '🤍', '🌹', '✨'] },
  { id: 'birthday', label: 'Birthday', chars: ['🎂', '🎈', '🎉', '🧁', '⭐', '🎊', '🎈', '🍭'] },
  { id: 'wedding', label: 'Wedding', chars: ['💍', '🤍', '🕊️', '💐', '✨', '🥂', '🎀', '💍'] },
  { id: 'minimal', label: 'Minimal', chars: ['✦', '✧', '·', '✦'] },
  { id: 'kawaii', label: 'Kawaii', chars: ['🧸', '🐰', '🍡', '🫧', '⭐', '🎀', '🍓', '🌸'] },
  { id: 'elegant', label: 'Elegant', chars: ['❦', '✦', '❀', '⟡', '❧', '✧', '❀', '✦'] },
  { id: 'party', label: 'Party', chars: ['🎉', '🪩', '🥂', '✨', '🎊', '🎈', '💫', '🎶'] },
];

export function themeDefaults(theme: ThemeId): Design {
  const preset = FRAMES.find((f) => f.category === theme) || FRAMES[0];
  return {
    layout: (preset.design.layout ?? 'strip4') as LayoutId,
    theme,
    shape: 'original',
    border: 0,
    borderColor: preset.design.borderColor ?? '#8B0000',
    bg: preset.design.bg ?? '#FFFFFF',
    bgAccent: preset.design.bgAccent ?? '#F5F5F5',
    pattern: 'solid',
    texture: 'none',
    title: '',
    subtitle: '',
    titleFont: 'Inter',
    showDate: false,
    frameOverlay: preset.design.frameOverlay,
    frameId: preset.id,
    items: [],
    ...preset.design,
  };
}

export const DEFAULT_DESIGN: Design = themeDefaults('wedding');

export const uid = () => Math.random().toString(36).slice(2, 10);
