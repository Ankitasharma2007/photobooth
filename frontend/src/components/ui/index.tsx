'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------------- Ambient background ---------------- */

export function Aurora({ accent = '#2F7898' }: { accent?: string; glow?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #2F7898 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F7F8F8] to-transparent" />
    </div>
  );
}

/* ---------------- Buttons ---------------- */

export function GlowButton({
  children,
  onClick,
  accent = '#2F7898',
  size = 'md',
  variant = 'solid',
  disabled,
  className,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'outline';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const pad =
    size === 'lg'
      ? 'px-6 py-3 text-sm font-semibold'
      : size === 'sm'
        ? 'px-3.5 py-1.5 text-xs font-semibold'
        : 'px-4 py-2 text-xs sm:text-sm font-semibold';

  const base =
    'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-[10px] tracking-normal transition-all duration-150 ease-out hover:-translate-y-[1px] disabled:pointer-events-none disabled:bg-[#EEF3F5] disabled:text-[#8A97A0] disabled:border-[#D5E0E4]';

  const skin =
    variant === 'solid'
      ? 'text-white font-semibold bg-[#2F7898] hover:bg-[#276984] shadow-subtle border border-[#2F7898]'
      : variant === 'outline'
        ? 'border border-[#D5E0E4] bg-white text-[#17242B] font-semibold hover:bg-[#EEF3F5] hover:border-[#C0CDD3] shadow-subtle'
        : 'text-[#65747C] font-semibold hover:text-[#17242B] hover:bg-[#EEF3F5]';

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cx(base, pad, skin, className)}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button type="button" title={title} onClick={onClick} className={cx('chip', active && 'chip-active', className)}>
      {children}
    </button>
  );
}

/* ---------------- Panels ---------------- */

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cx('glass p-4', className)}>
      <span className="hairline" />
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between">
          {title && <h3 className="panel-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------------- Inputs ---------------- */

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  accent = '#2F7898',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-[#65747C]">
        <span>{label}</span>
        <span className="tabular-nums text-[#17242B] font-semibold">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%`, ['--accent' as string]: accent }}
      />
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatches?: string[];
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium text-[#65747C]">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-[8px] border border-[#D5E0E4] shadow-subtle">
          <span className="absolute inset-0" style={{ background: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(swatches ?? DEFAULT_SWATCHES).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-label={s}
              className={cx(
                'h-6 w-6 rounded-[6px] border transition-transform duration-150 hover:scale-105 shadow-subtle',
                value.toLowerCase() === s.toLowerCase() ? 'border-[#2F7898] ring-2 ring-[#2F7898]/30' : 'border-[#D5E0E4]',
              )}
              style={{ background: s }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const DEFAULT_SWATCHES = [
  '#FFFFFF',
  '#F7F8F8',
  '#EEF3F5',
  '#2F7898',
  '#5A9BB7',
  '#17242B',
  '#202C33',
  '#8A97A0',
];

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div className="relative flex gap-1 rounded-[10px] border border-[#D5E0E4] bg-[#EEF3F5] p-1">
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-[8px] bg-[#2F7898] transition-[left] duration-150 ease-out shadow-subtle"
        style={{
          left: `calc(0.25rem + ${(idx * 100) / options.length}%)`,
          width: `calc(${100 / options.length}% - 0.25rem)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cx(
            'relative z-10 flex-1 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150',
            value === o.id ? 'text-white' : 'text-[#65747C] hover:text-[#17242B]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-[8px] px-1 py-1.5 text-[12.5px] font-semibold text-[#65747C] transition-colors hover:text-[#17242B]"
    >
      <span>{label}</span>
      <span
        className={cx(
          'relative h-5 w-9 rounded-full transition-colors duration-150',
          checked ? 'bg-[#2F7898]' : 'bg-[#D5E0E4]',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          className={cx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-subtle',
            checked ? 'right-0.5' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}

/* ---------------- Filter preview tile ---------------- */

export function FilterTile({
  label,
  filter,
  src,
  fallback,
  active,
  onClick,
}: {
  label: string;
  filter: string;
  src?: string;
  fallback: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className="group flex flex-col items-center gap-1.5"
    >
      <span
        className={cx(
          'relative block aspect-square w-full overflow-hidden rounded-[8px] border transition-all duration-150 shadow-subtle',
          active
            ? 'border-[#2F7898] ring-2 ring-[#2F7898]/30 bg-[#E3F0F5]'
            : 'border-[#D5E0E4] group-hover:border-[#2F7898]/40 bg-[#EEF3F5]',
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            className="h-full w-full object-cover drag-none"
            style={{ filter }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#65747C] text-[10px] font-semibold">
            {label[0]}
          </div>
        )}
      </span>
      <span
        className={cx(
          'text-[11px] font-semibold transition-colors duration-150',
          active ? 'text-[#2F7898] font-semibold' : 'text-[#65747C] group-hover:text-[#17242B]',
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ---------------- States ---------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#D5E0E4] border-t-[#2F7898]',
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-[10px] border border-[#CBE0EA] bg-[#E3F0F5] text-[#2F7898]">
        {icon}
      </div>
      <p className="text-xs font-semibold text-[#17242B]">{title}</p>
      {body && <p className="max-w-[32ch] text-[11.5px] leading-relaxed text-[#65747C]">{body}</p>}
      {action}
    </div>
  );
}
