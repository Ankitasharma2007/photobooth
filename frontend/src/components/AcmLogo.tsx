'use client';

import { cx } from './ui';

export function AcmLogo({
  className = 'h-8 sm:h-9 w-auto',
  showTitle = true,
}: {
  className?: string;
  showTitle?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/acm-thapar-logo.png"
        alt="ACM Thapar Chapter"
        className={cx('h-8 sm:h-9 w-auto object-contain drag-none filter drop-shadow-sm', className)}
      />
      {showTitle && (
        <div className="leading-tight hidden sm:block">
          <p className="text-sm font-extrabold tracking-tight text-[#18232B]">ACM Photo Booth</p>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#347A9A]">Thapar Student Chapter</p>
        </div>
      )}
    </div>
  );
}
