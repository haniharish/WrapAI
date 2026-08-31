import React from 'react';

export function ProgressBar({ progress = 0, label, showValue = true, variant = 'blue', className = '' }) {
  const clamped = Math.min(100, Math.max(0, progress));
  const fillColors = {
    blue: 'bg-[#1351AA]',
    black: 'bg-[#141414]',
    success: 'bg-[#1b6b36]'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#7A7A7A]">
          <span>{label}</span>
          {showValue && <span className="font-mono text-[#141414]">{clamped}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-white/70 border border-[#C7C7C7] p-0.5">
        <div
          className={`h-full ${fillColors[variant] || fillColors.blue} transition-all duration-300 ease-linear`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
