import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Select = forwardRef(function Select(
  { label, error, options = [], className = '', id, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={twMerge(
          clsx(
            'w-full bg-brand-white border border-brand-charcoal/20 px-4 py-2.5 text-sm text-brand-navy transition-colors duration-200 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy appearance-none cursor-pointer',
            error && 'border-red-500',
            className
          )
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});
