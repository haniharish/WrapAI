import React from 'react';
import { clsx } from 'clsx';

export function GridCell({ index, title, description, children, className = '' }) {
  return (
    <div
      className={clsx(
        'border border-[#C7C7C7] p-6 sm:p-8 bg-transparent hover:bg-white/40 transition-colors duration-300 ease-linear flex flex-col justify-between space-y-6',
        className
      )}
    >
      <div className="space-y-4">
        {index && (
          <span className="font-mono text-sm font-bold text-[#7A7A7A] block">
            {index}
          </span>
        )}
        {title && (
          <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414]">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs sm:text-sm text-[#444343] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default GridCell;
