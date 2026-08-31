import React from 'react';
import { clsx } from 'clsx';

/**
 * StatusLabel:
 * Restrained technical indicator:
 * READY / COMPLETED, PROCESSING / TRANSCRIBING, FAILED, QUEUED
 */
export function StatusLabel({ status, size = 'sm', className = '' }) {
  const normalized = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'READY':
      case 'COMPLETED':
      case 'PROCESSED':
      case 'ACTIVE':
      case 'SUCCESS':
        return 'border-[#1b6b36] text-[#1b6b36] bg-[#1b6b36]/10';
      case 'PROCESSING':
      case 'TRANSCRIBING':
      case 'DIARIZING':
      case 'ANALYZING':
      case 'IN_PROGRESS':
        return 'border-[#1351AA] text-[#1351AA] bg-[#1351AA]/10 animate-pulse';
      case 'FAILED':
      case 'ERROR':
      case 'REJECTED':
        return 'border-[#9e1c1c] text-[#9e1c1c] bg-[#9e1c1c]/10';
      case 'QUEUED':
      case 'PENDING':
      default:
        return 'border-[#7A7A7A] text-[#7A7A7A] bg-[#7A7A7A]/10';
    }
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-bold uppercase tracking-wider border select-none',
        getStyle(),
        sizes[size] || sizes.sm,
        className
      )}
    >
      {normalized}
    </span>
  );
}

export default StatusLabel;
