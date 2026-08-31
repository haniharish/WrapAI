import React from 'react';
import { clsx } from 'clsx';

export function StatCard({ label, value, subtext, index, className = '' }) {
  return (
    <div
      className={clsx(
        'border border-[#C7C7C7] p-6 sm:p-8 bg-white/60 hover:bg-white hover:border-[#1351AA] transition-colors duration-300 ease-linear flex flex-col justify-between space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">{label}</span>
        {index && <span className="font-mono text-xs font-bold text-[#1351AA]">{index}</span>}
      </div>
      <div>
        <p className="text-4xl sm:text-5xl font-black text-[#141414] tracking-tight font-mono">
          {value}
        </p>
      </div>
      {subtext && (
        <p className="text-xs font-mono text-[#7A7A7A] uppercase tracking-wider">{subtext}</p>
      )}
    </div>
  );
}

export default StatCard;
