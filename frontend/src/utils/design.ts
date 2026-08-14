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
  strip3: { cols: 1, rows: 2, aspect: 4 / 3, label: '2 Strip', count: 2 },
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
  swatch: [string, string];
  design: Partial<Design>;
};

export const FRAMES: FramePreset[] = [
  {
    id: 'ivory',
    name: 'Ivory Blush',
    category: 'wedding',
    swatch: ['#FDF0E9', '#C0748C'],
    design: {
      bg: '#FDF0E9',
      bgAccent: '#F2D3C8',
      borderColor: '#C0748C',
      pattern: 'solid',
      texture: 'none',
      shape: 'rounded',
      border: 30,
      titleFont: 'Playfair Display',
      title: 'Forever & Always',
      subtitle: 'Emma & Liam',
    },
  },
  {
    id: 'blush-linen',
    name: 'Blush Linen',
    category: 'wedding',
    swatch: ['#FBEAE6', '#B76E79'],
    design: {
      bg: '#FBEAE6',
      bgAccent: '#F0CFC8',
      borderColor: '#B76E79',
      pattern: 'gradient',
      texture: 'grain',
      shape: 'circle',
      border: 34,
      titleFont: 'Dancing Script',
      title: 'Just Married',
      subtitle: 'With love',
    },
  },
  {
    id: 'rose-champagne',
    name: 'Rose Champagne',
    category: 'wedding',
    swatch: ['#F7EFE4', '#D8A46B'],
    design: {
      bg: '#F7EFE4',
      bgAccent: '#EBD8BE',
      borderColor: '#D8A46B',
      pattern: 'aurora',
      texture: 'grain',
      shape: 'rounded',
      border: 28,
      titleFont: 'Playfair Display',
      title: 'The Reception',
      subtitle: 'Est. Tonight',
    },
  },
  {
    id: 'confetti-pop',
    name: 'Confetti Pop',
    category: 'birthday',
    swatch: ['#FFF0F6', '#E48FB1'],
    design: {
      bg: '#FFF0F6',
      bgAccent: '#F7C9DC',
      borderColor: '#E48FB1',
      pattern: 'confetti',
      texture: 'none',
      shape: 'rounded',
      border: 26,
      titleFont: 'Bebas Neue',
      title: 'HAPPY BIRTHDAY',
      subtitle: 'Make a wish',
    },
  },
  {
    id: 'candy',
    name: 'Candy Shop',
    category: 'birthday',
    swatch: ['#FFF4F8', '#EF9BB6'],
    design: {
      bg: '#FFF4F8',
      bgAccent: '#FBD7E4',
      borderColor: '#EF9BB6',
      pattern: 'dots',
      texture: 'none',
      shape: 'circle',
      border: 32,
      titleFont: 'Caveat',
      title: 'Party Time!',
      subtitle: 'Sweet sixteen',
    },
  },
  {
    id: 'peach-balloon',
    name: 'Peach Balloon',
    category: 'birthday',
    swatch: ['#FFF3EA', '#F0A882'],
    design: {
      bg: '#FFF3EA',
      bgAccent: '#FAD9C2',
      borderColor: '#F0A882',
      pattern: 'gradient',
      texture: 'grain',
      shape: 'heart',
      border: 28,
      titleFont: 'Bebas Neue',
      title: 'LET’S CELEBRATE',
      subtitle: 'Cheers to you',
    },
  },
  {
    id: 'sand-studio',
    name: 'Sand Studio',
    category: 'corporate',
    swatch: ['#FAF3EC', '#C6A08C'],
    design: {
      bg: '#FAF3EC',
      bgAccent: '#EADCCD',
      borderColor: '#C6A08C',
      pattern: 'grid',
      texture: 'none',
      shape: 'square',
      border: 24,
      titleFont: 'Inter',
      title: 'ACME SUMMIT 2026',
      subtitle: 'Booth 14 · Hall B',
    },
  },
  {
    id: 'paper-white',
    name: 'Paper White',
    category: 'corporate',
    swatch: ['#FFFFFF', '#8C6B72'],
    design: {
      bg: '#FFFFFF',
      bgAccent: '#F1E6E2',
      borderColor: '#8C6B72',
      pattern: 'solid',
      texture: 'none',
      shape: 'original',
      border: 22,
      titleFont: 'Inter',
      title: 'PRODUCT LAUNCH',
      subtitle: 'Thanks for stopping by',
    },
  },
  {
    id: 'oat-linen',
    name: 'Oat Linen',
    category: 'corporate',
    swatch: ['#F4EFE9', '#A9927F'],
    design: {
      bg: '#F4EFE9',
      bgAccent: '#E3D7C8',
      borderColor: '#A9927F',
      pattern: 'gradient',
      texture: 'grain',
      shape: 'rounded',
      border: 26,
      titleFont: 'Inter',
      title: 'ANNUAL OFFSITE',
      subtitle: 'Team photo wall',
    },
  },
  {
    id: 'lilac-haze',
    name: 'Lilac Haze',
    category: 'festival',
    swatch: ['#F8F1FA', '#C2A5C9'],
    design: {
      bg: '#F8F1FA',
      bgAccent: '#E4D2EC',
      borderColor: '#C2A5C9',
      pattern: 'aurora',
      texture: 'grain',
      shape: 'rounded',
      border: 26,
      titleFont: 'Bebas Neue',
      title: 'LILAC HAZE',
      subtitle: 'Main stage',
    },
  },
  {
    id: 'sunset-fest',
    name: 'Golden Hour',
    category: 'festival',
    swatch: ['#FFF1E8', '#E9A08A'],
    design: {
      bg: '#FFF1E8',
      bgAccent: '#F8D2BC',
      borderColor: '#E9A08A',
      pattern: 'gradient',
      texture: 'grain',
      shape: 'circle',
      border: 30,
      titleFont: 'Playfair Display',
      title: 'Golden Hour',
      subtitle: 'Day two',
    },
  },
  {
    id: 'pearl',
    name: 'Pearl Dust',
    category: 'festival',
    swatch: ['#FDF8F6', '#DCB4C2'],
    design: {
      bg: '#FDF8F6',
      bgAccent: '#F0DDE4',
      borderColor: '#DCB4C2',
      pattern: 'dots',
      texture: 'vignette',
      shape: 'square',
      border: 24,
      titleFont: 'Bebas Neue',
      title: 'AFTERGLOW',
      subtitle: 'Dance floor',
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
  const preset = FRAMES.find((f) => f.category === theme)!;
  return {
    layout: 'strip4',
    theme,
    shape: 'rounded',
    border: 28,
    borderColor: '#C0748C',
    bg: '#FDF4EF',
    bgAccent: '#F3DCD2',
    pattern: 'solid',
    texture: 'none',
    title: '',
    subtitle: '',
    titleFont: 'Playfair Display',
    showDate: true,
    items: [],
    ...preset.design,
  };
}

export const DEFAULT_DESIGN: Design = themeDefaults('wedding');

export const uid = () => Math.random().toString(36).slice(2, 10);
