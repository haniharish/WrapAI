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
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-taupe">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-brand-white border border-brand-charcoal/20 px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-taupe/70 transition-colors duration-200 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy',
              Icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-brand-taupe">{helperText}</p>}
    </div>
  );
});
