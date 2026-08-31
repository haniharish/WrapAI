import React from 'react';

export function AmbientBackground({ className = '' }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {/* Orb 1: Sage */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-sage opacity-25 blur-[120px] animate-float" />
      {/* Orb 2: Soft Blue */}
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-brand-blue opacity-20 blur-[130px] animate-float-slow" />
      {/* Orb 3: Cyan */}
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-brand-cyan opacity-25 blur-[110px] animate-pulse-slow" />
    </div>
  );
}
