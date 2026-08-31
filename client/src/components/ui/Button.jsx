import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 tracking-wide select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-navy text-brand-white hover:bg-brand-charcoal active:scale-[0.98] border border-brand-navy shadow-sm',
    secondary: 'bg-brand-sage/25 text-brand-navy hover:bg-brand-sage/40 border border-brand-sage/50',
    outline: 'bg-transparent text-brand-navy border border-brand-navy/30 hover:border-brand-navy hover:bg-brand-navy/5',
    ghost: 'bg-transparent text-brand-navy hover:bg-brand-sage/20 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    luxury: 'bg-gradient-to-r from-brand-navy to-brand-charcoal text-brand-white border border-brand-charcoal hover:shadow-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs uppercase tracking-wider',
    md: 'px-5 py-2.5 text-sm uppercase tracking-wider',
    lg: 'px-7 py-3.5 text-base uppercase tracking-widest'
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={clsx('w-4 h-4', children ? 'mr-2' : '')} />
      ) : null}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className={clsx('w-4 h-4', children ? 'ml-2' : '')} />
      )}
    </button>
  );
}
