import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-sage/30 text-brand-navy border-brand-sage',
    navy: 'bg-brand-navy text-brand-white border-brand-navy',
    cyan: 'bg-brand-cyan text-brand-navy border-cyan-300',
    blue: 'bg-brand-blue text-brand-navy border-blue-300',
    beige: 'bg-brand-beige/50 text-brand-navy border-brand-beige',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    danger: 'bg-red-50 text-red-800 border-red-300'
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}
