import React from 'react';
import { PosterButton } from '../ui/PosterButton.jsx';

export function ErrorState({
  title = 'SYSTEM FAULT',
  message = 'An unexpected error occurred while communicating with the intelligence service.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-[#9e1c1c] bg-[#9e1c1c]/5 space-y-3 ${className}`}>
      <span className="font-mono text-xs font-bold text-[#9e1c1c] uppercase tracking-[0.2em]">
        ERROR CODE 500
      </span>
      <h3 className="text-2xl font-bold uppercase tracking-tight text-[#9e1c1c]">
        {title}
      </h3>
      <p className="text-sm text-[#444343] max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <PosterButton variant="secondary" size="sm" onClick={onRetry}>
            RETRY OPERATION
          </PosterButton>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
