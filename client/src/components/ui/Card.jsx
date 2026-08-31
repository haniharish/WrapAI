import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white/70 border border-[#C7C7C7] p-6 sm:p-8 transition-colors duration-300 ease-linear',
          hover && 'hover:bg-white hover:border-[#1351AA]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
