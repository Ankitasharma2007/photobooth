'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookmarkPlus, FolderOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useBooth } from '@/services/store';
import { THEMES } from '@/utils/design';
import { translate } from '@/utils/i18n';
import { formatDate } from '@/utils/renderStrip';
import { EmptyState, GlowButton, Panel } from './ui';

export default function TemplateManager() {
  const { lang, theme, templates, saveTemplate, applyTemplate, deleteTemplate, design } = useBooth();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const accent = THEMES[theme].accent;
  const [name, setName] = useState('');

  const commit = () => {
    saveTemplate(name || design.title || 'Untitled template');
    setName('');
  };

  return (
    <div className="space-y-4">
      <Panel title={t('saveTemplate')}>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            placeholder={design.title || 'Template name'}
            className="min-w-0 flex-1 rounded-[10px] border border-[#D5E0E4] bg-white px-3.5 py-2 text-[13px] text-[#17242B] outline-none transition-colors placeholder:text-[#8A97A0] focus:border-[#2F7898] shadow-subtle"
          />
          <GlowButton accent={accent} size="sm" onClick={commit}>
            <BookmarkPlus size={14} />
            Save
          </GlowButton>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-[#65747C]">
          Frames, colours, stickers and text are stored on this device — photos are not.
        </p>
      </Panel>

      <Panel title={t('templates')}>
        {templates.length === 0 ? (
          <EmptyState icon={<FolderOpen size={18} />} title={t('noTemplates')} body="Design a strip, then save it for the next event." />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {templates.map((tpl) => (
                <motion.li
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-[12px] border border-[#D5E0E4] bg-white p-2.5 transition-all hover:border-[#2F7898]/40 hover:bg-[#EEF3F5] shadow-subtle"
                >
                  <span
                    className="h-11 w-9 shrink-0 rounded-[6px] shadow-sm"
                    style={{
                      background: `linear-gradient(150deg, ${tpl.design.bg}, ${tpl.design.bgAccent})`,
                      boxShadow: `inset 0 0 0 2px ${tpl.design.borderColor}`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[13px] font-bold text-[#17242B]">{tpl.name}</p>
                    <p className="text-[11px] font-semibold text-[#65747C]">
                      {THEMES[tpl.design.theme].label} · {formatDate(new Date(tpl.createdAt))}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(tpl.id)}
                    aria-label={t('delete')}
                    className="icon-btn !h-7 !w-7 hover:!border-red-500 hover:!bg-red-50 hover:!text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>
    </div>
  );
}
