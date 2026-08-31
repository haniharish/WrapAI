import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-white/60 text-[#141414] border-[#C7C7C7]',
    navy: 'bg-[#141414] text-[#E3E2DE] border-[#141414]',
    blue: 'bg-[#1351AA] text-[#E3E2DE] border-[#1351AA]',
    success: 'bg-[#1b6b36]/10 text-[#1b6b36] border-[#1b6b36]',
    warning: 'bg-amber-500/10 text-amber-800 border-amber-500/40',
    danger: 'bg-[#9e1c1c]/10 text-[#9e1c1c] border-[#9e1c1c]'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs'
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-mono font-bold uppercase tracking-wider border select-none',
          variants[variant] || variants.default,
          sizes[size] || sizes.sm,
          className
        )
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
