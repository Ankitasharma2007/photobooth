'use client';

import { AlignCenter, AlignLeft, AlignRight, Plus, Trash2, Type } from 'lucide-react';
import { useBooth } from '@/services/store';
import { FONTS, THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import type { TextItem } from '@/utils/types';
import { Chip, ColorField, EmptyState, GlowButton, Panel, Slider, Toggle, cx } from './ui';

const ALIGN = [
  { id: 'left' as const, Icon: AlignLeft },
  { id: 'center' as const, Icon: AlignCenter },
  { id: 'right' as const, Icon: AlignRight },
];

export default function TextEditor() {
  const { lang, theme, design, selectedItemId, addText, updateItem, removeItem, selectItem } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;

  const texts = design.items.filter((i): i is TextItem => i.kind === 'text');
  const selected = texts.find((i) => i.id === selectedItemId) ?? null;

  return (
    <div className="space-y-4">
      <Panel
        title={t('text')}
        action={
          <GlowButton accent={accent} size="sm" onClick={addText}>
            <Plus size={14} />
            {t('addText')}
          </GlowButton>
        }
      >
        {texts.length === 0 ? (
          <EmptyState
            icon={<Type size={18} />}
            title="No text layers"
            body="Add names, a hashtag or the date � then drag it anywhere on the strip."
          />
        ) : (
          <ul className="space-y-1">
            {texts.map((it) => (
              <li key={it.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectItem(it.id)}
                  className={cx(
                    'flex-1 truncate rounded-xl px-2.5 py-2 text-left text-[12.5px] transition-colors duration-300',
                    selectedItemId === it.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80',
                  )}
                  style={{ fontFamily: `"${it.font}", Inter, sans-serif` }}
                >
                  {it.text.split('\n')[0] || 'Text'}
                </button>
                <button
                  type="button"
                  className="icon-btn !h-8 !w-8 hover:!border-rose-300 hover:!bg-rose-100 hover:!text-rose-600"
                  aria-label={t('delete')}
                  onClick={() => removeItem(it.id)}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selected && (
        <>
          <Panel title="Content">
            <textarea
              value={selected.text}
              onChange={(e) => updateItem(selected.id, { text: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-[10px] border border-[#D5E0E4] bg-white px-3.5 py-2.5 text-[13px] text-[#17242B] leading-relaxed outline-none transition-colors placeholder:text-[#8A97A0] focus:border-[#2F7898] shadow-subtle"
              placeholder="Type here — Enter for a new line"
            />
          </Panel>

          <Panel title={t('font')}>
            <div className="flex flex-wrap gap-1.5">
              {FONTS.map((f) => (
                <Chip
                  key={f.id}
                  active={selected.font === f.id}
                  onClick={() => updateItem(selected.id, { font: f.id, weight: f.weight })}
                  className="!px-3 !py-1.5 !text-[12px]"
                >
                  <span style={{ fontFamily: `"${f.id}", Inter, sans-serif` }}>{f.label}</span>
                </Chip>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <Slider
                accent={accent}
                label={t('size')}
                min={12}
                max={140}
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

              <div>
                <span className="mb-1.5 block text-[12px] text-[#65747C] font-semibold">{t('align')}</span>
                <div className="flex gap-1.5">
                  {ALIGN.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateItem(selected.id, { align: id })}
                      aria-label={id}
                      className={cx(
                        'grid h-9 flex-1 place-items-center rounded-[8px] border transition-colors duration-200 shadow-subtle',
                        selected.align === id
                          ? 'border-[#2F7898] bg-[#2F7898] text-white'
                          : 'border-[#D5E0E4] bg-white text-[#52616A] hover:bg-[#EEF3F5]',
                      )}
                    >
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>

              <ColorField
                label={t('colour')}
                value={selected.color}
                onChange={(v) => updateItem(selected.id, { color: v })}
              />

              <Toggle
                label={t('shadow')}
                checked={selected.shadow}
                onChange={(v) => updateItem(selected.id, { shadow: v })}
              />

              <Slider
                accent={accent}
                label={t('stroke')}
                min={0}
                max={10}
                step={0.5}
                value={selected.strokeWidth}
                onChange={(v) => updateItem(selected.id, { strokeWidth: v })}
                format={(v) => (v === 0 ? 'Off' : `${v}px`)}
              />
              {selected.strokeWidth > 0 && (
                <ColorField
                  label={`${t('stroke')} ${t('colour').toLowerCase()}`}
                  value={selected.strokeColor}
                  onChange={(v) => updateItem(selected.id, { strokeColor: v })}
                />
              )}

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
        </>
      )}
    </div>
  );
}
