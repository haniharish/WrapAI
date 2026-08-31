import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(function Input(
  { label, error, helperText, className = '', id, icon: Icon, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-[0.15em] text-[#7A7A7A] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7A7A]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-[#E3E2DE] sm:bg-white border border-[#C7C7C7] px-4 py-3 text-sm text-[#141414] placeholder:text-[#7A7A7A] transition-colors duration-300 ease-linear focus:outline-none focus:border-[#1351AA] focus:bg-white',
              Icon && 'pl-10',
              error && 'border-[#9e1c1c] focus:border-[#9e1c1c]',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[#9e1c1c] font-mono font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-[#7A7A7A]">{helperText}</p>}
    </div>
  );
});

export default Input;
