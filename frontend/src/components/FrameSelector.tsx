'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useBooth } from '@/services/store';
import { FRAMES, LAYOUTS, PATTERNS, SHAPES, TEXTURES, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import type { LayoutId, PatternId, ShapeId, TextureId, ThemeId } from '@/utils/types';
import { Chip, ColorField, Panel, Segmented, Slider, Toggle, cx } from './ui';

const SHAPE_GLYPH: Record<ShapeId, string> = {
  original: 'rounded-[3px]',
  rounded: 'rounded-[7px]',
  square: 'rounded-[3px] !w-5',
  circle: 'rounded-full !w-5',
  heart: 'rounded-[7px] !w-5 rotate-45',
};

export default function FrameSelector() {
  const { lang, theme, design, patchDesign, setTheme } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;
  const [category, setCategory] = useState<ThemeId>(theme);

  return (
    <div className="space-y-4">
      <Panel title={t('frame')}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => (
            <Chip
              key={id}
              active={category === id}
              onClick={() => {
                setCategory(id);
                if (theme !== id) setTheme(id);
              }}
              className="!px-3 !py-1.5 !text-[12px]"
            >
              {THEMES[id].emoji} {THEMES[id].label}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {FRAMES.filter((f) => f.category === category).map((f) => {
            const active = design.bg === f.design.bg && design.borderColor === f.design.borderColor;
            return (
              <motion.button
                key={f.id}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => patchDesign(f.design)}
                className={cx(
                  'group relative overflow-hidden rounded-[10px] border p-2 transition-all duration-200 shadow-subtle',
                  active
                    ? 'border-[#2F7898] bg-[#E3F0F5] ring-2 ring-[#2F7898]/30'
                    : 'border-[#D5E0E4] bg-white hover:border-[#C0CDD3] hover:bg-[#EEF3F5]',
                )}
              >
                <div
                  className="mb-2 aspect-[3/4] w-full rounded-[6px] shadow-sm"
                  style={{
                    background: `linear-gradient(150deg, ${f.swatch[0]}, ${f.swatch[1]})`,
                    boxShadow: `inset 0 0 0 2px ${f.swatch[1]}`,
                  }}
                />
                <p className="truncate text-[11px] font-semibold text-[#17242B]">{f.name}</p>
                {active && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#2F7898] text-white shadow-sm">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </Panel>

      <Panel title={t('layout')}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => (
            <Chip
              key={id}
              active={design.layout === id}
              onClick={() => patchDesign({ layout: id })}
              className="justify-center !px-2 !text-[12px]"
            >
              {LAYOUTS[id].label}
            </Chip>
          ))}
        </div>
      </Panel>

      <Panel title={t('shape')}>
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <Chip
              key={s.id}
              active={design.shape === s.id}
              onClick={() => patchDesign({ shape: s.id })}
              className="!px-3 !text-[12px]"
            >
              <span className={cx('block h-4 w-6 bg-current opacity-70', SHAPE_GLYPH[s.id])} />
              {s.label}
            </Chip>
          ))}
        </div>
      </Panel>

      <Panel title={t('background')}>
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[12px] text-white/70 font-medium">{t('pattern')}</span>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <Chip
                  key={p.id}
                  active={design.pattern === p.id}
                  onClick={() => patchDesign({ pattern: p.id as PatternId })}
                  className="!px-3 !py-1.5 !text-[12px]"
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <ColorField
            label={`${t('background')} · base`}
            value={design.bg}
            onChange={(v) => patchDesign({ bg: v })}
            swatches={['#FFFFFF', '#FBF7F2', '#0B0A12', '#101828', '#1B1033', '#120A1F']}
          />
          <ColorField
            label={`${t('background')} · accent`}
            value={design.bgAccent}
            onChange={(v) => patchDesign({ bgAccent: v })}
          />

          <div>
            <span className="mb-1.5 block text-[12px] text-white/70 font-medium">{t('texture')}</span>
            <Segmented
              options={TEXTURES.map((x) => ({ id: x.id as TextureId, label: x.label }))}
              value={design.texture}
              onChange={(v) => patchDesign({ texture: v })}
            />
          </div>
        </div>
      </Panel>

      <Panel title={t('borderThickness')}>
        <div className="space-y-4">
          <Slider
            accent={accent}
            label={t('borderThickness')}
            min={10}
            max={70}
            step={1}
            value={design.border}
            onChange={(v) => patchDesign({ border: v })}
            format={(v) => `${v}`}
          />
          <ColorField
            label={t('borderColor')}
            value={design.borderColor}
            onChange={(v) => patchDesign({ borderColor: v })}
          />
        </div>
      </Panel>

      <Panel title="Footer">
        <div className="space-y-3">
          <input
            value={design.title}
            onChange={(e) => patchDesign({ title: e.target.value })}
            placeholder="Event title"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-rose-400"
          />
          <input
            value={design.subtitle}
            onChange={(e) => patchDesign({ subtitle: e.target.value })}
            placeholder="Subtitle / names"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-rose-400"
          />
          <Toggle
            label="Show date"
            checked={design.showDate}
            onChange={(v) => patchDesign({ showDate: v })}
          />
        </div>
      </Panel>
    </div>
  );
}
