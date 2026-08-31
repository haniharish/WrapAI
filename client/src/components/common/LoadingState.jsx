import React from 'react';

export function LoadingState({ message = 'Loading intelligence data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 border-2 border-brand-sage/30 rounded-full" />
        <div className="absolute inset-0 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">{message}</p>
    </div>
  );
}
