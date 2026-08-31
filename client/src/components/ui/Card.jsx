import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-brand-white border border-brand-charcoal/15 p-6 transition-all duration-300',
          hover && 'hover:border-brand-navy hover:shadow-lg hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
