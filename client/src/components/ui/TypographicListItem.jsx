import React from 'react';
import { clsx } from 'clsx';

/**
 * TypographicListItem:
 * 100-150px height, 1px top border #C7C7C7
 * Index: Mono, Muted #7A7A7A
 * Title: Large Bold Uppercase, Hover #1351AA
 */
export function TypographicListItem({
  index,
  title,
  subtitle,
  description,
  rightContent,
  onClick,
  className = ''
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group border-t border-[#C7C7C7] py-6 sm:py-8 transition-colors duration-300 ease-linear',
        onClick ? 'cursor-pointer hover:bg-white/40' : '',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
        <div className="md:col-span-2 font-mono text-sm font-bold text-[#7A7A7A] group-hover:text-[#1351AA] transition-colors">
          {index}
        </div>
        <div className="md:col-span-7 space-y-1">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors duration-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-mono text-[#7A7A7A] uppercase tracking-wider">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-[#444343] leading-relaxed pt-1">{description}</p>
          )}
        </div>
        {rightContent && (
          <div className="md:col-span-3 flex md:justify-end items-center pt-2 md:pt-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

export default TypographicListItem;
