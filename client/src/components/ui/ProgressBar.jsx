import React from 'react';

export function ProgressBar({ progress = 0, label, showValue = true, className = '' }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold uppercase tracking-wider text-brand-charcoal">
          <span>{label}</span>
          {showValue && <span className="font-mono">{clamped}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-brand-sage/30 overflow-hidden">
        <div
          className="h-full bg-brand-navy transition-all duration-500 ease-luxury"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
