import React from 'react';
import { clsx } from 'clsx';

/**
 * PosterButton component:
 * Primary: Background #1351AA, Text #E3E2DE, Hover #141414
 * Secondary: Background #141414, Text #E3E2DE, Hover #1351AA
 * Outline: 1px border #C7C7C7, Text #141414, Hover bg #1351AA text #E3E2DE
 * 0px border radius, 0.3s linear transition
 */
export function PosterButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider transition-all duration-300 ease-linear cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border select-none';

  const variants = {
    primary:
      'bg-[#1351AA] text-[#E3E2DE] border-[#1351AA] hover:bg-[#141414] hover:border-[#141414] hover:text-[#E3E2DE]',
    secondary:
      'bg-[#141414] text-[#E3E2DE] border-[#141414] hover:bg-[#1351AA] hover:border-[#1351AA] hover:text-[#E3E2DE]',
    outline:
      'bg-transparent text-[#141414] border-[#C7C7C7] hover:bg-[#1351AA] hover:border-[#1351AA] hover:text-[#E3E2DE]',
    ghost:
      'bg-transparent text-[#141414] border-transparent hover:bg-[#141414]/10 hover:text-[#1351AA]',
    danger:
      'bg-[#9e1c1c] text-[#E3E2DE] border-[#9e1c1c] hover:bg-[#141414] hover:border-[#141414]'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[11px]',
    md: 'px-6 py-3 text-xs tracking-wider',
    lg: 'px-8 py-4 text-sm tracking-widest font-extrabold',
    xl: 'px-10 py-5 text-base tracking-widest font-black'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(baseStyles, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2.5 flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export default PosterButton;
