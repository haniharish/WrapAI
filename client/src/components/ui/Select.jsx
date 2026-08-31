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
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-[0.15em] text-[#7A7A7A] mb-2">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={twMerge(
          clsx(
            'w-full bg-[#E3E2DE] sm:bg-white border border-[#C7C7C7] px-4 py-3 text-sm text-[#141414] transition-colors duration-300 ease-linear focus:outline-none focus:border-[#1351AA] focus:bg-white appearance-none cursor-pointer',
            error && 'border-[#9e1c1c]',
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
      {error && <p className="mt-1.5 text-xs text-[#9e1c1c] font-mono font-medium">{error}</p>}
    </div>
  );
});

export default Select;
