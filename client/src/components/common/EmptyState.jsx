import React from 'react';
import { PosterButton } from '../ui/PosterButton.jsx';

export function EmptyState({
  title = 'NO DATA AVAILABLE',
  description = 'Upload or record content to generate transcriptions and intelligence.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 sm:p-16 text-center border border-[#C7C7C7] bg-white/50 space-y-4 ${className}`}>
      <span className="font-mono text-xs font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">
        NULL RECORD
      </span>
      <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#141414]">
        {title}
      </h3>
      <p className="text-sm text-[#444343] max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <PosterButton variant="primary" onClick={onAction}>
            {actionLabel}
          </PosterButton>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
