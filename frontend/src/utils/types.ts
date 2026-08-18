/** Core domain model. The renderer, the store and the export pipeline all speak this. */

export type Lang = 'en' | 'es' | 'fr' | 'ja';
export type ScreenId = 'welcome' | 'capture' | 'review' | 'design' | 'final';
export type ThemeId = 'wedding' | 'birthday' | 'corporate' | 'festival';

export type ShapeId = 'original' | 'square' | 'circle' | 'heart' | 'rounded';
export type PatternId = 'solid' | 'gradient' | 'dots' | 'grid' | 'confetti' | 'aurora';
export type TextureId = 'none' | 'grain' | 'vignette';
export type LayoutId = 'strip4' | 'strip3' | 'grid4' | 'single';
export type AspectId = 'free' | 'square' | 'portrait' | 'landscape' | 'strip';

/** Photo placement inside its cell. x/y are fractions of the cell, so they survive a layout change. */
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  blur: number;
  hue: number;
}

export interface Photo {
  id: string;
  src: string;
  w: number;
  h: number;
  transform: Transform;
  filters: Filters;
  aspect: AspectId;
  takenAt: number;
}

interface BaseItem {
  id: string;
  /** Design-space coordinates (see DESIGN_W). */
  x: number;
  y: number;
  rotation: number;
  opacity: number;
}

export interface StickerItem extends BaseItem {
  kind: 'sticker';
  char: string;
  size: number;
}

export interface TextItem extends BaseItem {
  kind: 'text';
  text: string;
  size: number;
  font: string;
  weight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
  strokeWidth: number;
  strokeColor: string;
}

export type Item = StickerItem | TextItem;

export interface Design {
  layout: LayoutId;
  theme: ThemeId;
  shape: ShapeId;
  /** Frame padding in design units — doubles as "border thickness". */
  border: number;
  borderColor: string;
  bg: string;
  bgAccent: string;
  pattern: PatternId;
  texture: TextureId;
  title: string;
  subtitle: string;
  titleFont: string;
  showDate: boolean;
  items: Item[];
}

export interface Template {
  id: string;
  name: string;
  design: Design;
  createdAt: number;
}

export type Handle = 'move' | 'scale' | 'rotate';
