import React from 'react';
import { clsx } from 'clsx';

/**
 * GridSidebarLabel:
 * Columns 1-3 sidebar label:
 * 12px, Bold, Uppercase, Letter-spacing 0.2em, Color #7A7A7A.
 * Position: sticky top 32px on desktop, top metadata on mobile.
 */
export function GridSidebarLabel({ label, index, children, className = '' }) {
  return (
    <div className={clsx('lg:col-span-3', className)}>
      <div className="lg:sticky lg:top-28 space-y-3 pb-4 lg:pb-0">
        <div className="flex items-center space-x-2">
          {index && (
            <span className="font-mono text-xs text-[#1351AA] font-bold">
              {index}
            </span>
          )}
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">
            {label}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default GridSidebarLabel;
