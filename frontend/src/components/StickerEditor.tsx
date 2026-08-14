'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Eraser, Sticker, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useBooth } from '@/services/store';
import { DECOR_PRESETS, STICKER_CATEGORIES, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import { itemLabel } from './PhotoCanvas';
import { Chip, EmptyState, GlowButton, Panel, Slider, cx } from './ui';

export default function StickerEditor() {
  const {
    lang,
    theme,
    design,
    selectedItemId,
    addSticker,
    updateItem,
    removeItem,
    raiseItem,
    selectItem,
    beautifyStickers,
    clearStickers,
    applyDecorPreset,
  } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;
  const [cat, setCat] = useState(STICKER_CATEGORIES[0].id);
  const stickers = STICKER_CATEGORIES.find((c) => c.id === cat)?.stickers ?? [];
  const selected = design.items.find((i) => i.id === selectedItemId);

  const stickerCount = design.items.filter((i) => i.kind === 'sticker').length;

  return (
    <div className="space-y-4">
      <Panel title="Auto decoration">
        <div className="mb-3 grid grid-cols-4 gap-1.5">
          {DECOR_PRESETS.map((p) => (
            <Chip
              key={p.id}
              onClick={() => applyDecorPreset(p.id)}
              className="justify-center !px-2 !py-1.5 !text-[11.5px]"
            >
              {p.label}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <GlowButton
            accent={accent}
            size="sm"
            className="flex-1"
            disabled={stickerCount === 0}
            onClick={beautifyStickers}
          >
            <Wand2 size={14} />
            Beautify layout
          </GlowButton>
          <Chip onClick={clearStickers} className="!text-[12px]">
            <Eraser size={13} />
            Reset
          </Chip>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-white/35">
          Decorations snap to frame corners, margins and bands — the centre of every photo
          stays clear of the subject.
        </p>
      </Panel>

      <Panel title={t('stickers')}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {STICKER_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={cat === c.id}
              onClick={() => setCat(c.id)}
              className="!px-3 !py-1.5 !text-[12px]"
            >
              {c.label}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {stickers.map((s, i) => (
            <motion.button
              key={`${s}-${i}`}
              type="button"
              whileHover={{ scale: 1.14, y: -3 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => addSticker(s)}
              className="grid aspect-square place-items-center rounded-2xl border border-white/[0.07] bg-[#FFFDFC]/70 text-[27px] leading-none shadow-[0_6px_18px_-12px_rgba(150,96,110,0.6)] transition-colors hover:border-blush-300 hover:bg-white"
            >
              {s}
            </motion.button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/30">
          Tap to place · drag on the strip to move · corner dot resizes · top dot rotates
          (hold Shift to snap 15°).
        </p>
      </Panel>

      {selected && (
        <Panel title="Selected">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-lg">
                {selected.kind === 'sticker' ? selected.char : 'T'}
              </span>
              <p className="flex-1 truncate text-[13px] text-white/70">{itemLabel(selected)}</p>
              <button
                type="button"
                className="icon-btn !h-8 !w-8"
                aria-label={t('layerUp')}
                title={t('layerUp')}
                onClick={() => raiseItem(selected.id, 1)}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="icon-btn !h-8 !w-8"
                aria-label={t('layerDown')}
                title={t('layerDown')}
                onClick={() => raiseItem(selected.id, -1)}
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                className="icon-btn !h-8 !w-8 hover:!border-rose-300 hover:!bg-rose-100 hover:!text-rose-600"
                aria-label={t('delete')}
                onClick={() => removeItem(selected.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>

            <Slider
              accent={accent}
              label={t('size')}
              min={16}
              max={selected.kind === 'sticker' ? 320 : 200}
              step={1}
              value={selected.size}
              onChange={(v) => updateItem(selected.id, { size: v })}
            />
            <Slider
              accent={accent}
              label={t('rotate')}
              min={-180}
              max={180}
              step={1}
              value={selected.rotation}
              onChange={(v) => updateItem(selected.id, { rotation: v })}
              format={(v) => `${v}°`}
            />
            <Slider
              accent={accent}
              label="Opacity"
              min={0.1}
              max={1}
              step={0.01}
              value={selected.opacity}
              onChange={(v) => updateItem(selected.id, { opacity: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        </Panel>
      )}

      <Panel title="Layers">
        {design.items.length === 0 ? (
          <EmptyState icon={<Sticker size={18} />} title="Nothing on the strip yet" body="Add a sticker or a line of text." />
        ) : (
          <ul className="space-y-1">
            {[...design.items].reverse().map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => selectItem(it.id)}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition-colors duration-300',
                    selectedItemId === it.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80',
                  )}
                >
                  <span className="w-5 text-center text-base">
                    {it.kind === 'sticker' ? it.char : 'T'}
                  </span>
                  <span className="flex-1 truncate">{itemLabel(it)}</span>
                  <span className="text-[10.5px] text-white/25">{Math.round(it.size)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
