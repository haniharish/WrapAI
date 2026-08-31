import React from 'react';
import { clsx } from 'clsx';

export function MetadataRow({ label, value, className = '' }) {
  return (
    <div className={clsx('flex items-center justify-between py-2 border-b border-[#C7C7C7] text-xs', className)}>
      <span className="font-bold uppercase tracking-[0.15em] text-[#7A7A7A]">{label}</span>
      <span className="font-mono font-medium text-[#141414]">{value}</span>
    </div>
  );
}

export default MetadataRow;
