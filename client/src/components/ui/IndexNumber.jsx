import React from 'react';
import { clsx } from 'clsx';

export function IndexNumber({ number, className = '' }) {
  const formatted = typeof number === 'number' && number < 10 ? `0${number}` : number;
  return (
    <span className={clsx('font-mono text-xs font-bold text-[#7A7A7A]', className)}>
      {formatted}
    </span>
  );
}

export default IndexNumber;
